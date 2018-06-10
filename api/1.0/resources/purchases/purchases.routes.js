const express = require('express');
const router = express.Router();
const controller = require('./purchases.controller');

exports = module.exports = function(io) {

    io.on('connection', function (socket) {

        socket.on('buyCoins', controller.buyCoins)
    })

    return router
}
