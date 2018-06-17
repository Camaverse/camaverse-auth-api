const ChatRooms = require("./chatrooms.model");
const ChatMessages = require("../chatmessages/chatmessages.model");

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
            users: user
        }
    }

    // Build the Query Options Obj
    let options = {
        new: true
    }

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
            users: { slug: user.slug }
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
    if (err) handleRoomError(err)
    else if (doc === null) handleNoRoomResults()
    else handleRoomSuccess(doc)
}

const handleRoomError = (err) => {
    returnObj.room = {err}
    next(500)
}

const handleNoRoomResults = () => {
    let errors = 'No Rooms Found'
    returnObj.room = {errors}
    next(404)
}

const handleRoomSuccess = (doc) => {
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
    returnObj.messages = {err}
    next(500)
}

const handleNoMsgsResults = () => {
    let errors = 'No Msgs Found'
    returnObj.messages = {errors}
    next(200)
}

const handleMsgsSuccess = (docs) => {
    returnObj.messages = docs
    next(200)
}

const emit = () => {
    if (socket) {
        let _id = returnObj.room._id
        let emit = {_id, users: [user]}
        console.log('updateViewers emit to:', _id)
        socket.emit('updateViewers', emit)
        socket.to(_id).emit('updateViewers', emit);
        socket.emit('updateChat', returnObj)
        socket.to(_id).emit('updateChat', emit);
    }
}

const next = (status) => {
    emit()
    if (cb) cb(returnObj)
    if (res) res.status(status).json(returnObj)
}

module.exports = {
    addUserToRoom,
    removeUserFromRoom
}