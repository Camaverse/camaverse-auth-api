var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

const enums = {
    from: {
        type: ['user','broadcaster']
    }
}

var ChatMessagesSchema = new Schema({
    message: {type: String, required: true},
    from: {
        type: {type: String, required: true, enum: enums.from.type},
        slug: {type: String, required: true},
        username: {type: String, required: true}
    },
    to: {type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    clientTime: {type: Date, required: true},
    serverTime: Date,
    transmitTime: Date
},{
    timestamps: true
});

ChatMessagesSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('ChatMessages', ChatMessagesSchema);
