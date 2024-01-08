const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const offlineofferModel = require('../../../models/festumevento/offlineoffers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const organisernotificationModel = require('../../../models/festumevento/organisernotifications.model');
const mongoose = require('mongoose');
const async = require('async');
exports.approvedisapproveofflineoffer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "offers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { offlineofferid } = req.body;
                if (offlineofferid && offlineofferid != '' && mongoose.Types.ObjectId.isValid(offlineofferid)) {
                    let offlineofferData = await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                    if(offlineofferData){
                        let organiserData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(offlineofferData.createdBy).lean();
                        if(organiserData){
                            if(offlineofferData.status == true && offlineofferData.is_approved == true){
                                await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findByIdAndUpdate(offlineofferid, {is_approved : false});
                                let updatedofflineoffer = await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                                let offlineofferdisapprovedsocketobj = {
                                    title: 'Offline Offer Disapproved',
                                    message: 'Oops ! ' + organiserData.name + ' Your Offline Offer ' + offlineofferData.offer_title + ' is Disapproved from Festum Evento Admin, Please correct your offer data and try again...',
                                    banner: offlineofferData.poster,
                                    organiserid: new mongoose.Types.ObjectId(organiserData._id),
                                    entityid: new mongoose.Types.ObjectId(offlineofferData._id),
                                    type: 'offlineoffer',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onOfflineOfferDisapproved(organiserData.channelID, offlineofferdisapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(offlineofferdisapprovedsocketobj);
                                }
                                let offlineofferdisapprovedfirebasepayload = {
                                    notification: {
                                        title: 'Offline Offer Disapproved',
                                        body: 'Oops ! ' + organiserData.name + ' Your Offline Offer ' + offlineofferData.offer_title + ' is Disapproved from Festum Evento Admin, Please correct your offer data and try again...'
                                    },
                                    data: {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        banner: (offlineofferData.poster && offlineofferData.poster != '') ? offlineofferData.poster.toString() : '',
                                        organiserid: organiserData._id.toString(),
                                        entityid: offlineofferData._id.toString(),
                                        type: 'offlineoffer',
                                        timestamp: Date.now().toString()
                                    }
                                };
                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, offlineofferdisapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Offline Offer updated successfully!', updatedofflineoffer, res);
                            }else{
                                await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findByIdAndUpdate(offlineofferid, {is_approved : true, status : true});
                                let updatedofflineoffer = await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                                let offlineofferapprovedsocketobj = {
                                    title: 'Offline Offer Approved',
                                    message: 'Congratulations ! ' + organiserData.name + ' Your Offline Offer ' + offlineofferData.offer_title + ' is Approved successfully...',
                                    banner: offlineofferData.poster,
                                    organiserid: new mongoose.Types.ObjectId(organiserData._id),
                                    entityid: new mongoose.Types.ObjectId(offlineofferData._id),
                                    type: 'offlineoffer',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onOfflineOfferApproved(organiserData.channelID, offlineofferapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(offlineofferapprovedsocketobj);
                                }
                                let offlineofferapprovedfirebasepayload = {
                                    notification: {
                                        title: 'Offline Offer Approved',
                                        body: 'Congratulations ! ' + organiserData.name + ' Your Offline Offer ' + offlineofferData.offer_title + ' is Approved successfully...'
                                    },
                                    data: {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        banner: (offlineofferData.poster && offlineofferData.poster != '') ? offlineofferData.poster.toString() : '',
                                        organiserid: organiserData._id.toString(),
                                        entityid: offlineofferData._id.toString(),
                                        type: 'offlineoffer',
                                        timestamp: Date.now().toString()
                                    }
                                };
                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, offlineofferapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Offline Offer updated successfully!', updatedofflineoffer, res);
                            }
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid offline offer id to update offer data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid offline offer id to update offer data, please try again' }, res);
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