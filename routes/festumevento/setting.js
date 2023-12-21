let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const mongoose = require('mongoose');
const settingModel = require('../../models/settings.model');
router.get('/deposite', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
            if (defaultSetting && defaultSetting.length > 0) {
                return responseManager.onSuccess('setting data!', defaultSetting[0], res);
            }else{
                return responseManager.unauthorisedRequest(res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update deposite setting, please try again' }, res);
    }
});
router.post('/deposite', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
            if (defaultSetting && defaultSetting.length > 0) {
                if(defaultSetting[0].deposite == true){
                    await primary.model(constants.MODELS.settings, settingModel).findByIdAndUpdate(defaultSetting[0]._id, {deposite : false});
                    let settingdata = await primary.model(constants.MODELS.settings, settingModel).findById(defaultSetting[0]._id).lean();
                    return responseManager.onSuccess('setting data updated successfully!', settingdata, res);
                }else{
                    await primary.model(constants.MODELS.settings, settingModel).findByIdAndUpdate(defaultSetting[0]._id, {deposite : true});
                    let settingdata = await primary.model(constants.MODELS.settings, settingModel).findById(defaultSetting[0]._id).lean();
                    return responseManager.onSuccess('setting data updated successfully!', settingdata, res);
                }
            }else{
                return responseManager.unauthorisedRequest(res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update deposite setting, please try again' }, res);
    }
});
module.exports = router;