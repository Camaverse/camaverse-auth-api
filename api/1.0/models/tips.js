var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

const enums = {
    from: {
        type: ['user','broadcaster']
    }
}

var TipsSchema = new Schema({
    amount: {
      type: Number,
      min: 1,
      required: true
    },
    message: {
        content: String,
        isPrivate: { type: Boolean, default: false}
    },
    from: {
        slug: {type: String, required: true},
        username: {type: String, required: true}
    },
    to: {
        id: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
        show: {type: String, required: true},
        slug: {type: String, required: true}
    },
    clientTime: {type: Date, required: true},
    serverTime: Date,
    transmitTime: Date
},{
    timestamps: true
});

TipsSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Tips', TipsSchema);
