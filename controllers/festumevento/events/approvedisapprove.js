const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const socketBox = require('../../../utilities/sockets');
const firebaseHelper = require('../../../utilities/firebase_helper');
const adminModel = require('../../../models/superadmin/admins.model');
const organiserModel = require('../../../models/festumevento/organizers.model');
const eventModel = require('../../../models/festumevento/events.model');
const organisernotificationModel = require('../../../models/festumevento/organisernotifications.model');
const mongoose = require('mongoose');
const async = require('async');
exports.approvdisapproveevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "events", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { eventid } = req.body;
                if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                    let eventData = await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findById(eventid).lean();
                    if(eventData){
                        let organiserData = await festumeventoDB.model(constants.FE_MODELS.organizers, organiserModel).findById(eventData.createdBy).lean();
                        if(organiserData){
                            if(eventData.status == true && eventData.is_approved == true){
                                await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_approved : false});
                                let updatedEvent = await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findById(eventid).lean();
                                let eventdisapprovedsocketobj = {
                                    title: 'Event Disapproved',
                                    message: 'Oops ! ' + organiserData.name + ' Your event ' + eventData.name + ' is Disapproved from Festum Evento Admin, Please correct your event data and try again...',
                                    banner: eventData.banner,
                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                    entityid: mongoose.Types.ObjectId(eventData._id),
                                    type: 'event',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onEventDisapproved(organiserData.channelID, eventdisapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(eventdisapprovedsocketobj);
                                }
                                let eventdisapprovedfirebasepayload = {
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
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, eventdisapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Event updated successfully!', updatedEvent, res);
                            }else{
                                await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_approved : true, status : true});
                                let updatedEvent = await festumeventoDB.model(constants.FE_MODELS.events, eventModel).findById(eventid).lean();
                                let eventapprovedsocketobj = {
                                    title: 'Event Approved',
                                    message: 'Congratulations ! ' + organiserData.name + ' Your event ' + eventData.name + ' is Approved successfully...',
                                    banner: eventData.banner,
                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                    entityid: mongoose.Types.ObjectId(eventData._id),
                                    type: 'event',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onEventApproved(organiserData.channelID, eventapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(eventapprovedsocketobj);
                                }
                                let eventapprovedfirebasepayload = {
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
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, eventapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Event updated successfully!', updatedEvent, res);
                            }
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid event id to update event data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to update event data, please try again' }, res);
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