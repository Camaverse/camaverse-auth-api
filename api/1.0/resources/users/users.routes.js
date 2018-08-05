const express = require('express');
const router = express.Router();
const controller = require('./users.controller');

exports = module.exports = function(io) {

    router.route('/')
        .get(controller.logout)
        .post(controller.logout);
    router.get('/logout/:username', controller.logout);
    router.post('/login', controller.login);
    router.post('/signup', controller.signup);

    io.on('connection', function (socket) {
        socket.on('/users/init', controller.init)
        socket.on('/users/login', controller.login)
        socket.on('/users/logout', controller.logout)
        socket.on('/users/coins', controller.getCoins)
    })

    return router;
}