const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const shopModel = require('../../../models/festumevento/shops.model');
const organizerModel = require('../../../models/festumevento/organizers.model');
const shopreviewModel = require('../../../models/festumevento/shopreviews.model');
const offlineofferModel = require('../../../models/festumevento/offlineoffers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const userModel = require('../../../models/festumevento/users.model');
const offlineofferbookingModel = require('../../../models/festumevento/offlineofferbookings.model');
const mongoose = require('mongoose');
const async = require('async');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "offers", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, shopid, page, limit, search, status, approval_status } = req.body;
                let query = {};
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    query.createdBy = new mongoose.Types.ObjectId(organizerid);
                }
                if (status && status != null && status != undefined) {
                    query.status = status;
                }
                if (approval_status && approval_status != null && approval_status != undefined) {
                    query.is_approved = approval_status;
                }
                let totalOfflineOffer = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).countDocuments({}));
                let totalApprovedOfflineOffer = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).countDocuments({ status: true, is_approved: true }));
                let totalInActiveOfflineOffer = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).countDocuments({ $or: [{ status: false }, { is_approved: false }] }));
                if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                    festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).paginate({
                        $or: [
                            { offer_title: { '$regex': new RegExp(search, "i") } },
                            { description: { '$regex': new RegExp(search, "i") } }
                        ],
                        shopid: mongoose.Types.ObjectId(shopid),
                        ...query
                    }, {
                        page,
                        limit: parseInt(limit),
                        sort: { "_id": -1 },
                        populate: [
                            {
                                path: 'shopid',
                                model: festumeventoDB.model(constants.FE_MODELS.shops, shopModel),
                                select: 'shop_name about_shop location banner'
                            },
                            {
                                path: 'createdBy',
                                model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel),
                                select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite'
                            },
                        ],
                        lean: true
                    }).then((offlineoffers) => {
                        let alloffers = [];
                        async.forEachSeries(offlineoffers.docs, (offer, next_offer) => {
                            (async () => {
                                let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: new mongoose.Types.ObjectId(shopid), offerid: new mongoose.Types.ObjectId(offer._id) }));
                                if (noofreview > 0) {
                                    let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: new mongoose.Types.ObjectId(shopid), offerid: new mongoose.Types.ObjectId(offer._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                    if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                        offer.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                        offer.totalreviews = noofreview;
                                    }
                                } else {
                                    offer.ratings = '0.0';
                                    offer.totalreviews = 0;
                                }
                                if (offer.offer_on_all_products == true) {
                                    let totalbooked = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineofferbookings, offlineofferbookingModel).countDocuments({ offerid: new mongoose.Types.ObjectId(offer._id), shopid: new mongoose.Types.ObjectId(offer.shopid) }));
                                    let totalpossiblebooking = 0;
                                    async.forEachSeries(offer.all_product_conditions, (condition, next_condition) => {
                                        totalpossiblebooking = totalpossiblebooking + condition.person_limitation;
                                        next_condition();
                                    }, () => {
                                        offer.noofunbooked = parseInt(parseInt(totalpossiblebooking) - parseInt(totalbooked));
                                        offer.noofbooked = parseInt(totalbooked);
                                        offer.totaloffers = parseInt(totalpossiblebooking);
                                        alloffers.push(offer);
                                        next_offer();
                                    });
                                } else {
                                    if (offer.offer_type == 'limited_person') {
                                        let noofunbooked = 0;
                                        let noofbooked = 0;
                                        let totaloffers = 0;
                                        async.forEachSeries(offer.offer_type_conditions, (offer_type_condition, next_offer_type_condition) => {
                                            noofunbooked = noofunbooked + offer_type_condition.available_bookings;
                                            noofbooked = noofbooked + offer_type_condition.total_booked;
                                            totaloffers = totaloffers + offer_type_condition.person_limitation;
                                            next_offer_type_condition();
                                        }, () => {
                                            offer.noofunbooked = parseInt(noofunbooked);
                                            offer.noofbooked = parseInt(noofbooked);
                                            offer.totaloffers = parseInt(totaloffers);
                                            alloffers.push(offer);
                                            next_offer();
                                        });
                                    } else {
                                        let noofunbooked = 'Unlimited';
                                        let noofbooked = 0;
                                        let totaloffers = 'Unlimited';
                                        async.forEachSeries(offer.offer_type_conditions, (offer_type_condition, next_offer_type_condition) => {
                                            noofbooked = noofbooked + offer_type_condition.total_booked;
                                            next_offer_type_condition();
                                        }, () => {
                                            offer.noofunbooked = noofunbooked;
                                            offer.noofbooked = parseInt(noofbooked);
                                            offer.totaloffers = totaloffers;
                                            alloffers.push(offer);
                                            next_offer();
                                        });
                                    }
                                }
                            })().catch((error) => {  return responseManager.onError(error, res); });
                        }, () => {
                            offlineoffers.docs = alloffers;
                            offlineoffers.totalOfflineOffer = totalOfflineOffer;
                            offlineoffers.totalApprovedOfflineOffer = totalApprovedOfflineOffer;
                            offlineoffers.totalInActiveOfflineOffer = totalInActiveOfflineOffer;
                            return responseManager.onSuccess('Offline Offers list!', offlineoffers, res);
                        });
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                }else{
                    festumeventoDB.model(constants.FE_MODELS.shops, shopModel).find({
                        status: true,
                        is_approved: true
                    }).lean().then((shopList) => {
                        let shopIds = [];
                        async.forEachSeries(shopList, (shop, next_shop) => {
                          shopIds.push(mongoose.Types.ObjectId(shop._id));
                          next_shop();
                        }, () => {
                            ( async () => {
                                festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).paginate({
                                    shopid: { $in: shopIds },
                                    $or: [
                                        { offer_title: { '$regex': new RegExp(search, "i") } },
                                        { description: { '$regex': new RegExp(search, "i") } }
                                    ],
                                    ...query
                                }, {
                                    page,
                                    limit: parseInt(limit),
                                    sort: { _id: -1 },
                                    populate : [
                                        {
                                            path: 'shopid',
                                            model: festumeventoDB.model(constants.FE_MODELS.shops, shopModel),
                                            select: 'shop_name about_shop location banner'
                                        },
                                        {
                                            path: 'createdBy',
                                            model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel),
                                            select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite'
                                        }
                                    ],
                                    lean: true
                                }).then((offlineoffers) => {
                                    let alloffers = [];
                                    async.forEachSeries(offlineoffers.docs, (offer, next_offer) => {
                                        (async () => {
                                            let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: new mongoose.Types.ObjectId(offer.shopid._id), offerid: new mongoose.Types.ObjectId(offer._id) }));
                                            if (noofreview > 0) {
                                                let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: new mongoose.Types.ObjectId(offer.shopid._id), offerid: new mongoose.Types.ObjectId(offer._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                                if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                                    offer.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                                    offer.totalreviews = noofreview;
                                                }
                                            } else {
                                                offer.ratings = '0.0';
                                                offer.totalreviews = 0;
                                            }
                                            if (offer.offer_on_all_products == true) {
                                                let totalbooked = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineofferbookings, offlineofferbookingModel).countDocuments({ offerid: new mongoose.Types.ObjectId(offer._id), shopid: new mongoose.Types.ObjectId(offer.shopid._id) }));
                                                let totalpossiblebooking = 0;
                                                async.forEachSeries(offer.all_product_conditions, (condition, next_condition) => {
                                                    totalpossiblebooking = totalpossiblebooking + condition.person_limitation;
                                                    next_condition();
                                                }, () => {
                                                    offer.noofunbooked = parseInt(parseInt(totalpossiblebooking) - parseInt(totalbooked));
                                                    offer.noofbooked = parseInt(totalbooked);
                                                    offer.totaloffers = parseInt(totalpossiblebooking);
                                                    alloffers.push(offer);
                                                    next_offer();
                                                });
                                            } else {
                                                if (offer.offer_type == 'limited_person') {
                                                    let noofunbooked = 0;
                                                    let noofbooked = 0;
                                                    let totaloffers = 0;
                                                    async.forEachSeries(offer.offer_type_conditions, (offer_type_condition, next_offer_type_condition) => {
                                                        noofunbooked = noofunbooked + offer_type_condition.available_bookings;
                                                        noofbooked = noofbooked + offer_type_condition.total_booked;
                                                        totaloffers = totaloffers + offer_type_condition.person_limitation;
                                                        next_offer_type_condition();
                                                    }, () => {
                                                        offer.noofunbooked = parseInt(noofunbooked);
                                                        offer.noofbooked = parseInt(noofbooked);
                                                        offer.totaloffers = parseInt(totaloffers);
                                                        alloffers.push(offer);
                                                        next_offer();
                                                    });
                                                } else {
                                                    let noofunbooked = 'Unlimited';
                                                    let noofbooked = 0;
                                                    let totaloffers = 'Unlimited';
                                                    async.forEachSeries(offer.offer_type_conditions, (offer_type_condition, next_offer_type_condition) => {
                                                        noofbooked = noofbooked + offer_type_condition.total_booked;
                                                        next_offer_type_condition();
                                                    }, () => {
                                                        offer.noofunbooked = noofunbooked;
                                                        offer.noofbooked = parseInt(noofbooked);
                                                        offer.totaloffers = totaloffers;
                                                        alloffers.push(offer);
                                                        next_offer();
                                                    });
                                                }
                                            }
                                        })().catch((error) => { return responseManager.onError(error, res); });
                                    }, () => {
                                        offlineoffers.docs = alloffers;
                                        offlineoffers.totalOfflineOffer = totalOfflineOffer;
                                        offlineoffers.totalApprovedOfflineOffer = totalApprovedOfflineOffer;
                                        offlineoffers.totalInActiveOfflineOffer = totalInActiveOfflineOffer;
                                        return responseManager.onSuccess('Offline Offers list!', offlineoffers, res);
                                    });
                                }).catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            })().catch((error) => {return responseManager.onError(error, res);});
                        });
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
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