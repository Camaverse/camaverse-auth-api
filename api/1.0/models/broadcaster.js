var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var slugify = require('slugify');

var BroadcasterSchema = new Schema({
    approved: Date,
    images: {
        broadcasterGrid: String
    },
    slug: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        required: true,
        default: 'offline',
        enum: ['offline','online']
    },
    room: { type: Schema.Types.ObjectId, ref: 'ChatRoom' },
    tags: [],
    username: {
        type: String,
        unique: true,
        required: true
    },
    usernameLower: {
        type: String,
        unique: true
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    coins: {
        balance: {type: Number, required: true, default: 0},
        transactions: [{
            category: { type: String, enum: ['load', 'award', 'transfer', 'tip', 'gift'], required: true },
            amount: {type: Number, required: true},
            creatdAt: {type: Date, required: true, default: Date.now()},
            details: {type: String}
        }]
    },
},{
    timestamps: true
});

BroadcasterSchema.pre('save', function (next) {
    var broadcaster = this;
    if (this.isModified('username') || this.isNew) {
        this.slug = slugify(this.username, {lower: true})
        this.usernameLower = this.username.toLowerCase()
    }
    return next();
});
BroadcasterSchema.plugin(mongoosePaginate);

BroadcasterSchema.virtual('broadcasterInfo').
get(function() { return {
    username: this.username,
    slug: this.slug,
    status: this.status
}
});


module.exports = mongoose.model('Broadcaster', BroadcasterSchema);
