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
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "shops", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, page, limit, search, status, approval_status } = req.body;
                let query = {};
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    query.createdBy = new mongoose.Types.ObjectId(organizerid);
                }
                if(status != 'All'){
                    if(status == 'InActive'){
                        query.status = false;
                    }else if(status == 'Active'){
                        query.status = true;
                    }
                }
                if(approval_status != 'All'){
                    if(approval_status == 'InActive'){
                        query.is_approved = false;
                    }else if(approval_status == 'Active'){
                        query.is_approved = true;
                    }
                }
                let totalOfflineShops = parseInt(await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).countDocuments({}));
                let totalApprovedOfflineShops = parseInt(await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).countDocuments({ status: true, is_approved: true }));
                let totalUnApprovedOfflineShops = parseInt(await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).countDocuments({ $or: [{ status: false }, { is_approved: false }] }));
                festumeventoDB.model(constants.FE_MODELS.shops, shopModel).paginate({
                    $or: [
                        { shop_name: { '$regex': new RegExp(search, "i") } },
                        { about_shop: { '$regex': new RegExp(search, "i") } },
                        { flat_no: { '$regex': new RegExp(search, "i") } },
                        { street_name: { '$regex': new RegExp(search, "i") } },
                        { area_name: { '$regex': new RegExp(search, "i") } },
                        { city: { '$regex': new RegExp(search, "i") } },
                        { state: { '$regex': new RegExp(search, "i") } },
                        { pincode: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id: -1 },
                    populate: [
                        { path: 'shop_category', model: festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel), select: "categoryname description" },
                        { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel), select: "-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite" }
                    ],
                    lean: true
                }).then((shoplist) => {
                    let finalShops = [];
                    async.forEachSeries(shoplist.docs, (shop, next_shop) => {
                        (async () => {
                            let rightnow = Date.now();
                            let totalrunningoffer = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).countDocuments({ shopid: new mongoose.Types.ObjectId(shop._id), end_timestamp: { "$gte": rightnow } }));
                            let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: new mongoose.Types.ObjectId(shop._id) }));
                            if (noofreview > 0) {
                                let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: new mongoose.Types.ObjectId(shop._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                    shop.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                    shop.totalreviews = noofreview;
                                    shop.total_running_offers = (parseInt(totalrunningoffer) > 0) ? parseInt(totalrunningoffer) : 0;
                                    finalShops.push(shop);
                                }
                            } else {
                                shop.ratings = '0.0';
                                shop.totalreviews = 0;
                                shop.total_running_offers = (parseInt(totalrunningoffer) > 0) ? parseInt(totalrunningoffer) : 0;
                                finalShops.push(shop);
                            }
                            next_shop();
                        })().catch((error) => { return responseManager.onError(error, res); });
                    }, () => {
                        shoplist.docs = finalShops;
                        shoplist.totalOfflineShops = totalOfflineShops;
                        shoplist.totalApprovedOfflineShops = totalApprovedOfflineShops;
                        shoplist.totalUnApprovedOfflineShops = totalUnApprovedOfflineShops;
                        return responseManager.onSuccess('Shops list!', shoplist, res);
                    });
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
            let havePermission = await config.getPermission(admindata.roleId, "shops", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let shopList = await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).find({status : true, is_approved : true}).populate([
                    { path: 'shop_category', model: festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel), select: "categoryname description" },
                    { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel), select: "-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite" }
                ]).select("shop_category banner shop_name about_shop createdBy updatedBy").sort({_id: -1}).lean();
                return responseManager.onSuccess('Shops list!', shopList, res);
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