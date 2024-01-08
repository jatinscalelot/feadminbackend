const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const onlineofferModel = require('../../../models/festumevento/onlineoffers.model');
const platformModel = require('../../../models/festumevento/platforms.model');
const onlineofferreviewModel = require('../../../models/festumevento/onlineofferreviews.model');
const linkModel = require('../../../models/festumevento/links.model');
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
            let havePermission = await config.getPermission(admindata.roleId, "onlineoffers", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, page, limit, search, status, approval_status, live_status } = req.body;
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
                if (live_status && live_status != null && live_status != undefined) {
                    query.is_live = live_status;
                }
                let totalOnlineOffers = parseInt(await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).countDocuments({}));
                let totalApprovedOnlineOffers = parseInt(await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).countDocuments({ status: true, is_approved: true }));
                let totalLiveOnlineOffers = parseInt(await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).countDocuments({ status: true, is_approved: true, is_live: true }));
                festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).paginate({
                    $or: [
                        { description: { '$regex': new RegExp(search, "i") } },
                        { shop_name: { '$regex': new RegExp(search, "i") } },
                        { start_date: { '$regex': new RegExp(search, "i") } },
                        { end_date: { '$regex': new RegExp(search, "i") } },
                        { product_name: { '$regex': new RegExp(search, "i") } },
                        { company_name: { '$regex': new RegExp(search, "i") } },
                        { company_contact_no: { '$regex': new RegExp(search, "i") } },
                        { company_email: { '$regex': new RegExp(search, "i") } },
                        { about_company: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id": -1 },
                    populate: [
                        { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel), select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite' },
                        { path: 'product_links.platform', model: festumeventoDB.model(constants.FE_MODELS.platforms, platformModel), select: 'name platformimage' },
                        { path: 'product_links.short_link_id', model: festumeventoDB.model(constants.FE_MODELS.links, linkModel), select: 'short_url clicks' }
                    ],
                    lean: true
                }).then((onlineoffers) => {
                    let alloffers = [];
                    async.forEachSeries(onlineoffers.docs, (offer, next_offer) => {
                        let totalClicks = 0;
                        (async () => {
                            async.forEachSeries(offer.product_links, (product_link, next_product_link) => {
                                totalClicks = totalClicks + ((product_link.short_link_id && product_link.short_link_id != null && product_link.short_link_id.clicks) ? parseInt(product_link.short_link_id.clicks) : 0);
                                next_product_link();
                            }, () => {
                                (async () => {
                                    let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.onlineofferreviews, onlineofferreviewModel).countDocuments({ offerid: new mongoose.Types.ObjectId(offer._id) }));
                                    if (noofreview > 0) {
                                        let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.onlineofferreviews, onlineofferreviewModel).aggregate([{ $match: { offerid: new mongoose.Types.ObjectId(offer._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                        if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                            offer.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                            offer.totalreviews = noofreview;
                                            offer.totalClicks = parseInt(totalClicks);
                                            alloffers.push(offer);
                                        }
                                    } else {
                                        offer.ratings = '0.0';
                                        offer.totalreviews = 0;
                                        offer.totalClicks = parseInt(totalClicks);
                                        alloffers.push(offer);
                                    }
                                    next_offer();
                                })().catch((error) => { return responseManager.onError(error, res); });
                            });
                        })().catch((error) => { return responseManager.onError(error, res); });
                    }, () => {
                        onlineoffers.docs = alloffers;
                        onlineoffers.totalOnlineOffers = totalOnlineOffers;
                        onlineoffers.totalApprovedOnlineOffers = totalApprovedOnlineOffers;
                        onlineoffers.totalLiveOnlineOffers = totalLiveOnlineOffers;
                        return responseManager.onSuccess("Online Offer List", onlineoffers, res);
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