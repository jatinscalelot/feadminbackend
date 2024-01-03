const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/festumevento/admins.model');
const promotioncouponModel = require('../../../models/festumevento/notificationcoupons.model');
const mongoose = require('mongoose');
exports.getonepromotioncoupon = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "notificationcoupons", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { promotioncouponid } = req.body;
                if(promotioncouponid && promotioncouponid != '' && promotioncouponid != null && mongoose.Types.ObjectId.isValid(promotioncouponid)){
                    let existingPromotionCoupon = await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).findById(promotioncouponid).populate([{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).lean();
                    if(existingPromotionCoupon){
                        return responseManager.onSuccess('Promotion Coupon details!', existingPromotionCoupon, res);
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Promotion Coupon Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Invalid Promotion Coupon Mongo ID, please try again' }, res);
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