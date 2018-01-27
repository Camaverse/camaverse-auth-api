const express = require('express');
const router = express.Router();
const Broadcaster = require("../models/broadcaster");
const Chatroom = require("../models/chatrooms");
const chatRooms = require("./chatrooms.helpers")

const ApiResponse = require('../helpers/ApiResponse')
const Success = ApiResponse.SuccessResponse

const broadcasterGridFields = 'username slug status tags approved images show isAway topic';
const qryOptions = {
    limit: 200,
    select: broadcasterGridFields
};

exports = module.exports = function(io) {

    let socket = null;
    io.on('connection', function (soc) {
        socket = soc

        socket.on('broadcasterInit', (slug, cb) => {
            let qry = {slug }
            Broadcaster.findOne(qry, (err, broadcaster) => {
                if(err) cb({err})
                else {
                    let qry2 = {slug, isOnline: true, show: 'public'}
                    Chatroom.find(qry2, (err, chatrooms) => {
                        if (err) cb({err})
                        else {
                            cb({broadcaster: broadcaster.broadcasterInit, chatrooms})
                        }
                    })
                }
            })
        })

        socket.on('broadcasterUnload', (data) => {
            Chatroom.find({slug: data.user.slug, status: 'online' }, (err, rooms)=>{
                for(let r in rooms){
                    rooms[r].endedAt = Date.now()
                    rooms[r].isAway = false
                    rooms[r].status =  'offline'
                    rooms[r].save()
                }
                io.emit('showChange', rooms)
            })

        })

        socket.on('watcherInit', (watch, cb) => {
            let qry = {slug: watch.broadcaster}
            let usr = {slug: watch.user.slug, username: watch.user.username, socket: socket.id, isLoggedIn: watch.user.isLoggedIn}
            Broadcaster.findOne(qry, (err, broadcaster) => {
                if(err) cb({err})
                else {
                    if (broadcaster.room) {
                        let _id = broadcaster.room
                        chatRooms.addUserToRoom(_id, usr, null, socket, (chatrooms) => {
                                let returnObj = {broadcaster, chatrooms}
                                cb(returnObj)
                            }
                        )
                    } else {
                        cb({broadcaster, chatrooms: []})
                    }
                }
            })
        })

        socket.on('broadcasterlist', (options, cb) => {
            let search = { isOnline: true}
            if (options.tags){
                if (options.tags === 'Top'){
                    qryOptions.sort = {xp: -1}
                    qryOptions.select += ' xp';``
                }
                else if (options.tags === 'Trending'){
                    qryOptions.sort = {viewers: -1}
                    qryOptions.select += ' viewers';
                }
                else if (options.tags === 'New'){
                    const d = new Date();
                    d.setMonth(d.getMonth() - 4);
                    search = {approved: {$gte: new Date(d)}}
                }
                else {
                    options.tags = options.tags.toLowerCase()
                    search = {tags: options.tags}
                }
            }
            Chatroom.paginate(search, qryOptions, (err, users) => {
                cb(users, options.tags)
            })
        })
    })


    router.get('/:slug', (req, res) => {
        let fields = 'slug username topic approved xp viewers tags status images room';

        Broadcaster.findOne({slug: req.params.slug}, fields, (err, users) => {
            if (err) {
                res.status(404).json({success: false})
            }
            else res.status(200).json(new Success(users))
        })
    });

    router.post('/:slug/showChange/:show', (req, res) => {
        let show = req.params.show
        let slug = req.params.slug
        let qry = {slug}
        let offlineShows = ['offline', 'away']

        Broadcaster.findOne(qry, (err, broadcaster) => {
            if (err) {
                res.status(404).json({status: 'fail', error: err})
            } else if (!broadcaster) {
                res.status(404).json({status: 'fail', error: 'Broadcaster Not Found'})
            } else {
                broadcaster.status = show

                if (broadcaster.room) {
                    Chatroom.findById(broadcaster.room, (err, doc) => {

                    })
                }

                if (show === 'away') show = {show: 'public'}

                if (show === 'offline') {
                    broadcaster.room = null
                } else if (show === 'online') {
                    broadcaster.room = null
                } else {
                    let chatroom = new Chatroom({show, slug})
                    chatroom.save((err, doc) => {
                        if (err) {
                            res.status(404).json({status: 'fail', error: err})
                        } else {
                            broadcaster.room = doc._id
                            broadcaster.save((err, doc) => {
                                if (err) {
                                    res.status(404).json({status: 'fail', error: err})
                                } else {
                                    io.emit('showChange', {slug, show})
                                    res.status(200).json(new Success(doc))
                                }
                            })
                        }
                    })
                }
            }
        })
    })

    router.post('/:slug/topic/:topic', (req, res) => {
        const topic = req.params.topic
        const qry = {slug: req.params.slug}
        const update = {topic: topic}
        const options = {new: true, fields: 'topic'}

        Broadcaster.findOneAndUpdate(qry, update, options, (err, data) => {
            if (err) res.status(404).json({success: false})
            else {
                res.status(200).json(new Success(data))
                socket.updateTopic(data.topic)
            }
        })
    });


    return router;

}