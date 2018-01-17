var express = require('express');
var router = express.Router();
var User = require("../models/user");

var ApiResponse = require('../helpers/ApiResponse')
const Success = ApiResponse.SuccessResponse

const broadcasterGridFields = 'username slug status tags topic';
const qryOptions = {limit: 15, select: broadcasterGridFields};

/*
GET admins listing.
*/

// GET: /v1.0/admins
router.get('/', function(req, res, next) {
  User.paginate({roles: "admin"}, qryOptions,(err,users)=>res.status(200).json(new Success(users)))
});

// GET: /v1.0/admins/tags/:tags
router.get('/tags/:tags', function(req, res, next) {
  User.paginate({roles: "admin", tags: req.params.tags}, qryOptions,(err,users)=>res.status(200).json(new Success(users)))
});

module.exports = router;
