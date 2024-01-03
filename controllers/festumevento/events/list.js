const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const organiserModel = require('../../../models/festumevento/organizers.model');
const eventModel = require('../../../models/festumevento/events.model');
const categoryModel = require('../../../models/festumevento/eventcategories.model');
const itemModel = require('../../../models/festumevento/items.model');
const eventreviewModel = require('../../../models/festumevento/eventreviews.model');
const mongoose = require('mongoose');
const async = require('async');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "events", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, event_category, page, limit, search, status, approval_status, live_status, booking_status } = req.body;
                let query = {};
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    query.createdBy = mongoose.Types.ObjectId(organizerid);
                }
                if (event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)) {
                    query.event_category = mongoose.Types.ObjectId(event_category);
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
                if (booking_status && booking_status != null && booking_status != undefined) {
                    query.accept_booking = booking_status;
                }
                let totalEvents = parseInt(await festumeventoDB.model(constants.FE_MODELS.events, eventModel).countDocuments({}));
                let totalApprovedEvents = parseInt(await festumeventoDB.model(constants.FE_MODELS.events, eventModel).countDocuments({ status : true, is_approved : true }));
                let totalLiveEvents = parseInt(await festumeventoDB.model(constants.FE_MODELS.events, eventModel).countDocuments({ status : true, is_approved : true, is_live : true, accept_booking : true}));
                festumeventoDB.model(constants.FE_MODELS.events, eventModel).paginate({
                    $or: [
                        { name: { '$regex': new RegExp(search, "i") } },
                        { event_type: { '$regex': new RegExp(search, "i") } },
                        { other: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    populate: [
                        { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organiserModel), select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite' },
                        { path: 'event_category', model: festumeventoDB.model(constants.FE_MODELS.eventcategories, categoryModel), select: "categoryname description event_type" },
                        { path: "discounts.items", model: festumeventoDB.model(constants.FE_MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                        { path: "seating_arrangements.seating_item", model: festumeventoDB.model(constants.FE_MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' }
                    ],
                    select: 'name event_type event_financial_type event_category other timestamp status createdAt updatedAt about event_location banner accept_booking is_approved is_live iseditable seating_arrangements total_event_cost total_event_deposit',
                    lean: true
                }).then((eventsList) => {
                    let allEvents = [];
                    async.forEachSeries(eventsList.docs, (event, next_event) => {
                        (async () => {
                            let noofunsold = 0;
                            let noofsold = 0;
                            let totalseat = 0;
                            async.forEachSeries(event.seating_arrangements, (seating_arrangement, next_seating_arrangement) => {
                                async.forEachSeries(seating_arrangement.arrangements, (arrangement, next_arrangement) => {
                                    noofunsold += parseInt(arrangement.total_available_seats);
                                    noofsold += parseInt(arrangement.total_booked);
                                    totalseat += parseInt(arrangement.total_seats);
                                    next_arrangement();
                                }, () => {
                                    next_seating_arrangement();
                                });
                            }, () => {
                                (async () => {
                                    event.total_available_seats = noofunsold;
                                    event.total_booked_seats = noofsold;
                                    event.total_seats = totalseat;
                                    delete event.seating_arrangements;
                                    let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: mongoose.Types.ObjectId(event._id) }));
                                    if (noofreview > 0) {
                                        let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: mongoose.Types.ObjectId(event._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                        if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                            event.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / parseInt(noofreview)).toFixed(1);
                                            event.totalreview = parseInt(noofreview);
                                            allEvents.push(event);
                                        }
                                    } else {
                                        event.ratings = '0.0';
                                        event.totalreview = parseInt(0);
                                        allEvents.push(event);
                                    }
                                    next_event();
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            });
                        })().catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }, () => {
                        eventsList.docs = allEvents;
                        eventsList.totalEvents = totalEvents;
                        eventsList.totalApprovedEvents = totalApprovedEvents;
                        eventsList.totalLiveEvents = totalLiveEvents;
                        return responseManager.onSuccess('Events list!', eventsList, res);
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