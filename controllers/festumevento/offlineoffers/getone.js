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
exports.getoneofflineoffer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "offers", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { offerid } = req.body;
                if (offerid && offerid != '' && mongoose.Types.ObjectId.isValid(offerid)) {
                    let offlineOfferData = await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findById(offerid).populate([
                        {
                            path: 'shopid',
                            model: festumeventoDB.model(constants.FE_MODELS.shops, shopModel)
                        },
                        {
                            path: 'createdBy',
                            model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel),
                            select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite'
                        }
                    ]).lean();
                    if (offlineOfferData) {
                        let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).countDocuments({ offerid: new mongoose.Types.ObjectId(offerid) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { offerid: new mongoose.Types.ObjectId(offerid) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                offlineOfferData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                offlineOfferData.totalreviews = noofreview;
                            }
                        } else {
                            offlineOfferData.ratings = '0.0';
                            offlineOfferData.totalreviews = 0;
                        }
                        let allreview = await festumeventoDB.model(constants.FE_MODELS.shopreviews, shopreviewModel).find({ offerid: new mongoose.Types.ObjectId(offerid) }).populate({ path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name mobile profilepic" }).lean();
                        offlineOfferData.reviews = allreview;
                        if (offlineOfferData.offer_on_all_products == true) {
                            let totalbooked = parseInt(await festumeventoDB.model(constants.FE_MODELS.offlineofferbookings, offlineofferbookingModel).countDocuments({ offerid: new mongoose.Types.ObjectId(offlineOfferData._id) }));
                            let totalpossiblebooking = 0;
                            async.forEachSeries(offlineOfferData.all_product_conditions, (condition, next_condition) => {
                                totalpossiblebooking = totalpossiblebooking + condition.person_limitation;
                                next_condition();
                            }, () => {
                                offlineOfferData.noofunbooked = parseInt(parseInt(totalpossiblebooking) - parseInt(totalbooked));
                                offlineOfferData.noofbooked = parseInt(totalbooked);
                                offlineOfferData.totaloffers = parseInt(totalpossiblebooking);
                                return responseManager.onSuccess("shop offer data", offlineOfferData, res);
                            });
                        } else {
                            if (offlineOfferData.offer_type == 'limited_person') {
                                let noofunbooked = 0;
                                let noofbooked = 0;
                                let totaloffers = 0;
                                async.forEachSeries(offlineOfferData.offer_type_conditions, (offer_type_condition, next_offer_type_condition) => {
                                    noofunbooked = noofunbooked + offer_type_condition.available_bookings;
                                    noofbooked = noofbooked + offer_type_condition.total_booked;
                                    totaloffers = totaloffers + offer_type_condition.person_limitation;
                                    next_offer_type_condition();
                                }, () => {
                                    offlineOfferData.noofunbooked = parseInt(noofunbooked);
                                    offlineOfferData.noofbooked = parseInt(noofbooked);
                                    offlineOfferData.totaloffers = parseInt(totaloffers);
                                    return responseManager.onSuccess("shop offer data", offlineOfferData, res);
                                });
                            } else {
                                let noofunbooked = 'Unlimited';
                                let noofbooked = 0;
                                let totaloffers = 'Unlimited';
                                async.forEachSeries(offlineOfferData.offer_type_conditions, (offer_type_condition, next_offer_type_condition) => {
                                    noofbooked = noofbooked + offer_type_condition.total_booked;
                                    next_offer_type_condition();
                                }, () => {
                                    offlineOfferData.noofunbooked = parseInt(noofunbooked);
                                    offlineOfferData.noofbooked = parseInt(noofbooked);
                                    offlineOfferData.totaloffers = parseInt(totaloffers);
                                    return responseManager.onSuccess("shop offer data", offlineOfferData, res);
                                });
                            }
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid offer id to get offline offers data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid offer id to get offline offers data, please try again' }, res);
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