const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const livestreamModel = require('../../../models/festumevento/livestreams.model');
const categoryModel = require('../../../models/festumevento/eventcategories.model');
const livestreamreviewModel = require('../../../models/festumevento/livestreamreviews.model');
const userModel = require('../../../models/festumevento/users.model');
const mongoose = require('mongoose');
const async = require('async');
exports.getonelivestream = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "livestreams", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { livestreamid } = req.body;
                if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                    let livestreamData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).populate([
                        { path: 'event_category', model: festumeventoDB.model(constants.FE_MODELS.eventcategories, categoryModel), select: "categoryname description event_type" },
                        { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: "-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite" }
                    ]).lean();
                    if (livestreamData && livestreamData != null) {
                        let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.livestreamreviews, livestreamreviewModel).countDocuments({ livestreamid: new mongoose.Types.ObjectId(livestreamData._id) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.livestreamreviews, livestreamreviewModel).aggregate([{ $match: { livestreamid: new mongoose.Types.ObjectId(livestreamData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                livestreamData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / parseInt(noofreview)).toFixed(1);
                                livestreamData.totalreview = parseInt(noofreview);
                            }
                        } else {
                            livestreamData.ratings = '0.0';
                            livestreamData.totalreview = parseInt(0);
                        }
                        let allreview = await festumeventoDB.model(constants.FE_MODELS.livestreamreviews, livestreamreviewModel).find({ livestreamid: new mongoose.Types.ObjectId(livestreamData._id) }).populate({ path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name mobile profilepic createdAt timestamp" }).lean();
                        livestreamData.reviews = allreview;
                        return responseManager.onSuccess('Organizer event live stream data!', livestreamData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream data, please try again' }, res);
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