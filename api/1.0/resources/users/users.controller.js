const jwt = require('jsonwebtoken');
const User = require("./users.model");
const SystemModel = require('../system/system.model');
const slugify = require('slugify');
const uuid = require('uuid');
const {isExpressReq, respond} = require('../../helpers/ApiResponse');

/*
const larry = new User({
    email: "larry.l.sharpe@gmail.com",
    username: "Big Lar"
})
*/
// larry.save();

const users = {
    guests: [],
    users: []
}

const createGuest = (req, res) => {
    const guestNumber = users.guests.length + 1
    const _usr = {
        slug: 'Guest-' + guestNumber,
        username: 'Guest ' + guestNumber
    }
    users.guests.push(_usr)
    return res.status(200).json(_usr)
}
const getCoins = (req, res) => {
    let usernameLower = (req && req.query && req.query.username) ? req.query.username :
        (req && req.body && req.body.username) ? req.body.username : null;
    usernameLower = usernameLower.toLowerCase()

    User.findOne({usernameLower})
        .then((user) => respond(null, user.coins.balance, res))
        .catch((err) => respond(err, null, res))
}
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
const createNewGuest = (res) => {
    let err = {};
    SystemModel.find({})
        .then((rec) => {
            if (!rec.length){
                err.message = 'System Not Found';
                respond(err, null, res);
            } else {
                rec = rec[0]
                const guestNum = rec.guestNo;
                const username = 'Guest ' + guestNum;
                const slug = slugify(username, {lower: true});

                let guest = {
                    // ip: socket.handshake.address,
                    // isLoggedIn: false,
                    roles: ['guest'],
                    slug,
                    // status: 'online',
                    username
                }
                respond(null, guest, res)
                rec.guestNo++
                rec.save();
            }
        })
        .catch((error) => {
            err.message = error;
            respond(err, null, res)
        })
}
const init = (req, res) => {
    let user;

    if (isExpressReq(req) && req.body.user) user = req.body.user;
    else if (req.user) user = req.user;

    if (!user || !user.username) createNewGuest(res)
    else if (!user.roles || user.roles.indexOf('user') === -1) {
        user.roles = ['guest'];
        respond(null, user, res)
    } else {
        const usernameLower = user.username.toLowerCase().trim()
        User.findOne({usernameLower})
            .then((user) => {
               respond(null, user.loginInfo, res)
            })
            .catch((err) => respond(err, null, res))
    }
}
const login = (req, res) => {
    const errors = [];
    const deviceID = req.query && req.query.deviceID || req.body && req.body.deviceID || null;
    const token = req.query && req.query.token || req.body && req.body.token || null;
    if (!deviceID) {
        errors.push("Invalid device")
    }
    if (!token) {
        errors.push("Token is required")
    }
    if (errors.length) {
        return res.status(401).json({errors})
    }
    const qry = {
        "loginToken.deviceID": deviceID,
        "loginToken.token": token
    }
    User.findOne(qry)
        .then(usr => {
            if (usr.loginToken.expires < Date.now()){
                return res.status(401).json({err: "Token Expired"})
            }
            updateUserOnLogin(usr)
                .then(getJWTAndUser)
                .then(ret => {
                    usr.save()
                    return res.status(200).json(ret)
                })
        })
        .catch(err => {
            return res.status(401).json(err)
        })
}
const loginLink = (req, res) => {
    const { email, deviceID } = req.query;
    const errors = [];
    if (!email) {
        errors.push("Email is required")
    }
    if (!deviceID) {
        errors.push("Invalid device")
    }
    if (errors.length) {
        res.status(401).json({errors})
    }
    User.findOneAndUpdate({ email }, {  loginToken: {
            deviceID,
            expires: Date.now() + 600000,
            token: uuid.v4().replace('/','')
        } })
        .then(usr => {
            res.status(200).json("ok");
        })
        .catch(err => {
            console.log({err});
            res.status(401).json(err);
        })
}
const logout = (req, res) => {
    const { slug } = req.params;
    const qry = {slug};
    const update = {isLoggedIn: false, status: 'offline', '$push': { logouts: Date.now() }}
    const options = { new: true };

    User.findOneAndUpdate(qry, update, options)
        .then((user) => respond(null, user, res))
        .catch((err) => respond(err, null, res))
}
const join = (req, res) => {
    if (!req.body.username || !req.body.email) {
        res.json({success: false, msg: 'Please pass username and email.'});
    } else {
        var newUser = new User({
            email: req.body.email,
            username: req.body.username
        });

        if (req.body.roles) newUser.roles = [req.body.roles];

        // save the user
        newUser.save(function(err) {
            if (err) {
                return res.status(500).json({success: false, msg: err});
            }
            return res.status(200).json({success: true, msg: 'Successful created new user.'});
        });
    }
}
const updateUserOnLogin = (user) => {
    user.status = 'online';
    user.loginToken = {};
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

module.exports = {
    createGuest,
    getCoins,
    init,
    login,
    loginLink,
    logout,
    join
}

