let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let permission_Schema = new mongoose.Schema({
	collectionName: {
		type: String,
		default: "",
	},
	insertUpdate: {
		type: Boolean,
		default: true,
	},
	delete: {
		type: Boolean,
		default: true,
	},
	view: {
		type: Boolean,
		default: true,
	},
}, { _id: false });
let schema = new mongoose.Schema({
	name: {
		type: String,
		require: true
	},
	description: {
		type: String,
		require: true
	},
	status: {
		type: Boolean,
		default: true
	},
	permissions: {
		superadmin: [permission_Schema],
		festumevento: [permission_Schema],
		eventopackage: [permission_Schema],
		festumfield: [permission_Schema],
		festumcoin: [permission_Schema],
		festumadvertisingmedia: [permission_Schema],
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