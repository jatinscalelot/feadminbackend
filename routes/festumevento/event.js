let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const organiserModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const categoryModel = require('../../models/eventcategories.model');
const itemModel = require('../../models/items.model');
const organisernotificationModel = require('../../models/organisernotifications.model');
const socketBox = require('../../utilities/sockets');
const firebaseHelper = require('../../utilities/firebase_helper');
const eventreviewModel = require('../../models/eventreviews.model');
const userModel = require('../../models/users.model');
const eventbookingModel = require('../../models/eventbookings.model');
const { default: mongoose } = require("mongoose");
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid, event_category, page, limit, search, sortfield, sortoption, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            let totalEvents = parseInt(await primary.model(constants.MODELS.events, eventModel).countDocuments({}));
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
            primary.model(constants.MODELS.events, eventModel).paginate({
                $or: [
                    { name: { '$regex': new RegExp(search, "i") } },
                    { event_type: { '$regex': new RegExp(search, "i") } },
                    { other: { '$regex': new RegExp(search, "i") } }
                ],
                ...query
            }, {
                page,
                limit: parseInt(limit),
                sort: { [sortfield]: [sortoption] },
                populate: [
                    { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organiserModel), select: '-password -refer_code -createdBy -updatedBy -agentid -otpVerifyKey -createdAt -updatedAt -__v -last_login_at -f_coins -isdepositereceived -deposite' },
                    { path: 'event_category', model: primary.model(constants.MODELS.eventcategories, categoryModel), select: "categoryname description event_type" },
                    { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "seating_arrangements.seating_item", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' }
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
                                let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: mongoose.Types.ObjectId(event._id) }));
                                if (noofreview > 0) {
                                    let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: mongoose.Types.ObjectId(event._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
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
                    return responseManager.onSuccess('Events list!', eventsList, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get events list, please try again' }, res);
    }
});
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (eventData) {
                    let organiserData = await primary.model(constants.MODELS.organizers, organiserModel).findById(eventData.createdBy).lean();
                    if (organiserData) {
                        if (eventData.is_approved == false) {
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { is_approved: true, status: true });
                            let updatedData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                            let obj = {
                                title: 'Event Approved',
                                message: 'Congratulations ! ' + organiserData.name + ' Your event ' + eventData.name + ' is Approved successfully...',
                                banner: eventData.banner,
                                organiserid: mongoose.Types.ObjectId(organiserData._id),
                                entityid: mongoose.Types.ObjectId(eventData._id),
                                type: 'event',
                                timestamp: Date.now()
                            };
                            socketBox.onEventApproved(organiserData.channelID, obj);
                            await primary.model(constants.MODELS.organisernotifications, organisernotificationModel).create(obj);
                            let firebasepayload = {
                                notification: {
                                    title: 'Event Approved',
                                    body: 'Congratulations ! ' + organiserData.name + ' Your event ' + eventData.name + ' is Approved successfully...'
                                },
                                data: {
                                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                    banner: (eventData.banner && eventData.banner != '') ? eventData.banner.toString() : '',
                                    organiserid: organiserData._id.toString(),
                                    entityid: eventData._id.toString(),
                                    type: 'event',
                                    timestamp: Date.now().toString()
                                }
                            };
                            if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                firebaseHelper.sendNotificationOrganizer(organiserData.fcm_token, firebasepayload);
                            }
                            return responseManager.onSuccess('Event approved sucecssfully!', updatedData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Event is already approved' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Event data not found to approve event, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Event data not found to approve event, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to approve event, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (eventData) {
                    let organiserData = await primary.model(constants.MODELS.organizers, organiserModel).findById(eventData.createdBy).lean();
                    if (organiserData) {
                        if (eventData.is_approved == true) {
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { is_approved: false });
                            let updatedData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                            let obj = {
                                title: 'Event Disapproved',
                                message: 'Oops ! ' + organiserData.name + ' Your event ' + eventData.name + ' is Disapproved from Festum Evento Admin, Please correct your event data and try again...',
                                banner: eventData.banner,
                                organiserid: mongoose.Types.ObjectId(organiserData._id),
                                entityid: mongoose.Types.ObjectId(eventData._id),
                                type: 'event',
                                timestamp: Date.now()
                            };
                            socketBox.onEventDisapproved(organiserData.channelID, obj);
                            await primary.model(constants.MODELS.organisernotifications, organisernotificationModel).create(obj);
                            let firebasepayload = {
                                notification: {
                                    title: 'Event Disapproved',
                                    body: 'Oops ! ' + organiserData.name + ' Your event ' + eventData.name + ' is Disapproved from Festum Evento Admin, Please correct your event data and try again...'
                                },
                                data: {
                                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                    banner: (eventData.banner && eventData.banner != '') ? eventData.banner.toString() : '',
                                    organiserid: organiserData._id.toString(),
                                    entityid: eventData._id.toString(),
                                    type: 'event',
                                    timestamp: Date.now().toString()
                                }
                            };
                            if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                firebaseHelper.sendNotificationOrganizer(organiserData.fcm_token, firebasepayload);
                            }
                            return responseManager.onSuccess('Event disapproved sucecssfully!', updatedData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Event is already disapproved' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Event data not found to disapprove, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Event data not found to disapprove, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to disapprove event, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organiserModel), select: 'name email mobile country_code profile_pic' },
                    { path: 'event_category', model: primary.model(constants.MODELS.eventcategories, categoryModel), select: "categoryname description event_type" },
                    { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "seating_arrangements.seating_item", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' }
                ]).lean();
                if (eventData && eventData != null) {
                    eventData.startingat = 0.00;
                    let noofunsold = 0;
                    let noofsold = 0;
                    let totalseat = 0;
                    async.forEachSeries(eventData.seating_arrangements, (seating_arrangement, next_seating_arrangement) => {
                        async.forEachSeries(seating_arrangement.arrangements, (arrangement, next_arrangement) => {
                            if (eventData.startingat != 0.00) {
                                if (eventData.startingat > arrangement.per_person_price) {
                                    eventData.startingat = arrangement.per_person_price;
                                }
                            } else {
                                eventData.startingat = arrangement.per_person_price;
                            }
                            if (seating_arrangement.seating_item.item_start_at != 0) {
                                if (seating_arrangement.seating_item.item_start_at > arrangement.per_person_price) {
                                    seating_arrangement.seating_item.item_start_at = arrangement.per_person_price;
                                }
                            } else {
                                seating_arrangement.seating_item.item_start_at = arrangement.per_person_price;
                            }
                            noofunsold += parseInt(arrangement.total_available_seats);
                            noofsold += parseInt(arrangement.total_booked);
                            totalseat += parseInt(arrangement.total_seats);
                            next_arrangement();
                        }, () => {
                            next_seating_arrangement();
                        });
                    }, () => {
                        (async () => {
                            eventData.total_available_seats = noofunsold;
                            eventData.total_booked_seats = noofsold;
                            eventData.total_seats = totalseat;
                            let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: mongoose.Types.ObjectId(eventData._id) }));
                            if (noofreview > 0) {
                                let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: mongoose.Types.ObjectId(eventData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                    eventData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / parseInt(noofreview)).toFixed(1);
                                    eventData.totalreview = parseInt(noofreview);
                                }
                            } else {
                                eventData.ratings = '0.0';
                                eventData.totalreview = parseInt(0);
                            }
                            let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({ eventid: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name mobile profilepic createdAt timestamp" }).lean();
                            eventData.reviews = allreview;
                            let allbooked = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_id: mongoose.Types.ObjectId(eventid) }).select('amount').lean();
                            if (allbooked && allbooked.length > 0) {
                                let booked_amount = parseFloat(0.00);
                                async.forEachSeries(allbooked, (book, next_book) => {
                                    booked_amount = parseFloat(booked_amount + parseFloat(book.amount));
                                    next_book();
                                }, () => {
                                    eventData.total_booked_amount = parseFloat(parseFloat(booked_amount).toFixed(2));
                                    return responseManager.onSuccess('Organizer event data!', eventData, res);
                                });
                            } else {
                                eventData.total_booked_amount = parseFloat(0.00);
                                return responseManager.onSuccess('Organizer event data!', eventData, res);
                            }
                        })().catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    });
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
module.exports = router;