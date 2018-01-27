const systemStore = require('./models/system')
const chatmessages = require('./models/chatmessages')
const createRoomName = require('./helpers/createRoomName');
const slugify = require('slugify')

exports = module.exports = function(io) {

    let socket = null;
    io.on('connection', function (soc) {
        socket = soc

        socket.on('connect-guest', (cb) => {
            let guestNum = null
            let guest = {
                // ip: socket.handshake.address,
                // isLoggedIn: false,
                // roles: ['guest'],
                // slug: null,
                // status: 'online',
                // username: null,
                // coins: {
                //     balance: 0
                // },
                // xp: 0
            }

            systemStore.find({}, (err, rec) => {
                rec = rec[0]
                if (!err) {
                    guestNum = rec.guestNo;
                    guest.username = 'Guest ' + guestNum;
                    guest.slug = slugify(guest.username, {lower: true});
                    cb(null, guest);

                    rec.guestNo++
                    rec.save();
                }
            });
        })

        socket.on('joinRoom', (room, user) => {
            console.log(' --- join room emitted ---')
            socket.join(createRoomName(room));
        })

        socket.on('sendMessage', (msg, cb) => {
            msg.serverTime = Date.now();
            msg = new chatmessages(msg);
            msg.save((err, message) => {
                if (err) {
                    cb(err)
                } else {
                    let room = msg.to._id
                    io.in(room).emit('transmitMsg', msg)
                    io.emit('transmitMsg', msg)
                    cb()
                }
            })
        })
    })
}