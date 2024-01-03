const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const eventcategoryModel = require('../../../models/festumevento/eventcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.saveeventcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "insertUpdate", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { categoryid, categoryname, description, event_type } = req.body;
                if(categoryname && categoryname.trim() != '' && categoryname != null){
                    if (event_type) {
                        if (event_type == 'b2b' || event_type == 'public_party') {
                            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                                let existingCategory = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findOne({ _id: { $ne: categoryid }, categoryname: categoryname }).lean();
                                if (existingCategory == null) {
                                    let obj = {
                                        categoryname: categoryname,
                                        description: description,
                                        event_type: event_type,
                                        updatedBy: mongoose.Types.ObjectId(req.token.superadminid)
                                    };
                                    await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findByIdAndUpdate(categoryid, obj);
                                    let updatedData = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findById(categoryid).lean();
                                    return responseManager.onSuccess('Category updated sucecssfully!', updatedData, res);
                                } else {
                                    return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                                }
                            } else {
                                let existingCategory = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).findOne({ categoryname: categoryname }).lean();
                                if (existingCategory == null) {
                                    let obj = {
                                        categoryname: categoryname,
                                        description: description,
                                        event_type: event_type,
                                        status: true,
                                        createdBy: mongoose.Types.ObjectId(req.token.superadminid),
                                        updatedBy: mongoose.Types.ObjectId(req.token.superadminid)
                                    };
                                    let insertedData = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).create(obj);
                                    return responseManager.onSuccess('Category created sucecssfully!', insertedData, res);
                                } else {
                                    return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                                }
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid event type for category it can be b2b or public_party only, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event type for category, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Category name can not be empty, please try again' }, res);
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