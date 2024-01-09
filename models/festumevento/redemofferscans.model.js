let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	userid : {
		type: String,
		require: true
	},
	organizerid: {
		type: String,
		require: true
	},
	fcoin: {
		type: Number,
		default: 0
	},
	timestamp: {
		type: Number,
		default: 0
	}
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;