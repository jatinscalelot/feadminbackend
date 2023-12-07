let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
    userid: {
        type: mongoose.Types.ObjectId,
		required: true
    },
    livestreamid:{
        type: mongoose.Types.ObjectId,
		required: true
    }
}, {timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;