const express = require('express');
const router = express.Router();
const controller = require('./users.controller');

exports = module.exports = function(io) {

    router.route('/login')
        .get(controller.login)
        .post(controller.login);
    router.get('/loginLink', controller.loginLink);
    router.get('/logout/:slug', controller.logout);
    router.post('/join', controller.join);


    router.post('/guest', controller.createGuest);

    io.on('connection', function (socket) {
        console.log('socket io connection')
        socket.on('/users/init', controller.init)
        socket.on('/users/login', controller.login)
        socket.on('/users/logout', controller.logout)
        socket.on('/users/coins', controller.getCoins)
    })

    return router;
}
