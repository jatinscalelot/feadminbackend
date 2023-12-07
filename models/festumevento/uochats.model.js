let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
    organizerid : {
        type: mongoose.Types.ObjectId,
		require: true
    },
    userid : {
        type: mongoose.Types.ObjectId,
		require: true
    },
    eventid : {
        type: mongoose.Types.ObjectId,
		require: true
    },
    context : {
        type: mongoose.Types.ObjectId,
		require: true
    },
    contentType : {
        type: String,
		require: true
    },
    content : {
        text : {
            message : {
                type: String,
                default: ''
            }
        },
        media : {
            path : {
                type: String,
                default: ''
            },
            type : {
                type: String,
                default: ''
            },
            mime : {
                type: String,
                default: ''
            },
            name : {
                type: String,
                default: ''
            }
        }
    },
    chatflow : {
        type: String,
		enum: ['utoo', 'otou']
    }
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;