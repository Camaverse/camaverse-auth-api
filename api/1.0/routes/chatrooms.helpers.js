const ChatRooms = require("../models/chatrooms");
const ChatMessages = require("../models/chatmessages");

let cb = null
let res = null
let returnObj = {
    messages: null,
    room: null
}
let socket = null
let user = null


const init = (usr, result, soc, callback) => {
    cb = callback
    res = result
    socket = soc
    user = usr
}

const addUserToRoom = (_id, usr, result, soc, cb) => {
    init(usr, result, soc, cb)

    // Build the Query Obj
    let qry = {
        _id
    }

    // Build the update obj
    let update = {
        $push: {
            users: user,
            userSlugs: user.slug
        }
    }

    // Build the Query Options Obj
    let options = {
        new: true
    }

    console.log('add to room >>>>> ', qry)

    // Find the chatroom
    ChatRooms.findOneAndUpdate(qry,update,options, handleRoomResults)
}

const removeUserFromRoom = (_id, usr, result, soc, cb) => {
    init(usr, result, soc, cb)

    // Build the Query Obj
    let qry = {
        _id,
        userSlugs: user.slug
    }

    // Build the update obj
    let update = {
        $pull: {
            users: { slug: user.slug },
            userSlugs: user.slug
        }
    }

    // Build the Query Options Obj
    let options = {
        new: true
    }

    // Find the chatroom
    ChatRooms.findOneAndUpdate(qry,update,options, handleRoomResults)
}

const handleRoomResults = (err, doc) => {
    console.log('handleRoomResults +++', doc)

    if (err) handleRoomError(err)
    else if (doc === null) handleNoRoomResults()
    else handleRoomSuccess(doc)
}

const handleRoomError = (err) => {
    console.log('handleRoomError',err)
    returnObj.room = {err}
    next(500)
}

const handleNoRoomResults = () => {
    let errors = 'No Rooms Found'
    console.log(errors)
    returnObj.room = {errors}
    next(404)
}

const handleRoomSuccess = (doc) => {
    console.log('handleRoomSuccess',doc)
    returnObj.room = doc
    let qry = {'to.id': doc._id}
    ChatMessages.find(qry, handleMessageResults)
}

const handleMessageResults = (err, docs) => {
    if (err) handleMsgsError(err)
    else if (docs === null) handleNoMsgsResults()
    else handleMsgsSuccess(docs)
}

const handleMsgsError = (err) => {
    console.log('handleMsgsError',err)
    returnObj.messages = {err}
    next(500)
}

const handleNoMsgsResults = () => {
    let errors = 'No Msgs Found'
    console.log(errors)
    returnObj.messages = {errors}
    next(200)
}

const handleMsgsSuccess = (docs) => {
    console.log('handleMsgSuccess',docs)
    returnObj.messages = docs
    next(200)
}

const emit = () => {
    if (socket) {
        let _id = returnObj.room._id
        let emit = {_id, userSlugs: [user]}
        console.log('updateViewers emit to:', _id)
        socket.emit('updateViewers', emit)
        socket.to(_id).emit('updateViewers', emit);
    }
}

const next = (status) => {
    console.log(cb, 'RETURN OBJ}}}}}}}}}}}', returnObj)
    emit()
    if (cb) cb(returnObj)
    if (res) res.status(status).json(returnObj)
}

module.exports = {
    addUserToRoom,
    removeUserFromRoom
}