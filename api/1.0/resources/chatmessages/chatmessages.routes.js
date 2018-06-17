exports = module.exports = function(io) {
    const express = require('express');
    const router = express.Router();
    const controller = require('./chatmessages.controller')(io);

    io.on('connection', function(socket){
        socket.on('sendMessage', (msg, cb) => controller.saveMessage(msg, cb))
    });

    return router;

}