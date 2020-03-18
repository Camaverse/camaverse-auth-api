const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const modelRoutes = ['users', 'purchases', 'broadcasters', 'chatrooms', 'chatmessages', 'tips'];
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

exports = module.exports = function(io) {

    modelRoutes.forEach((model) => {
        router.use(`/${model}`, require(`./resources/${model}/${model}.routes`)(io))
    })

    return router;
}
