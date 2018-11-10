const jwt = require('jsonwebtoken');
const User = require("./users.model");
const SystemModel = require('../system/system.model')
const slugify = require('slugify')
const {isExpressReq, respond} = require('../../helpers/ApiResponse');

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
}
const logout = (req, res) => {
    let usernameLower = (req && req.query && req.query.username) ? req.query.username :
        (req && req.body && req.body.username) ? req.body.username : null;
    usernameLower = usernameLower.toLowerCase().trim()
    const qry = {usernameLower};
    const update = {isLoggedIn: false, status: 'offline', '$push': { logouts: Date.now() }}
    const options = { new: true };

    User.findOneAndUpdate(qry, update, options)
        .then((user) => respond(null, user, res))
        .catch((err) => respond(err, null, res))
}
const signup = (req, res) => {
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

module.exports = {
    getCoins,
    init,
    login,
    logout,
    signup
}

