require('dotenv').config()

const mongoose = require('mongoose');
const slugify = require('slugify');
const UserModel = require("../resources/users/users.model");
const BroadcasterModel = require("../resources/broadcasters/broadcasters.model")
const ChatroomModel = require("../resources/chatrooms/chatrooms.model")
const SystemModel = require("../resources/system/system.model");

const randoms = require('./randomGenerators');

const girlNames = require('./girlNames.json');
const tags = require('./tagsNSFW.json');
const topics = require('./randonSentencesNSFW.json');

const counts = {
    user: 10,
    admin: 3,
    broadcaster: 200,
    onlineBroadcaster: 50
};
const totals = {
    user: 10,
    admin: 3,
    broadcaster: 200,
    onlineBroadcaster: 50
}
const createMethods = {
    user (usr, type, methodType, num, offset, resolve) {
        usr.then((user) => {
            console.log(`${user.username}  saved.`)
            recNext(resolve, type, methodType, offset);
        })
        .catch((err) => {
            console.log(`${type} ${num} not saved.`);
            console.log(err);
            console.log('');
            recNext(resolve, type, methodType, offset);
        })
    },
    broadcaster (usr, type, methodType, num, offset, resolve) {
        usr.then((user) => {
            console.log(`${user.username}  saved.`)
            return new BroadcasterModel(new Broadcaster(user.username)).save()
        })
        .then((broadcaster) => recNext(resolve, type, methodType, offset))
        .catch((err) => {
            console.log(`${type} ${num} not saved.`);
            console.log(err);
            console.log('');
            recNext(resolve, type, methodType, offset);
        })
    },
    onlineBroadcaster (usr, type, methodType, num, offset, resolve) {
        usr.then((user) => {
            console.log(`${user.username} user saved.`)

            const topic = topics[randoms.number(topics.length)];

            let broadcaster = new BroadcasterModel(new Broadcaster(user.username, true))
            let chatroom = new ChatroomModel({
                slug: broadcaster.slug,
                broadcasterID: broadcaster._id,
                socket: 'crecercercercre',
                username: broadcaster.username,
                topic,
                images: broadcaster.images,
                tags: broadcaster.tags,
                viewers: randoms.number(2000,0),
                xp: randoms.number()
            })

            // add chatroom broadcaster is in to broadcaster
            broadcaster.room = chatroom._id

            return {broadcaster, chatroom}
        })
        .then(({broadcaster, chatroom}) => {
            return new Promise ((resolve, reject) => {
                broadcaster.save()
                    .then((caster) => resolve(chatroom))
                    .catch((err) => {
                        console.log(`${type} ${num} broadcaster not saved.`);
                        console.log(err);
                        console.log('');
                        recNext(resolve, type, methodType, offset);
                    })
            })
        })
        .then ((chatroom) => {
            return new Promise ((resolve, reject) => {
                chatroom.save()
                    .then((chatroom) => {
                        console.log(`chatroom saved.`)
                        recNext(resolve, type, methodType, offset);
                    } )
                    .catch((err) => {
                        console.log(`${type} ${num} not saved.`);
                        console.log(err);
                        console.log('');
                        recNext(resolve, type, methodType, offset);
                    })
            })
        })
        .catch((err) => {
            console.log(`${type} ${num} not saved.`);
            console.log(err);
            console.log('');
            recNext(resolve, type, methodType, offset);
        })
    }
}
createMethods.admin = createMethods.user;

console.log(process.env.MONGODB_URL);

class User {
    constructor (
        username,
        password = "royalties",
        roles,
        isLoggedIn
    ) {
        this._id = new mongoose.Types.ObjectId();
        this.username = username;
        this.usernameLower = username.toLowerCase()
        this.slug = slugify(username, {lower: true});
        this.email = this.slug + '@a.com';
        this.password = password;
        if (isLoggedIn) this.isLoggedIn = isLoggedIn;
        if (roles) this.roles = roles;
    }
}
class Broadcaster {

    constructor (
        username,
        isOnline = false
    ) {

        const approvalDate = randoms.date(new Date(2012, 0, 1), new Date());
        const approvalTime = approvalDate.getTime();
        const newCutOff = Date.now() - 12096e5 - 12096e5;
        const isNew = newCutOff < approvalDate;

        this._id = new mongoose.Types.ObjectId();
        this.isOnline = isOnline;
        this.slug = slugify(username, {lower: true});
        this.username = username;
        this.tags = this.createTags();
        if (isNew) this.tags.push('new');
        this.approved = approvalDate;
        this.images = {
            broadcasterGrid: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-" + randoms.number(19, 1) +  ".jpg"
        }
        this.xp = randoms.number()
    }

    createTags () {
        let tag_list = [];
        const _loop = randoms.number(5, 1);
        for (let i = 0; i < _loop; i++){
            const _index = randoms.number(tags.length, 0);
            let tag = tags[_index]
            if (tag_list.indexOf(tag) === -1) tag_list.push(tag);
        }
        return tag_list;
    }
}

mongoose.connect(process.env.MONGODB_URL);

const recNext = (resolve, type, methodType, offset) => {
    if (counts[methodType]) {
        counts[methodType]--
        recordsLoop(resolve, type, methodType, offset);
    }
}

const recordsLoop = (resolve, type, methodType, offset) => {
    if (counts[methodType]) {
        const num = totals[methodType] - counts[methodType];
        const numTtl = num + offset;

        let username;

        if (type === 'broadcaster') {
            usernameIndex = randoms.number(girlNames.length);
            username = girlNames[usernameIndex];
            girlNames.splice(usernameIndex, 1);
        } else {
            username = `${type} ${numTtl}`;
        }

        const usr = new UserModel(new User(username, 'royalties', [type])).save();
        createMethods[methodType](usr, type, methodType, num, offset, resolve)
    } else {
        console.log('complete')
        resolve()
    }
}

const recsStart = (type, methodType, offset = 0) => {
    return new Promise(resolve => {
       recordsLoop(resolve, type, methodType, offset)
    })
}

const disconnect = () => {
    process.exit();
}

for (let mod of [BroadcasterModel, ChatroomModel, SystemModel, UserModel]){
    mod.remove((err) => { console.log(err); });
}

new SystemModel()
    .save()
    .then(() => recsStart('admin','admin'))
    .then(() => recsStart('user','user'))
    .then(() => recsStart('broadcaster','broadcaster'))
    .then(() => recsStart('broadcaster','onlineBroadcaster', 200))
    .then(() => disconnect())
    .catch((err) => {
        console.log(err.message);
        disconnect();
    })