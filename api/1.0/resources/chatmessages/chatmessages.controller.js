exports = module.exports = function(io) {

    const ChatMessage = require("../chatmessages/chatmessages.model");

    let socket = null
    io.on('connection', function(sock) {
        socket = sock
    })

    const msgToRoom = (msg) => {
        return new Promise ((resolve) => {
            io.emit('transmitMsg', msg )
            resolve(msg)
        })
    }

    return {
        saveMessage(msg, cb) {
            new ChatMessage(msg).save()
                .then(msgToRoom)
                .then((msg) => {
                    cb(msg)
                })
                .catch(cb)

        }
    }



}