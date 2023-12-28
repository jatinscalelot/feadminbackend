const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const eventbookingcouponModel = require('../../../models/festumevento/eventbookingcoupons.model');
const mongoose = require('mongoose');
exports.onoffeventcoupon = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "eventbookingcoupons", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { eventbookingcouponid } = req.body;
                if(eventbookingcouponid && eventbookingcouponid != '' && mongoose.Types.ObjectId.isValid(eventbookingcouponid)){
                    let eventbookingcouponData = await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).findById(eventbookingcouponid).lean();
                    if(eventbookingcouponData){
                        if(eventbookingcouponData.status && eventbookingcouponData.status == true){
                            await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).findByIdAndUpdate(eventbookingcouponid, {status : false});
                            let updatedEventbookingcoupon = await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).findById(eventbookingcouponid).lean();
                            return responseManager.onSuccess('Event booking coupon status updated successfully!', updatedEventbookingcoupon, res);
                        }else{
                            await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).findByIdAndUpdate(eventbookingcouponid, {status : true});
                            let updatedEventbookingcoupon = await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).findById(eventbookingcouponid).lean();
                            return responseManager.onSuccess('Event booking coupon status updated successfully!', updatedEventbookingcoupon, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid event booking coupon id to Active InActive event booking coupon data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid event booking coupon id to Active InActive event booking coupon data, please try again' }, res);
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