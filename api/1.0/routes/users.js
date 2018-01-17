var passport = require('passport');
require('../passport')(passport);
var express = require('express');
var router = express.Router();
var User = require("../models/user");


var ApiResponse = require('../helpers/ApiResponse')
const Success = ApiResponse.SuccessResponse

// GET: /v1.0/users
router.get('/', function(req, res, next) {
    User.find({roles: "user"},(err,users)=>res.status(200).json(new Success(users)))
});
router.get('/all', function(req, res, next) {
    User.find({},(err,users)=>res.status(200).json(new Success(users)))
});
router.get('/admin', function(req, res, next) {
    User.find({roles: "admin"},(err,users)=>res.status(200).json(new Success(users)))
});
router.get('/broadcasters', function(req, res, next) {
    User.find({roles: "broadcaster"},(err,users)=>res.status(200).json(new Success(users)))
});

module.exports = router;