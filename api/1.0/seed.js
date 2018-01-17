const mongoose = require('mongoose');
const slugify = require('slugify');
const UserModel = require("./models/user");
const BroadcasterModel = require("./models/broadcaster");
const SystemModel = require("./models/system");
const org_tags = ["abc","def","hij","klm","nop","qrs","tuv","wxy","z"];

let tags = org_tags.join(',').split(',');

for (let i = 0; i < 10; i ++) {
    for (let tag in org_tags) {
        tags.push(org_tags[tag] + i)
    }
}

class User {
    constructor (
        username,
        password = "royalties",
        status = "offline",
        roles = ["broadcaster"],
        isLoggedIn = false
    ) {
        this._id = new mongoose.Types.ObjectId();
        this.status = status;
        this.isLoggedIn = isLoggedIn;
        this.roles = roles;
        this.slug = slugify(username, {lower: true});
        this.email = this.slug + '@a.com';
        this.password = password;
        this.username = username;
    }
}
class Broadcaster {

    constructor (
        users,
        username,
    ) {
        this._id = new mongoose.Types.ObjectId();
        this.status = "offline";
        this.slug = slugify(username, {lower: true});
        this.username = username;
        this.tags = this.createTags();
        this.approved = this.randomDate(new Date(2012, 0, 1), new Date());
        this.xp = this.randomIndex(999999,0);
        this.images = {
            broadcasterGrid: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-1.jpg"
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
            tag_list.push(tags[_index]);
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

for (let i = 1; i <= 10; i++){
    let usr = new UserModel(new User('Admin ' + i, 'royalties', 'offline', ['admin']));
    usr.save((err) => { objectsave('Admin', err) })
}

for (let i = 1; i <= 25; i++){
    let usr = new UserModel(new User('User ' + i, 'royalties', 'offline', ['user']));
    usr.save((err) => { objectsave('User', err) })
}

for (let i = 1; i <= 100; i++){
    let usr = new UserModel(new User('Broadcaster ' + i));
    let caster = new BroadcasterModel(new Broadcaster([usr._id],'Broadcaster ' + i));
    usr.broadcasts = [caster._id];

    usr.save((err) => { objectsave('User', err) })
    caster.save((err) => { objectsave('Broadcaster', err) })
}

let systemRec = new SystemModel();
systemRec.save((err) => { objectsave('System', err) });