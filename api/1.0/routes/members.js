var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var router = express.Router();
var User = require("../models/user");

var ApiResponse = require('../ApiResponse')
const Success = ApiResponse.SuccessResponse

const broadcasterGridFields = 'username slug status tags topic';
const qryOptions = {limit: 15, select: broadcasterGridFields};

/*
GET members listing.
*/

// GET: /v1.0/members
router.get('/', function(req, res, next) {
  User.paginate({roles: "user"}, qryOptions,(err,users)=>res.status(200).json(new Success(users)))
});

// GET: /v1.0/members/tags/:tags
router.get('/tags/:tags', function(req, res, next) {
  User.paginate({roles: "user", tags: req.params.tags}, qryOptions,(err,users)=>res.status(200).json(new Success(users)))
});

module.exports = router;
