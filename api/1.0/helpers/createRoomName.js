const createRoomName = (room) => {
    return room.slug + '/' + room.show
}

module.exports = createRoomName