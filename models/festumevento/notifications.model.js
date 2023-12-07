let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	notification_title : {
		type: String,
		require : true
	},
	banner : {
		type: String,
		require : true
	},
	description : {
		type: String,
		require : true
	},
	is_sent : {
		type: Boolean,
		default: false
	},
	is_payment_done : {
		type: Boolean,
		default: false
	},
	status : {
		type: Boolean,
		default: true
	},
	entitytype : {
		type: String,
        enum: ['event', 'livestream', 'onlineoffer', 'offlineoffer']
	},
	entityid : {
		type: mongoose.Types.ObjectId,
		default: null
	},
	is_notification : {
		type: Boolean,
		default: true
	},
	is_email : {
		type: Boolean,
		default: false
	},
	is_sms : {
		type: Boolean,
		default: false
	},
	emailtemplate : {
		type: mongoose.Types.ObjectId,
		default: null
	},
	smstemplate : {
		type: mongoose.Types.ObjectId,
		default: null
	},
	usertype : {
		type: String,
        enum: ['eventusers', 'shopusers', 'onlineofferusers', 'livestreamusers', 'allusers', 'excelusers'],
		require : false
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