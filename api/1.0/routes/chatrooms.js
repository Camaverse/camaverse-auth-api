const express = require('express');
const router = express.Router();
const Broadcasters = require("../models/broadcaster");
const ChatRooms = require("../models/chatrooms");
const ChatMessages = require("../models/chatmessages");
const chatRoom = require('./chatrooms.helpers')

const ApiResponse = require('../helpers/ApiResponse');
const Success = ApiResponse.SuccessResponse;

const qryOptions = { new: true, fields: 'username slug isOnline tags approved images show isAway topic users userSlugs ' }

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

exports = module.exports = function(io) {

    let socket = null;
    io.on('connection', function(soc){
        socket = soc

        socket.on('updateTopic', (obj, cb) => {
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
        })

        socket.on('updateTags', (obj, cb) => {
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
        })

        socket.on('createShow', (obj, cb) => {

            Broadcasters.findOne({slug: obj.slug}, (err, broadcaster) => {
                let newShow = {show: obj.show, slug: obj.slug, username: obj.username, images: broadcaster.images, socket: socket.id}
                let cr = new ChatRooms(newShow)
                broadcaster.room = cr._id
                broadcaster.save((err)=> {
                    if (err) console.log(err)
                } )

                cr.save((err, cr) => {
                    if (err) cb(err)
                    else {
                        console.log('join('+cr._id+')')
                        socket.join(cr._id)
                        cb([cr])
                        io.emit('showChange', [cr])
                    }
                })
            })
        })

        socket.on('goAway', (slug, cb) => {
            let qry = {show: 'public', isOnline: true, slug}
            let events = {
                date: nowDate(),
                event: 'away'
            }
            let update = {$set: {isAway: true}, $push: {events}}
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, cr) => {
                if (err) cb(err)
                else if (cr === null) console.log('CR NOT FOUND', qry, update)
                else {
                    console.log(cr)
                    cb([cr])
                    io.emit('showChange', [cr])
                }
            })
        })

        socket.on('resumeShow', (slug, cb) => {
            let qry = {show: 'public', isOnline: true, slug, isAway: true}
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
        })

        socket.on('goOffline', (_id, cb) => {
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
        })

        socket.on('leaveRoom', (data) => {
            chatRoom.removeUserFromRoom(data.room, data.user, null, socket)
        })
    })

    // POST: /v1.0/chatrooms/:id
    // Add users to a room
    router.post('/:id', (req, res) => {
        let _id = req.params.id
        let user = req.body.user
        chatRoom.addUserToRoom(_id, user, res, socket)
    })

    // GET: /v1.0/chatrooms/:slug/:show
    router.get('/:slug/:show', (req, res) => {
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
    });

    return router;
}