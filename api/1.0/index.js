const mongoose = require('mongoose');
const passport = require('passport');
require('./passport')(passport);
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const User = require("./models/user");

mongoose.connect(process.env.DB_CONNECT);

exports = module.exports = function(io) {

   require('./sockets')(io)

    let socket = null;

router.use('/users', require('./routes/users'));
router.use('/broadcasters', require('./routes/broadcasters')(io));
router.use('/members', require('./routes/members'));
router.use('/admins', require('./routes/admins'));
router.use('/chatrooms', require('./routes/chatrooms')(io));
router.use('/purchases', require('./routes/purchases')(io));
router.use('/tips', require('./routes/tips')(io));

    return router;
}

router.get('/logout/:username', (req, res) => {

  const qry = {username: req.params.username};
  const update = {isLoggedIn: false, status: 'offline', '$push': { logouts: Date.now() }}
  const options = { new: true };

  User.findOneAndUpdate(qry, update, options, (err) => {
    if (err) {
      return res.status(500).json({success: false, msg: err});
    }else {
      return res.status(200).json({success: true });
    }
  })
})

router.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password || !req.body.email) {
    res.json({success: false, msg: 'Please pass username and email and password.'});
  } else {
    var newUser = new User({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    });

    if (req.body.roles) newUser.roles = [req.body.roles];

    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.status(500).json({success: false, msg: err});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

router.post('/signin', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.sign(user, config.secret);
          // return the information including token as JSON

            user.status = 'online';
            user.isLoggedIn = true;
            user.logins.push(Date.now());

            user.save((err, user) => {
              if (err) {
                res.status(500).json({success: false, msg: "Couldn't Update User Status"})
              } else {
                  res.status(200).json({success: true, token: 'JWT ' + token, user: user.loginInfo})
              }
            })
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};