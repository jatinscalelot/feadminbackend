const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const livestreamModel = require('../../../models/festumevento/livestreams.model');
const categoryModel = require('../../../models/festumevento/eventcategories.model');
const livestreamreviewModel = require('../../../models/festumevento/livestreamreviews.model');
const mongoose = require('mongoose');
const async = require('async');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "livestreams", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, event_category, page, limit, search, status, approval_status, live_status, paid_free } = req.body;
                let query = {};
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    query.createdBy = new mongoose.Types.ObjectId(organizerid);
                }
                if (event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)) {
                    query.event_category = new mongoose.Types.ObjectId(event_category);
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
                if (paid_free && paid_free != null && paid_free != undefined && paid_free != 'All') {
                    if(paid_free == 'free'){
                        query.event_type = 'free';
                    }else{
                        query.event_type = 'paid';
                    }
                }
                let totalLivestream = parseInt(await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).countDocuments({}));
                let totalApprovedLivestream = parseInt(await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).countDocuments({ status : true, is_approved : true }));
                let totalLiveLivestream = parseInt(await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).countDocuments({ status : true, is_approved : true, is_live : true, accept_booking : true}));
                festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).paginate({
                    $or: [
                        { event_name: { '$regex': new RegExp(search, "i") } },
                        { event_description: { '$regex': new RegExp(search, "i") } },
                        { event_type: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    populate: [
                        { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel), select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite' },
                        { path: 'event_category', model: festumeventoDB.model(constants.FE_MODELS.eventcategories, categoryModel), select: "categoryname description event_type" }
                    ],
                    lean: true
                }).then((livestreames) => {
                    let alllivestreame = [];
                    async.forEachSeries(livestreames.docs, (livestreame, next_livestreame) => {
                        ( async () => {
                            let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.livestreamreviews, livestreamreviewModel).countDocuments({ livestreamid: new mongoose.Types.ObjectId(livestreame._id) }));
                            if (noofreview > 0) {
                                let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.livestreamreviews, livestreamreviewModel).aggregate([{ $match: { livestreamid: new mongoose.Types.ObjectId(livestreame._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                    livestreame.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / parseInt(noofreview)).toFixed(1);
                                    livestreame.totalreview = parseInt(noofreview);
                                    alllivestreame.push(livestreame);
                                }
                            } else {
                                livestreame.ratings = '0.0';
                                livestreame.totalreview = parseInt(0);
                                alllivestreame.push(livestreame);
                            }
                            next_livestreame();
                        })().catch((error) => {
                            console.log('error', error);
                        });
                    }, () => {
                        livestreames.docs = alllivestreame;
                        livestreames.totalLivestream = totalLivestream;
                        livestreames.totalApprovedLivestream = totalApprovedLivestream;
                        livestreames.totalLiveLivestream = totalLiveLivestream;
                        return responseManager.onSuccess('Events Live Stream list!', livestreames, res);
                    });
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