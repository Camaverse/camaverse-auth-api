
const User = require("./users.model");
const uuid = require('uuid');
const {isExpressReq, respond} = require('../../helpers/ApiResponse');
const RedisPromises = require('../../helpers/RedisPromises');
const { rGet, rSet } = RedisPromises;

// system variables
const err = {};
let guestCount = 0;

// system startup
const loadGuestCount = () => {
    rGet("guest-count")
        .then(count => {
            if (count === null) {
                setGuestCount(0);
            } else {
                guestCount = count;
            }
        })
        .catch(console.log);
};

const setGuestCount = (count) => {
    return rSet("guest-count", count)
        .catch(console.log);
};

// route methods
const createGuest = (req, res) => {
    guestCount++
    const _usr = {
        slug: 'Guest-' + guestCount,
        username: 'Guest ' + guestCount
    }
    setGuestCount(guestCount);
    return res.status(200).json(_usr)
}

const createUser = (req, res) => {
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
            let msg = null;
            if (err) {
                if (err.code === 11000) {
                    msg = 'User exists.';
                }
                return res.status(500).json({success: false, msg});
            }
            return res.status(200).json({success: true, msg: 'Successful created new user.'});
        });
    }
}

loadGuestCount();

/*
const larry = new User({
    email: "larry.l.sharpe@gmail.com",
    username: "Big Lar"
})
*/
// larry.save();


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
    init,
    login,
    loginLink,
    logout,
    join: createUser
}

