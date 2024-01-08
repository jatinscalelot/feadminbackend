const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const shopModel = require('../../../models/festumevento/shops.model');
const organizerModel = require('../../../models/festumevento/organizers.model');
const shopcategoryModel = require('../../../models/festumevento/shopcategories.model');
const shopreviewModel = require('../../../models/festumevento/shopreviews.model');
const offlineofferModel = require('../../../models/festumevento/offlineoffers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require('mongoose');
const async = require('async');
exports.getoneofflineshop = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "shops", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { offlineshopid } = req.body;
                if (offlineshopid && offlineshopid != '' && mongoose.Types.ObjectId.isValid(offlineshopid)) {
                    let shopData = await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).findById(offlineshopid).populate([
                        { path: 'shop_category', model: festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel), select: "categoryname description" },
                        { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel), select: "-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite" }
                    ]).lean();
                    if (shopData && shopData != null) {
                        let rightnow = Date.now();
                        let totalrunningoffer = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).countDocuments({ shopid: mongoose.Types.ObjectId(shopData._id), end_timestamp: { "$gte": rightnow } }));
                        let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(shopData._id) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(shopData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                shopData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                shopData.totalreviews = noofreview;
                                shopData.total_running_offers = (parseInt(totalrunningoffer) > 0) ? parseInt(totalrunningoffer) : 0;
                            }
                        } else {
                            shopData.ratings = '0.0';
                            shopData.totalreviews = 0;
                            shopData.total_running_offers = (parseInt(totalrunningoffer) > 0) ? parseInt(totalrunningoffer) : 0;
                        }
                        let allreviews = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).find({ shopid: mongoose.Types.ObjectId(shopData._id) }).populate([{ path: 'offerid', model: festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel), select: 'offer_title start_date end_date poster' }, { path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: 'name email country_code mobile profilepic' }]).lean();
                        shopData.reviews = allreviews;
                        return responseManager.onSuccess('Shop data!', shopData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid offline shop id to get Shop data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid offline shop id to get Shop data, please try again' }, res);
                }
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