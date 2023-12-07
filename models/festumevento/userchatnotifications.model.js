let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	title : {
		type: String,
		require: true
	},
	message : {
		type: String,
		require: true
	},
	banner: {
		type: String,
		default : null
	},
	type:{
		type: String,
		enum: ['chat']
	},
    userid: {
		type: mongoose.Types.ObjectId,
		default: null
	},
    entityid: {
		type: mongoose.Types.ObjectId,
		default: null
	}
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;