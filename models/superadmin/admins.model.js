let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	name : {
		type: String,
		require: true
	},
	email :  {
		type: String,
		require: true
	},
	mobile :  {
		type: String,
		require: true
	},
	country_code :  {
		type: String,
		require: true
	},
	password :  {
		type: String,
		require: true
	},
	fcm_token :  {
		type: String,
		require: false,
		default : ""
	},
	status :  {
		type: Boolean,
		require: true,
		default : true
	},
	about :  {
		type: String,
		require: false,
		default : ""
	},
	city :  {
		type: String,
		require: false,
		default : ""
	},
	country :  {
		type: String,
		require: false,
		default : ""
	},
	dob :  {
		type: String,
		require: false,
		default : ""
	},
	pincode :  {
		type: String,
		require: false,
		default : ""
	},
	state :  {
		type: String,
		require: false,
		default : ""
	},
	profile_pic :  {
		type: String,
		require: false,
		default : ""
	},
	adminid :  {
		type: String,
		require: false,
		default : ""
	},
	channelID :  {
		type: String,
		require: false,
		default : ""
	},
    roleId : {
        type: mongoose.Types.ObjectId,
		default: null
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