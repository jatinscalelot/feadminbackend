const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/festumevento/admins.model');
const promotioncouponModel = require('../../../models/festumevento/notificationcoupons.model');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "notificationcoupons", "view", "festumevento", primary);
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
                let totalPromotionCoupons = parseInt(await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).countDocuments({}));
                let totalActivePromotionCoupons = parseInt(await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).countDocuments({ status: true }));
                let totalInActivePromotionCoupons = parseInt(await festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).countDocuments({ status: false }));
                festumeventoDB.model(constants.FE_MODELS.notificationcoupons, promotioncouponModel).paginate({
                    $or: [
                        { code: { '$regex': new RegExp(search, "i") } },
                        { description: { '$regex': new RegExp(search, "i") } },
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id: -1 },
                    populate: [
                        {path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},
                        {path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}
                    ],
                    lean: true
                }).then((notificationcoupons) => {
                    notificationcoupons.totalPromotionCoupons = totalPromotionCoupons;
                    notificationcoupons.totalActivePromotionCoupons = totalActivePromotionCoupons;
                    notificationcoupons.totalInActivePromotionCoupons = totalInActivePromotionCoupons;
                    return responseManager.onSuccess('Promotion coupons list!', notificationcoupons, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.forbiddenRequest(res);
            }
        } else {
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
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "notificationcoupons", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let allActivePromotionCoupons = await festumeventoDB.model(constants.MODELS.notificationcoupons, promotioncouponModel).find({status : true}).lean();
                return responseManager.onSuccess('Promotion Coupons List!', allActivePromotionCoupons, res);
            } else {
                return responseManager.forbiddenRequest(res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};