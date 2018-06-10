var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

const enums = {
    from: {
        type: ['user','broadcaster']
    }
}

var PurchasesSchema = new Schema({
    units: {
        type: Number, min: 1, required: true
    },
    price: {
        perUnit: {
            type: Number, required: true
        },
        total: {
            type: Number, required: true
        }
    },
    from: {
        slug: {type: String, required: true},
        username: {type: String, required: true}
    },
    clientTime: {type: Date, required: true},
    serverTime: Date,
    transmitTime: Date
},{
    timestamps: true
});

PurchasesSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Purchases', PurchasesSchema);
