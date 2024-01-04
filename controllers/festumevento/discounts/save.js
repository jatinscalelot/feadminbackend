const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const discountModel = require('../../../models/festumevento/discounts.model');
const mongoose = require('mongoose');
exports.savediscount = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "discounts", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { discountid, discountname, discounttype, description, discount, status, tandc } = req.body;
                if(!isNaN(discount)){
                    if(discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)){
                        let existingdiscount = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findOne({_id : {$ne : discountid}, discountname : discountname}).lean();
                        if(existingdiscount == null){
                            let obj = {
                                discountname : discountname,
                                discounttype : discounttype,
                                description : description,
                                discount : parseFloat(discount),
                                tandc : tandc,
                                status : status,
                                updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                            };
                            await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findByIdAndUpdate(discountid, obj);
                            let updatedData = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findById(discountid).populate([
                                { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                            ]).lean();
                            return responseManager.onSuccess('Discount updated sucecssfully!', updatedData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Discount name can not be identical, please try again' }, res);
                        }
                    }else{
                        let existingdiscount = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findOne({discountname : discountname}).lean();
                        if(existingdiscount == null) {
                            let obj = {
                                discountname : discountname,
                                discounttype : discounttype,
                                description : description,
                                discount : parseFloat(discount),
                                tandc : tandc,
                                status : status,
                                createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                                updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                            };
                            let insertedData = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).create(obj);
                            let newinsertedData = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findById(insertedData._id).populate([
                                { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                            ]).lean();
                            return responseManager.onSuccess('Discount created sucecssfully!', newinsertedData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Discount name can not be identical, please try again' }, res);
                        }
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid discount percentage to create Discount, please try again' }, res);
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