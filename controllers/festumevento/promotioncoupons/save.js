const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/festumevento/admins.model');
const promotioncouponModel = require('../../../models/festumevento/notificationcoupons.model');
const mongoose = require('mongoose');
exports.savepromotioncoupon = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "notificationcoupons", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { promotioncouponid, code, description, amount, percentage, limit, expiry_date, expiry_time } = req.body;
                if(code && code != '' && code.trim() != '' && code.trim().length > 6){
                    if((amount && !isNaN(amount)) || (percentage && !isNaN(percentage))){
                        if((limit && !isNaN(limit)) || (expiry_date && expiry_time)){
                            if(promotioncouponid && promotioncouponid != '' && mongoose.Types.ObjectId.isValid(promotioncouponid)){
                                let existingPromotionCoupon = await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).findOne({_id : {$ne : promotioncouponid}, code : code}).lean();
                                if(existingPromotionCoupon == null){
                                    let newdate = expiry_date + ' ' + expiry_time;
                                    const finalDate = new Date(newdate);
                                    let timestamp = (expiry_date && expiry_date != '' && expiry_time && expiry_time != '') ? finalDate.getTime() : 0;
                                    let obj = {
                                        code : code.trim().replace(/\s/g, '').toUpperCase(),
                                        description : description,
                                        amount : amount,
                                        percentage : percentage,
                                        limit : limit,
                                        expiry_date : expiry_date,
                                        expiry_time : expiry_time,
                                        expiry_timestamp : timestamp,
                                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                                    };
                                    await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).findByIdAndUpdate(promotioncouponid, obj);
                                    let updatedData = await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).findById(promotioncouponid).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                                    return responseManager.onSuccess('Promotion coupon updated sucecssfully!', updatedData, res);
                                }else{
                                    return responseManager.badrequest({ message: 'Promotion coupon code can not be identical, please try again' }, res);
                                }
                            }else{
                                let existingPromotionCoupon = await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).findOne({code : code}).lean();
                                if(existingPromotionCoupon == null) {
                                    let newdate = expiry_date + ' ' + expiry_time;
                                    const finalDate = new Date(newdate);
                                    let timestamp = (expiry_date && expiry_date != '' && expiry_time && expiry_time != '') ? finalDate.getTime() : 0;
                                    let obj = {
                                        code : code.trim().replace(/\s/g, '').toUpperCase(),
                                        description : description,
                                        amount : parseFloat(amount),
                                        percentage : parseFloat(percentage),
                                        limit : (limit) ? parseInt(limit) : 0,
                                        expiry_date : expiry_date,
                                        expiry_time : expiry_time,
                                        expiry_timestamp : timestamp,
                                        status : true,
                                        total_used : 0,
                                        createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                                    };
                                    let insertedData = await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).create(obj);
                                    let newAddedData = await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).findById(insertedData._id).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                                    return responseManager.onSuccess('Promotion coupon created sucecssfully!', newAddedData, res);
                                }else{
                                    return responseManager.badrequest({ message: 'Promotion coupon code can not be identical, please try again' }, res);
                                }
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Please set limit in days or expiry date time for Promotion coupon code and try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Promotion coupon code amount and percentage value both can not be empty and must be a number, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Promotion coupon code must be > 6 chars, please try again' }, res);
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