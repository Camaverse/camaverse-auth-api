var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var router = express.Router();
var Tips = require("../models/tips");
const socket = require('../sockets').transmit;


var ApiResponse = require('../ApiResponse')
const Success = ApiResponse.SuccessResponse

// GET: /v1.0/users
router.post('/', function(req, res, next) {
    let tip = new Tips(req.body)
    tip.save((err, tip) => {
        if (err) {
            res.status(500).json({err})
        } else {
            socket.transmitTip(tip)
            res.status(200).json(new Success(tip))
        }
    })
});

module.exports = router;