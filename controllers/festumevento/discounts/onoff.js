const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const discountModel = require('../../../models/festumevento/discounts.model');
const mongoose = require('mongoose');
exports.onoffdiscount = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "discounts", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { discountid } = req.body;
                if( discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)){
                    let discountData = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findById(discountid).lean();
                    if(discountData){
                        if(discountData.status == true){
                            await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findByIdAndUpdate(discountid, {status : false, updatedBy : mongoose.Types.ObjectId(req.token.superadminid) });
                            let updatedDiscount = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findById(discountid).populate([
                                { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                            ]).lean();
                            return responseManager.onSuccess('Discount status updated successfully!', updatedDiscount, res);
                        }else{
                            await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findByIdAndUpdate(discountid, {status : true, updatedBy : mongoose.Types.ObjectId(req.token.superadminid) });
                            let updatedDiscount = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findById(discountid).populate([
                                { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                            ]).lean();
                            return responseManager.onSuccess('Discount status updated successfully!', updatedDiscount, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid discount id to update discount data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid discount id to update discount data, please try again' }, res);
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