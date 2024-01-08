const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const settingModel = require('../../../models/festumevento/settings.model');
const mongoose = require('mongoose');
exports.onoffdepositemoduleonglobalsetting = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "settings", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let defaultSetting = await festumeventoDB.model(constants.FE_MODELS.settings, settingModel).find({}).lean();
                if (defaultSetting && defaultSetting.length > 0) {
                    if (defaultSetting[0].deposite == true) {
                        await festumeventoDB.model(constants.FE_MODELS.settings, settingModel).findByIdAndUpdate(defaultSetting[0]._id, { deposite: false, updatedBy: new mongoose.Types.ObjectId(admindata._id) });
                        let settingdata = await festumeventoDB.model(constants.FE_MODELS.settings, settingModel).findById(defaultSetting[0]._id).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                        return responseManager.onSuccess('setting data updated successfully!', settingdata, res);
                    } else {
                        await festumeventoDB.model(constants.FE_MODELS.settings, settingModel).findByIdAndUpdate(defaultSetting[0]._id, { deposite: true, updatedBy: new mongoose.Types.ObjectId(admindata._id) });
                        let settingdata = await festumeventoDB.model(constants.FE_MODELS.settings, settingModel).findById(defaultSetting[0]._id).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                        return responseManager.onSuccess('setting data updated successfully!', settingdata, res);
                    }
                } else {
                    return responseManager.unauthorisedRequest(res);
                }
            } else {
                return responseManager.forbiddenRequest(res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};