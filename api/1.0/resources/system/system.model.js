var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SystemSchema = new Schema({
    guestNo: {type: Number, default: 1}
});

module.exports = mongoose.model('System', SystemSchema);
