const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const platformModel = require('../../../models/festumevento/platforms.model');
const mongoose = require('mongoose');
exports.getoneplatform = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "platforms", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { platformid } = req.body;
                if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                    let platformData = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(platformid).populate([
                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                    ]).lean();
                    if(platformData && platformData != null){
                        return responseManager.onSuccess('platform data!', platformData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Invalid platform id to get platform data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid platform id to get platform data, please try again' }, res);
                }
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