let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	name : {
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
	permissions : {
		superadmin: [{
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
		}],
		festumevento: [{
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
		}],
		eventopackage: [{
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
		}],
		festumfield: [{
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
		}],
		festumcoin: [{
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
		}],
		festumadvertisingmedia: [{
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
		}],
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