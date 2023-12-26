let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	display_name : {
		type: String,
		require: true
	},
    key_name : {
		type: String,
		require: true
	},
	description : {
		type: String,
		require: true
	},
	status : {
		type: Boolean,
		default: true
	},
    project_pic : {
		type: String,
        default : '',
	},
	createdBy: {
		type: mongoose.Types.ObjectId,
		default: null
	},
	updatedBy: {
		type: mongoose.Types.ObjectId,
		default: null
	}
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;