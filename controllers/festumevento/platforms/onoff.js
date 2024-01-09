const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const platformModel = require('../../../models/festumevento/platforms.model');
const mongoose = require('mongoose');
exports.onoffplatform = async (req, res) => {
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
                    let existingplatformData = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(platformid).lean();
                    if(existingplatformData && existingplatformData != null){
                        if(existingplatformData.status == true){
                            await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findByIdAndUpdate(platformid, {status : false, updatedBy : new mongoose.Types.ObjectId(req.token.superadminid)});
                            let updatedPlatform = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(platformid).populate([
                                { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                            ]).lean();
                            return responseManager.onSuccess('Platform status updated successfully!', updatedPlatform, res);
                        }else{
                            await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findByIdAndUpdate(platformid, {status : true, updatedBy : new mongoose.Types.ObjectId(req.token.superadminid)});
                            let updatedPlatform = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(platformid).populate([
                                { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                            ]).lean();
                            return responseManager.onSuccess('Platform status updated successfully!', updatedPlatform, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid platform id to active in-active platform data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid platform id to active in-active platform data, please try again' }, res);
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