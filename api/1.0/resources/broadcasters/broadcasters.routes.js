const express = require('express');
const router = express.Router();
const controller = require('./broadcasters.controller');

exports = module.exports = function(io) {

    io.on('connection', function (socket) {

        socket.on('broadcasterInit', controller.init)
        socket.on('broadcasterUnload', controller.unload);
        socket.on('broadcasterlist', controller.list);

    })

    router.get('/:slug', controller.getBroadcaster);
    router.post('/:slug/showChange/:show', controller.changeShow);
    router.post('/:slug/topic/:topic', controller.updateTopic);

    return router;

}