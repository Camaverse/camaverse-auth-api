const express = require('express');
const Broadcasters = require("../broadcasters/broadcasters.model");
const ChatRooms = require("./chatrooms.model");
const ChatMessages = require("../chatmessages/chatmessages.model");
const chatRoom = require('./chatrooms.helpers')

const ApiResponse = require('../../helpers/ApiResponse');
const Success = ApiResponse.SuccessResponse;

const qryOptions = { new: true, fields: 'username slug isOnline tags approved images show isAway topic users' }

const pad = (num) => (num < 10) ? `0${num}` : num;

const nowDate = () => {
    var date = new Date()

    var day = date.getDate()
    var month = pad(date.getMonth()+1)
    var year = date.getFullYear()

    var hour = date.getHours()
    var min = pad(date.getMinutes()+1)
    var sec = date.getSeconds()
    var mil = date.getMilliseconds()

    return `${year}-${month}-${day} ${hour}:${min}:${sec}.${mil}`
}

module.exports = {
    watchInit (watch, socket, cb) {
        let qry = {slug: watch.broadcaster, isOnline: true}
        const fields = 'slug broadcasterID socket username topic users tags show isOnline isAway'

        ChatRooms.find(qry, fields)
            .then((rooms) => {

                console.log(rooms)

                let roomsLength = rooms.length;
                let roomsArr = [];
                let start = Date.now();
                const log = {
                    start,
                    stop: null
                }
                const { slug } = watch.user
                rooms.forEach((room) => {
                    let ref;

                    if (!room.users) {
                        ref = watch.user;
                        ref.logs = []

                        room.users = {};
                        room.users[slug] = ref
                    } else if (!room.users[slug]) {
                        ref = watch.user;
                        ref.logs = []

                        room.users[slug] = ref
                    } else if (room.users[slug]) {
                        ref = room.users[slug]
                    }

                    ref.logs.push(log);
                    ref.inRoom = true;

                    room.markModified('users');
                    room.save()
                        .then((newRoom) => {
                            const usrs = newRoom.users;
                            let onlineUsers = {}

                            console.log('join: ', newRoom._id)
                            socket.join(newRoom._id)

                            for (let i in usrs){
                                if (usrs[i].inRoom) onlineUsers[i] = usrs[i];
                            }
                            newRoom.users = onlineUsers;

                            ChatMessages.find({to: newRoom._id})
                                .then((messages) => {
                                    newRoom.messages = messages
                                    roomsArr.push(newRoom)
                                    --roomsLength
                                    if (!roomsLength) {
                                        cb(roomsArr)
                                    }
                                })
                        })
                        .catch((error) => {
                            cb(err)
                            console.log({error})
                        })

                })
            } )
    },
    updateTopic (obj, cb) {
            let search = {_id: obj._id}
            let events = {
                date: nowDate(),
                event: 'update topic',
                topic: obj.topic
            }
            let update = { $set: { topic: obj.topic, $push: { events }}}
            ChatRooms.findOneAndUpdate(search, update, qryOptions, (err, room) => {
                let emit = {
                    _id: room._id,
                    slug: room.slug,
                    topic: obj.topic
                }
                cb(room)
                io.emit('updateTopic', emit)
            })
        },

        updateTags (obj, cb) {
            let search = {_id: obj._id}
            let events = {
                date: nowDate(),
                event: 'update tags',
                topic: obj.tags
            }
            let update = { $set: { tags: obj.tags, $push: { events }}}
            ChatRooms.findOneAndUpdate(search, update, qryOptions, (err, room) => {
                let emit = {
                    _id: room._id,
                    slug: room.slug,
                    tags: obj.tags
                }
                cb(room)
                io.emit('updateTags', emit)
            })
        },

        createShow (obj, cb) {

            Broadcasters.findOne({slug: obj.slug}, (err, broadcaster) => {
                let newShow = {show: obj.show, broadcasterID: obj._id,
                    slug: obj.slug, username: obj.username, images: broadcaster.images, socket: socket.id}
                let cr = new ChatRooms(newShow)
                broadcaster.room = cr._id
                broadcaster.save((err)=> {
                    if (err) console.log(err)
                } )

                cr.save((err, cr) => {
                    if (err) cb(err)
                    else {
                        socket.join(cr._id)
                        cb([cr])
                        io.emit('showChange', [cr])
                    }
                })
            })
        },

        goAway (_id, cb) {
            let qry = {_id}
            let events = {
                date: nowDate(),
                event: 'away'
            }
            let update = {$set: {isAway: true}, $push: {events}}
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, cr) => {
                if (err) cb(err)
                else if (cr === null) console.log('CR NOT FOUND', qry, update)
                else {
                    cb([cr])
                    io.emit('showChange', [cr])
                }
            })
        },

        resumeShow (_id, cb) {
            let qry = {_id}
            let events = {
                date: nowDate(),
                event: 'resume'
            }
            let update = {$set: {isAway: false}, $push: {events}}
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, cr) => {
                if (err) cb(err)
                else {
                    cb([cr])
                    io.emit('showChange', [cr])
                }
            })
        },

        goOffline (_id, cb) {
            let qry = {_id}
            let updateObj = {endedAt: nowDate(), isAway: false, isOnline: false}
            let update = {$set: updateObj}
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, cr) => {
                if (err) cb(err)
                else {
                    cb([cr])
                    io.emit('showChange', [cr])
                }
            })
        },

        leaveRoom ({_id, user}) {
            console.log('LEAVE ROOM', _id)
            ChatRooms
                .findOne({_id})
                .then((room) => {

                    console.log(room)

                    if (room.users[user]) {
                        const usr = room.users[user];

                        usr.inRoom = false;
                        usr.logs[usr.logs.length-1].stop = Date.now()

                        room.markModified('users')
                        room.save()
                            .then((room) => {
                                console.log(room)
                            })
                            .catch((err) => {
                                    console.log(err)
                            })
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        },

        // POST: /v1.0/chatrooms/:id
        // Add users to a room
        join (req, res) {
            let _id = req.params.id
            let user = req.body.user
            chatRoom.addUserToRoom(_id, user, res, socket)
        },

        // GET: /v1.0/chatrooms/:slug/:show
        getShow (req, res) {
            ChatRooms.findOne({slug: req.params.slug, show: req.params.show},
                (err,data) => {
                    if (err) res.status(500).json({err})
                    if (!data) res.status(500).json({err: "no rooms found"})
                    else {
                        ChatMessages.find({'to.show': req.params.show}, (err, msgs) => {
                            data.messages = msgs
                            data = {room: data, messages: msgs}
                            res.status(200).json(new Success(data))
                        });
                    }
                })
        }

}