var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var slugify = require('slugify');

var UserSchema = new Schema({
    disableOfflineWarning: {type: Boolean, default: false},
    coins: {
        balance: {type: Number, required: true, default: 0},
        transactions: [{
            category: { type: String, enum: ['load', 'award', 'transfer', 'tip', 'gift'], required: true },
            amount: {type: Number, required: true},
            creatdAt: {type: Date, required: true, default: Date.now()},
            details: {type: String}
        }]
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    isLoggedIn: {
      type: Boolean,
      required: true,
      default: false
    },
    logins: [],
    logouts: [],
    password: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        default: ['user'],
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    }
},{
    timestamps: true
});

UserSchema.plugin(mongoosePaginate);

UserSchema.virtual('loginInfo').
get(function() { return {
    username: this.username,
    slug: this.slug,
    roles: this.roles,
    status: this.status,
    isLoggedIn: this.isLoggedIn,
    xp: this.xp,
    coins: this.coins,
    disableOfflineWarning: this.disableOfflineWarning
}
});

UserSchema.virtual('username_lower').get(function () {
    return this.username.toLowerCase();
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('username') || this.isNew) {
        this.slug = slugify(this.username, {lower: true})
    }
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }

            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);
