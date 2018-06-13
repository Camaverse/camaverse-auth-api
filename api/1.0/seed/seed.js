require('dotenv').config()

const mongoose = require('mongoose');
const slugify = require('slugify');
const UserModel = require("../resources/users/users.model");
const BroadcasterModel = require("../resources/broadcasters/broadcasters.model")
const ChatroomModel = require("../resources/chatrooms/chatrooms.model")
const SystemModel = require("../models/system");
const org_tags = ["abc","def","hij","klm","nop","qrs","tuv","wxy","z"];

let tags = org_tags.join(',').split(',');

console.log(process.env.DB_CONNECT);

for (let i = 0; i < 10; i ++) {
    for (let tag in org_tags) {
        let newTag = org_tags[tag] + i
        tags.push(newTag)
    }
}

const rando = () => Math.floor(Math.random() * 19) + 1

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
        username
    ) {
        this._id = new mongoose.Types.ObjectId();
        this.isOnline = false;
        this.slug = slugify(username, {lower: true});
        this.username = username;
        this.tags = this.createTags();
        this.approved = this.randomDate(new Date(2012, 0, 1), new Date());
        this.images = {
            broadcasterGrid: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-" + rando() +  ".jpg"
        }
    }

    randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    createTags () {
        let tag_list = [];
        const _loop = this.randomIndex(8, 1);
        for (let i = 0; i < _loop; i++){
            const _index = this.randomIndex(tags.length, 0);
            let tag = tags[_index]
            if (tag_list.indexOf(tag) === -1) tag_list.push(tag);
        }
        return tag_list;
    }

    randomIndex (max, min) {
        return (Math.floor(Math.random() * max) + min);
    }
}

mongoose.connect(process.env.DB_CONNECT);

const objectsave = (type, err) => {
    if (err) {
        console.log(type + ' not Saved: ', err);
    } else {
        console.log(type + ' Saved');
    }
}

const admins = (i) => {
    let usr = new UserModel(new User('Admin ' + i, 'royalties', ['admin']));
    usr.save((err) => { objectsave('Admin', err) })
}

const users = (i) => {
    let usr = new UserModel(new User('User ' + i, 'royalties', ['user']));
    usr.save((err) => { objectsave('User', err) })
}

const offlineBroadcaster = (i) => {
    new UserModel(new User('Broadcaster ' + i, 'royalties', ['broadcaster'])).save((err) => {objectsave('User', err)})
    new BroadcasterModel(new Broadcaster('Broadcaster ' + i)).save((err) => {objectsave('Broadcaster', err)})
}

const publicBroadcaster = (i) => {
    let usr = new UserModel(new User('Broadcaster ' + i, 'royalties', ['broadcaster'], true));
    let caster = new BroadcasterModel(new Broadcaster('Broadcaster ' + i, ));
    let chatroom = new ChatroomModel({
        slug: caster.slug,
        broadcasterID: caster._id,
        socket: 'crecercercercre',
        username: caster.username
    })

    caster.room = chatroom._id
    chatroom.images = caster.images
    chatroom.tags = caster.tags
    chatroom.topic = 'Chatroom Topic Goes Here'

    usr.save()
        .then(caster.save())
        .then(chatroom.save())
        .catch((err) => console.log('PUBLIC BROADCASTERSAVE ERROR', err))
}

/*
new SystemModel().save((err) => { objectsave('System', err) });
*/

userCount = 50;

for (let i = 1; i <= 50; i++) users(i)
for (let i = 1; i <= 10; i++) admins(i)

setTimeout(() => { console.log('start 1'); for (let i = 51; i <= 100; i++) offlineBroadcaster(i)}, 1000)
setTimeout(() => { console.log('start 2');  for (let i = 101; i <= 150; i++) offlineBroadcaster(i)}, 5000)
setTimeout(() => { console.log('start 3');  for (let i = 151; i <= 200; i++) offlineBroadcaster(i)}, 5000)

setTimeout(() => { console.log('start 4');  for (let i = 1; i <= 25; i++) publicBroadcaster(i)}, 5000)

setTimeout(() => { console.log('star t 5');  for (let i = 26; i <= 50; i++) publicBroadcaster(i)}, 5000)
