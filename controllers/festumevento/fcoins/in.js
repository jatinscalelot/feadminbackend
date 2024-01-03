const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const fcoinintransactionsModel = require('../../../models/festumevento/fcoinintransactions.model');
const mongoose = require('mongoose');
exports.fcoinintransactions = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "fcoinintransactions", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { page, limit, search } = req.body;
                let totalfcoinintransactions = parseInt(await festumeventoDB.model(constants.FE_MODELS.fcoinintransactions, fcoinintransactionsModel).countDocuments({}));
                festumeventoDB.model(constants.FE_MODELS.fcoinintransactions, fcoinintransactionsModel).paginate({
                    $or: [
                        { transaction_reference_id : { '$regex' : new RegExp(search, "i") } },
                        { chequeno : { '$regex' : new RegExp(search, "i") } },
                        { bank_name : { '$regex' : new RegExp(search, "i") } },
                        { ifsc_code : { '$regex' : new RegExp(search, "i") } },
                        { amount : { '$regex' : new RegExp(search, "i") } },
                        { coin_amount : { '$regex' : new RegExp(search, "i") } },
                        { description : { '$regex' : new RegExp(search, "i") } },
                        { notes : { '$regex' : new RegExp(search, "i") } }
                    ]
                },{
                    page,
                    limit: parseInt(limit),
                    sort: { "timestamp" : -1 },
                    populate: { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name email mobile country_code profile_pic" },
                    lean: true
                }).then((intransactions) => {
                    intransactions.totalfcoinintransactions = totalfcoinintransactions;
                    return responseManager.onSuccess('F-Coins In Transactions list!', intransactions, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.forbiddenRequest(res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};