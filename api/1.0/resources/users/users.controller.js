const jwt = require('jsonwebtoken');
const User = require("./users.model");
const SystemModel = require('../system/system.model')
const slugify = require('slugify')
const {success, error} = require('../../helpers/ApiResponse');

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
const init = (req, res, user, cb) => {
    if (!user || !user.username) {
        SystemModel.find({})
            .then((rec) => {
                if (!rec.length){
                    cb('System Not Found', null);
                } else {
                    rec = rec[0]
                    const guestNum = rec.guestNo;
                    const username = 'Guest ' + guestNum;
                    const slug = slugify(username, {lower: true});

                    let guest = {
                        // ip: socket.handshake.address,
                        // isLoggedIn: false,
                        // roles: ['guest'],
                        slug,
                        // status: 'online',
                        username
                    }
                    if (cb) cb(null, guest);
                    rec.guestNo++
                    rec.save();
                }
            })
            .catch(cb)
    } else {
        const usernameLower = user.username.toLowerCase().trim()
        User.findOne({usernameLower})
            .then((user) => {
                return respond(null, user.loginInfo, cb)
            })
            .catch((err) => respond(err, null, cb))
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

