exports = module.exports = function(io) {

    const express = require('express');
    const router = express.Router();
    const controller = require('./tips.controller')(io);

    io.on('connection', function (socket) {

        socket.on('sendTip', controller.sendTip)
    })

    return router;
}

