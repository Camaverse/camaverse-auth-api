const express = require('express');
const router = express.Router();
const Broadcaster = require("./broadcasters.model");
const Chatroom = require("../chatrooms/chatrooms.model");
const chatRooms = require("../chatrooms/chatrooms.helpers")

const ApiResponse = require('../../helpers/ApiResponse')
const Success = ApiResponse.SuccessResponse

const broadcasterGridFields = 'username slug status tags approved images show isAway topic';
const qryOptions = {
    limit: 100,
    select: broadcasterGridFields
};

module.exports = {
    init (slug, cb) {
        let qry = {slug}
        Broadcaster.findOne(qry, (err, broadcaster) => {
            if(err) cb({err})
            else {
                let qry2 = {slug, isOnline: true, show: 'public'}
                Chatroom.find(qry2, (err, chatrooms) => {
                    if (err) cb({err})
                    else cb({broadcaster: broadcaster.broadcasterInit, chatrooms})
                })
            }
        })
    },
    unload (data) {
        Chatroom.find({slug: data.user.slug, status: 'online' }, (err, rooms) => {
            for(let r in rooms){
                rooms[r].endedAt = Date.now()
                rooms[r].isAway = false
                rooms[r].status =  'offline'
                rooms[r].save()
            }
            io.emit('showChange', rooms)
        })
    },
    list (options, cb) {
        let search = { isOnline: true}
        if (options.tags){
            const tags = options.tags.toLowerCase()
            if (tags === 'top'){
                qryOptions.sort = {xp: -1}
                qryOptions.select += ' xp';
            }
            else if (tags === 'popular'){
                qryOptions.sort = {viewers: -1}
                qryOptions.select += ' viewers';
            }
            else {
                search = {tags}
            }
        }
        Chatroom.paginate(search, qryOptions)
            .then((chatrooms) => {
                if (chatrooms.docs.length < 20) {
                    search.isOnline = false;
                    Broadcaster.paginate(search, qryOptions)
                        .then((broadcasters) => {
                            cb({online: chatrooms, offline: broadcasters}, options.tags)
                        })
                        .catch((err) => cb({online: chatrooms}, options.tags))
                } else {
                    cb({online: chatrooms}, options.tags)
                }
            })
            .catch((err) => cb(err, options.tags) )
    },
    getBroadcaster (req, res) {
        const fields = 'slug username topic approved xp viewers tags status images room';

        Broadcaster.findOne({slug: req.params.slug}, fields, (err, users) => {
            if (err) res.status(404).json({success: false})
    else res.status(200).json(new Success(users))
    })
    },
    changeShow (req, res) {
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
    },
    updateTopic (req, res) {
        const topic = req.params.topic
        const qry = {slug: req.params.slug}
        const update = {topic: topic}
        const options = {new: true, fields: 'topic'}

        Broadcaster.findOneAndUpdate(qry, update, options, (err, data) => {
            if (err) res.status(404).json({success: false})
    else {
            res.status(200).json(new Success(data))
            // socket.updateTopic(data.topic)
        }
    })
    }
}