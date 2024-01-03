const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const eventbookingcouponModel = require('../../../models/festumevento/eventbookingcoupons.model');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "eventbookingcoupons", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { page, limit, search, status } = req.body;
                let query = {};
                if(status != 'All'){
                    if(status == 'InActive'){
                        query.status = false;
                    }else if(status == 'Active'){
                        query.status = true;
                    }
                }
                let totalEventbookingcoupons = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).countDocuments({}));
                let totalActiveEventbookingcoupons = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).countDocuments({status : true}));
                let totalInActiveEventbookingcoupons = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).countDocuments({status : false}));
                festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).paginate({
                    $or: [
                        { title : { '$regex' : new RegExp(search, "i") } },
                        { code : { '$regex' : new RegExp(search, "i") } },
                        { description : { '$regex' : new RegExp(search, "i") } },
                    ],
                    ...query
                },{
                    page,
                    limit: parseInt(limit),
                    sort: { _id : -1 },
                    lean: true
                }).then((eventbookingcoupons) => {
                    eventbookingcoupons.totalEventbookingcoupons = totalEventbookingcoupons;
                    eventbookingcoupons.totalActiveEventbookingcoupons = totalActiveEventbookingcoupons;
                    eventbookingcoupons.totalInActiveEventbookingcoupons = totalInActiveEventbookingcoupons;
                    return responseManager.onSuccess('event booking coupons list!', eventbookingcoupons, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
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
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "eventbookingcoupons", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let activeEventBookingCoupons = await festumeventoDB.model(constants.FE_MODELS.eventbookingcoupons, eventbookingcouponModel).find({status : true}).lean();
                return responseManager.onSuccess('eventbookingcoupons list!', activeEventBookingCoupons, res);
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