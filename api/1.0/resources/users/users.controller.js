const jwt = require('jsonwebtoken');
const User = require("./users.model");
const SystemModel = require('../system/system.model')
const slugify = require('slugify')
const {success, error} = require('../../helpers/ApiResponse');

const getJWTAndUser = (user) => {
    return new Promise(
        (resolve, reject) => {
            let success = true
            let token = 'JWT ' + jwt.sign(user, process.env.PASSPORT_SECRET)
            user = user.loginInfo
            resolve({token, user, success})
        }
    )
}

const respond = (err, docs, res) => {

    let response;
    if (err) response = new error(err.message, docs);
    else response = new success(docs);

    if (err && res && res.status) {
        res.status(500).json(response)
    } else if (err && res) {
        res(response)
    } else if (res && res.status) {
        res.status(200).json(response)
    } else if (res) {
        res(err, response)
    } else {
        console.log(response)
    }
}

const updateUserOnLogin = (user) => {
    user.status = 'online';
    user.isLoggedIn = true;
    user.logins.push(Date.now());
    return user.save()
}

const validate = {
    login (input){
        return (input && input.username && input.password)
    },
    password (user, password) {
        return new Promise((res, rej) =>
            user.comparePassword(password, function (err, isMatch) {
                if (err) rej(new err(err))
                else if (!isMatch) rej(new err('Authentication failed.'))
                else res(user)
            })
        );
    }
}

const checkOTP = (user, otpHeader) => {
    return new Promise((resolve, reject) => {
        if (!user.twofactor.secret){
            resolve(user)
        } else {
            if (!otpHeader){
                reject(new Error('Please enter otp to continue'))
            }
        }
    })
}

module.exports = {
    create (req, res) {
        let usr = new User(req.body)
        usr.save((err, docs) =>
            respond(err, (docs && docs.createInfo) ? docs.createInfo : null, res));
    },
    getCoins (req, res) {
        let usernameLower = (req && req.query && req.query.username) ? req.query.username :
            (req && req.body && req.body.username) ? req.body.username : null;
        usernameLower = usernameLower.toLowerCase()

        User.findOne({usernameLower})
            .then((user) => respond(null, user.coins.balance, res))
            .catch((err) => respond(err, null, res))
    },
    guestInit (cb) {
        SystemModel.find({}, (err, rec) => {
            rec = rec[0]
            if (!err) {
                const guestNum = rec.guestNo;
                const username = 'Guest ' + guestNum;

                let guest = {
                    // ip: socket.handshake.address,
                    // isLoggedIn: false,
                    // roles: ['guest'],
                    slug: slugify(username, {lower: true}),
                    // status: 'online',
                    username
                }
                if (cb) cb(null, guest);

                rec.guestNo++
                rec.save();
            }
        });
    },
    findAll (req, res) {
       User.find({})
           .then((docs) => respond(null, docs, res))
           .catch((err) => respond(err, docs, res))
    },
    findBroadcasters (req, res) {
       User.find({roles: "broadcaster"})
           .then((docs) => respond(null, docs, res))
           .catch((err) => respond(err, docs, res))
    },
    findUsers (req, res) {
       User.find({roles: "user"})
           .then((docs) => respond(null, docs, res))
           .catch((err) => respond(err, docs, res))
    },

    login (req, res) {
        if (validate.login(req.body)) {
            const usernameLower = req.body.username.toLowerCase().trim()
            const password = req.body.password
            let qry = { usernameLower }
            if (req.body.roles) {
                qry.roles = req.body.roles;
            }

            User.findOne(qry)
                .then((user) => validate.password(user, password))
                .then(updateUserOnLogin)
                .then(getJWTAndUser)
                .then((user) => respond(null, user, res))
                .catch((err) => respond(err, null, res))
        }
    },
    logout (req, res) {
        let usernameLower = (req && req.query && req.query.username) ? req.query.username :
            (req && req.body && req.body.username) ? req.body.username : null;
        usernameLower = usernameLower.toLowerCase().trim()
        const qry = {usernameLower};
        const update = {isLoggedIn: false, status: 'offline', '$push': { logouts: Date.now() }}
        const options = { new: true };

        User.findOneAndUpdate(qry, update, options)
            .then((user) => respond(null, user, res))
            .catch((err) => respond(err, null, res))
    },
    signup (req, res) {
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
    },

    init (user, cb) {
        if (!user || !user.username) respond({err: 'Invalid request'}, null, cb)
        else {
            const usernameLower = user.username.toLowerCase().trim()
            User.findOne({usernameLower})
                .then((user) => {
                    return respond(null, user.loginInfo, cb)
                })
                .catch((err) => respond(err, null, cb))
        }
    },

    logout (req, res) {
        const qry = {username : req.params.username};
        const update = {isLoggedIn: false, status: 'offline', '$push': { logouts: Date.now() }}
        const options = { new: true };

        User.findOneAndUpdate(qry, update, options, (err) => {
                if (err) {
                    return res.status(500).json({success: false, msg: err});
                }else {
                    return res.status(200).json({success: true });
            }
        })
    }

}

