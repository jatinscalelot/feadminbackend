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
const userModel = require('../../../models/festumevento/users.model');
const mongoose = require('mongoose');
const async = require('async');
exports.getoneonlineoffer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "onlineoffers", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { onlineofferid } = req.body;
                if (onlineofferid && onlineofferid != '' && mongoose.Types.ObjectId.isValid(onlineofferid)) {
                    let onlineOfferData = await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).findById(onlineofferid).populate([{
                        path: 'product_links.platform',
                        model: festumeventoDB.model(constants.FE_MODELS.platforms, platformModel),
                        select: 'name platformimage'
                    }, {
                        path: 'product_links.short_link_id',
                        model: festumeventoDB.model(constants.FE_MODELS.links, linkModel),
                        select: 'short_url clicks'
                    }, {
                        path: 'createdBy',
                        model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel),
                        select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite'
                    }]).lean();
                    if (onlineOfferData) {
                        let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.onlineofferreviews, onlineofferreviewModel).countDocuments({ offerid: new mongoose.Types.ObjectId(onlineOfferData._id) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.onlineofferreviews, onlineofferreviewModel).aggregate([{ $match: { offerid: new mongoose.Types.ObjectId(onlineOfferData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                onlineOfferData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                onlineOfferData.totalreviews = noofreview;
                            }
                        } else {
                            onlineOfferData.ratings = '0.0';
                            onlineOfferData.totalreviews = 0;
                        }
                        let allreview = await festumeventoDB.model(constants.FE_MODELS.onlineofferreviews, onlineofferreviewModel).find({ offerid: new mongoose.Types.ObjectId(onlineOfferData._id) }).populate({ path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name mobile profilepic" }).lean();
                        onlineOfferData.offerreviews = allreview;
                        return responseManager.onSuccess("Online Offer Data", onlineOfferData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
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