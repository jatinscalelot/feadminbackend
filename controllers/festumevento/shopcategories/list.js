const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const shopcategoryModel = require('../../../models/festumevento/shopcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "shopcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
              
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
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "shopcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
              
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