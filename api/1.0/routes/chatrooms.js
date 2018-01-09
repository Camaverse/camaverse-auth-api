const mongoose = require('mongoose');
const passport = require('passport');
const config = require('../config/database');
require('../config/passport')(passport);
const express = require('express');
const router = express.Router();
const Broadcasters = require("../models/broadcaster");
const ChatRooms = require("../models/chatrooms");
const ChatMessages = require("../models/chatmessages");

const ApiResponse = require('../ApiResponse');
const Success = ApiResponse.SuccessResponse;

const qryOptions = { new: true, fields: 'username slug status tags approved images show isAway topic users userSlugs ' }

exports = module.exports = function(io) {

    let socket = null;
    io.on('connection', function(soc){
        socket = soc

        socket.on('updateTopic', (obj, cb) => {
            let search = {_id: obj._id}
            let events = {
                date: Date.now(),
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
                date: Date.now(),
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
                        socket.join(cr._id)
                        cb([cr])
                        io.emit('showChange', [cr])
                    }
                })
            })
        })

        socket.on('goAway', (slug, cb) => {
            console.log('--- goaway ---', slug)
            let qry = {show: 'public', status: 'online', slug}
            let events = {
                date: Date.now(),
                event: 'away'
            }
            let update = {$set: {isAway: true}, $push: {events}}
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, cr) => {
                if (err) cb(err)
                else {
                    cb([cr])
                    io.emit('showChange', [cr])
                }
            })
        })

        socket.on('resumeShow', (slug, cb) => {
            let qry = {show: 'public', status: 'online', slug, isAway: true}
            let events = {
                date: Date.now(),
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
            let updateObj = {endedAt: Date.now(), isAway: false, status: 'offline'}
            let update = {$set: updateObj}
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, cr) => {
                if (err) cb(err)
                else {
                    cb([cr])
                    io.emit('showChange', [cr])
                }
            })
        })

        socket.on('leaveRoom', (obj) => {
            let qry = { _id: obj.room }
            let update = { $pull: { users: { slug: obj.user }, userSlugs: obj.user } }
            ChatRooms.findOneAndUpdate(qry, update, qryOptions, (err, doc) => {
                if (err) console.log({err})
                else {
                    let successEmit = { _id: obj.room, remove: [{ slug: obj.user }] }
                    socket.leave(obj.room);
                    socket.in(obj.room).emit('updateViewers', successEmit)
                    io.emit('updateViewers', successEmit)
                }
            })
        })
    })

    const apiSuccess = (res, status, data) => {
        res.status(status).json(new Success(data))
    }

    const addUserToRoom = (res, doc_room, doc_msgs, user) => {
        let successObj = {room: doc_room, messages: doc_msgs}
        let successEmit = { room: doc_room._id, add: [user] }
        socket.join(doc_room._id)
        if (doc_room.userSlugs.indexOf(user.slug) === -1) {
            doc_room.users.push(user)
            doc_room.userSlugs.push(user.slug)
            doc_room.save((err, doc) => {
                if (err) res.status(500).json({err})
                else {
                    apiSuccess(res, 200, successObj)
                    socket.in(doc_room._id).emit('updateViewers', successEmit)
                }
            })
        } else {
            apiSuccess(res, 200, successObj)
            socket.in(doc_room._id).emit('updateViewers', successEmit)
        }
    }

    // POST: /v1.0/chatrooms/:id
    // Add users to a room
    router.post('/:id', (req, res) => {
        let id = req.params.id
        ChatRooms.findById(id,  (err,doc_room) => {
            if (err) res.status(500).json({err})
            else if (!doc_room) res.status(500).json({err: "no room found"})
            else {
                ChatMessages.find({'to.id': id}, (err, doc_msgs) => {
                    if (req.body.user && doc_room) addUserToRoom(res, doc_room, doc_msgs, req.body.user )
                    else apiSuccess(res, 200, {room: doc_room, messages: doc_msgs})
                });
            }
        })
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