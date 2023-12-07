let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	userid:{
		type: mongoose.Types.ObjectId,
		require: true
	},
	event_id : {
		type: mongoose.Types.ObjectId,
		require: true
	},
	payment_id : {
		type: String,
		require: true
	},
	PNR : {
		type: String,
		require: true
	},
	status : {
		type: String,
        enum: ['Paid']
	},
	seats : [],
	lastchatmessage : {
		lastmessageid : {
			type: mongoose.Types.ObjectId,
			default: null
		},
		timestamp : {
            type : Number,
            default: 0
        }
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