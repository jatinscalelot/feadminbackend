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
const userModel = require('../../../models/festumevento/users.model');
const eventbookingModel = require('../../../models/festumevento/eventbookings.model');
const mongoose = require('mongoose');
const async = require('async');
exports.getoneevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "events", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { eventid } = req.body;
                if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                    let eventData = await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findById(eventid).populate([
                        { path: 'createdBy', model: festumeventoDB.model(constants.FE_MODELS.organizers, organiserModel), select: 'name email mobile country_code profile_pic' },
                        { path: 'event_category', model: festumeventoDB.model(constants.FE_MODELS.eventcategories, categoryModel), select: "categoryname description event_type" },
                        { path: "discounts.items", model: festumeventoDB.model(constants.FE_MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                        { path: "seating_arrangements.seating_item", model: festumeventoDB.model(constants.FE_MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' }
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
                                let noofreview = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: new mongoose.Types.ObjectId(eventData._id) }));
                                if (noofreview > 0) {
                                    let totalReviewsCountObj = await festumeventoDB.model(constants.FE_MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: new mongoose.Types.ObjectId(eventData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                    if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                        eventData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / parseInt(noofreview)).toFixed(1);
                                        eventData.totalreview = parseInt(noofreview);
                                    }
                                } else {
                                    eventData.ratings = '0.0';
                                    eventData.totalreview = parseInt(0);
                                }
                                let allreview = await festumeventoDB.model(constants.FE_MODELS.eventreviews, eventreviewModel).find({ eventid: new mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name mobile profilepic createdAt timestamp" }).lean();
                                eventData.reviews = allreview;
                                let allbooked = await festumeventoDB.model(constants.FE_MODELS.eventbookings, eventbookingModel).find({ event_id: new mongoose.Types.ObjectId(eventid) }).select('amount').lean();
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
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
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