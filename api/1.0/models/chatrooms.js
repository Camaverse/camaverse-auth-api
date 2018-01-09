var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ChatRoomsSchema = new Schema({
    endedAt: Date,
    events: [],
    income: [],
    isAway: {type: Boolean, default: false, required: true},
    show: {type: String, enum: ['public','private', 'vip']},
    slug: {type: String, required: true},
    socket: {type: String, required: true},
    status: {enum: ['offline', 'online'], default: 'online', type: String},
    tags: [String],
    topic: String,
    username: String,
    users: [],
    userSlugs: [String],
    images: {
        broadcasterGrid: String
    }
},{
    timestamps: true
});

ChatRoomsSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('ChatRoom', ChatRoomsSchema);