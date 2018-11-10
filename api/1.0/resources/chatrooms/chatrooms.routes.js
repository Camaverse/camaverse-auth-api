const express = require('express');
const router = express.Router();
const controller = require("./chatrooms.controller")

exports = module.exports = function(io) {
    io.on('connection', function(socket){

        socket.on('/1.0/chatrooms', controller.list)
        socket.on('updateTopic', controller.updateTopic)
        socket.on('updateTags', controller.updateTags)
        socket.on('createShow', controller.createShow)
        socket.on('goAway', controller.goAway)
        socket.on('resumeShow', controller.resumeShow)
        socket.on('goOffline', controller.goOffline)
        socket.on('leaveRoom', controller.leaveRoom)
        socket.on('watchInit', (watch, cb) => controller.watchInit(watch, socket, cb));
    })

    // POST: /1.0/chatrooms
    // Add users to a room
    router.get('/', controller.list)

    // POST: /1.0/chatrooms/:id
    // Add users to a room
    router.post('/:id', controller.join)

    // GET: /1.0/chatrooms/:slug/:show
    // Find a specific show for a specific user
    router.get('/:slug/:show', controller.getShow);

    return router;
}