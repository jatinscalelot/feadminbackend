const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const eventModel = require('../../../models/festumevento/events.model');
const eventbookingModel = require('../../../models/festumevento/eventbookings.model');
const userModel = require('../../../models/festumevento/users.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require('mongoose');
const async = require('async');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "eventbookings", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { eventid, page, limit } = req.body;
                if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                    let eventData = await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findById(eventid).lean();
                    if(eventData && eventData.is_approved == true && eventData.status == true && eventData.iseditable == false){
                        let totalAttendance = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventbookings, eventbookingModel).countDocuments({event_id: new mongoose.Types.ObjectId(eventid), isQRscanned: true}));
                        festumeventoDB.model(constants.FE_MODELS.eventbookings, eventbookingModel).paginate({
                            event_id: new mongoose.Types.ObjectId(eventid),
                            isQRscanned: true
                        }, {
                            page,
                            limit: parseInt(limit),
                            sort: { _id: -1 },
                            populate: { path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name email mobile profilepic" },
                            lean: true
                        }).then((attendeelist) => {
                            let finalData = [];
                            async.forEachSeries(attendeelist.docs, (attendee, next_attendee) => {
                                let booked_tickets = 0;
                                async.forEachSeries(attendee.seats, (seat, next_seat) => {
                                    async.forEachSeries(seat.arrangements, (arrangement, next_arrangement) => {
                                        booked_tickets += parseInt(arrangement.ItemCount);
                                        next_arrangement();
                                    }, () => {
                                        next_seat();
                                    });
                                }, () => {
                                    attendee.booked_tickets = booked_tickets;
                                    finalData.push(attendee);
                                    next_attendee();
                                });
                            }, () => {
                                attendeelist.docs = finalData;
                                attendeelist.totalAttendance = totalAttendance;
                                return responseManager.onSuccess("event booked list...", attendeelist, res);
                            });
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Invalid event id to get attendees data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to get attendees data, please try again' }, res);
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