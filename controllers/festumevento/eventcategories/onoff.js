const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const eventcategoryModel = require('../../../models/festumevento/eventcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.onoffeventcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "eventcategories", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { categoryid } = req.body;
                if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                    let eventcategoryData = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findById(categoryid).lean();
                    if(eventcategoryData){
                        if(eventcategoryData.status && eventcategoryData.status == true){
                            await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findByIdAndUpdate(categoryid, {status : false});
                            let updatedEventcategory = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findById(categoryid).lean();
                            return responseManager.onSuccess('Event category status updated successfully!', updatedEventcategory, res);
                        }else{
                            await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findByIdAndUpdate(categoryid, {status : true});
                            let updatedEventcategory = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findById(categoryid).lean();
                            return responseManager.onSuccess('Event category status updated successfully!', updatedEventcategory, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid category id to Active or InActive a category data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid category id to Active or InActive a category data, please try again' }, res);
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