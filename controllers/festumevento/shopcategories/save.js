const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const shopcategoryModel = require('../../../models/festumevento/shopcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.saveshopcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "shopcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { categoryid, categoryname, description } = req.body;
                if(categoryname && categoryname != '' && categoryname.trim() != ''){
                    if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                        let existingCategory = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findOne({ _id: { $ne: categoryid }, categoryname: categoryname }).lean();
                        if (existingCategory == null) {
                            let obj = {
                                categoryname: categoryname,
                                description: description,
                                updatedBy: new mongoose.Types.ObjectId(req.token.superadminid)
                            };
                            await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findByIdAndUpdate(categoryid, obj);
                            let updatedData = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findById(categoryid).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                            return responseManager.onSuccess('Category updated sucecssfully!', updatedData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                        }
                    } else {
                        let existingCategory = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findOne({ categoryname: categoryname }).lean();
                        if (existingCategory == null) {
                            let obj = {
                                categoryname: categoryname,
                                description: description,
                                status: true,
                                createdBy: new mongoose.Types.ObjectId(req.token.superadminid),
                                updatedBy: new mongoose.Types.ObjectId(req.token.superadminid)
                            };
                            let insertedData = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).create(obj);
                            let updatedData = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findById(insertedData._id).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                            return responseManager.onSuccess('Category created sucecssfully!', updatedData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                        }
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid category name, category name can not be empty, please try again' }, res);
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