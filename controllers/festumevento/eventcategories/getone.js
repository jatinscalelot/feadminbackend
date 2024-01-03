const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const eventcategoryModel = require('../../../models/festumevento/eventcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.getoneeventcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "eventcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { categoryid } = req.body;
                if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                    let eventcategoryData = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findById(categoryid).lean();
                    if(eventcategoryData){
                        return responseManager.onSuccess('Event category status updated successfully!', eventcategoryData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Invalid category id to get Event Category Data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid category id to get Event Category Data, please try again' }, res);
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