const jwt = require('jsonwebtoken');
const User = require("./users.model");
const {success, error} = require('../helpers/ApiResponse');

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

    if (err && res && res.status)res.status(500).json(response)
    else if (err && res)res(response)
    else if (res && res.status) res.status(200).json(response)
    else if (res) res(response)
    else console.log(response)
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

    findAdmins (req, res) {
       User.find({roles: "admin"})
           .then((docs) => respond(null, docs, res))
           .catch((err) => respond(err, docs, res))

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
            const usernameLower = req.body.username.toLowerCase()
            const password = req.body.password

            User.findOne({usernameLower})
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
        usernameLower = usernameLower.toLowerCase()
        const qry = {usernameLower};
        const update = {isLoggedIn: false, status: 'offline', '$push': { logouts: Date.now() }}
        const options = { new: true };

        User.findOneAndUpdate(qry, update, options)
            .then((user) => respond(null, user, res))
            .catch((err) => respond(err, null, res))
    }

}

