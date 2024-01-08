const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const shopcategoryModel = require('../../../models/festumevento/shopcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.onoffshopcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "shopcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { shopcategoryid } = req.body;
                if(shopcategoryid && shopcategoryid != '' && shopcategoryid != null && mongoose.Types.ObjectId.isValid(shopcategoryid)){
                    let existingShopCategory = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findById(shopcategoryid).lean();
                    if(existingShopCategory){
                        if(existingShopCategory.status == true){
                            await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findByIdAndUpdate(shopcategoryid, {status : false, updatedBy: new mongoose.Types.ObjectId(admindata._id)});
                            let updatedShopCategory = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findById(shopcategoryid).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                            return responseManager.onSuccess('Shop Category status updated successfully!', updatedShopCategory, res);
                        }else{
                            await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findByIdAndUpdate(shopcategoryid, {status : true, updatedBy: new mongoose.Types.ObjectId(admindata._id)});
                            let updatedShopCategory = await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).findById(shopcategoryid).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                            return responseManager.onSuccess('Shop Category status updated successfully!', updatedShopCategory, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Shop Category Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Shop Category Mongo ID, please try again' }, res);
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