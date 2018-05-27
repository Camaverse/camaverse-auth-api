const express = require('express');
const router = express.Router();
const controller = require('./users.controller');

exports = module.exports = function(io) {
    router.post('/', controller.create)
    router.post('/login', controller.login)
    router.post('/logout', controller.logout);
    router.get('/', controller.findAll);
    router.get('/admins', controller.findAdmins);
    router.get('/broadcasters', controller.findBroadcasters);
    router.get('/logout', controller.logout);
    router.get('/users', controller.findUsers);

    io.on('connection', function (socket) {
        socket.on('/post/users', controller.create)
        socket.on('/users', controller.findAll)
        socket.on('/users/admins', controller.findAdmins)
        socket.on('/users/broadcasters', controller.findBroadcasters)
        socket.on('/users/login', controller.login)
        socket.on('/users/logout', controller.logout)
        socket.on('/users/users', controller.findUsers)
        socket.on('/users/coins', controller.getCoins)
    })

    return router;
}