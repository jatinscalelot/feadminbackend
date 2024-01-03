const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const onlineofferModel = require('../../../models/festumevento/onlineoffers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const organisernotificationModel = require('../../../models/festumevento/organisernotifications.model');
const mongoose = require('mongoose');
const async = require('async');
exports.approvedisapproveonlineoffer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "onlineoffers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { onlineofferid } = req.body;
                if (onlineofferid && onlineofferid != '' && mongoose.Types.ObjectId.isValid(onlineofferid)) {
                    let onlineofferData = await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).findById(onlineofferid).lean();
                    if(onlineofferData){
                        let organiserData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(onlineofferData.createdBy).lean();
                        if(organiserData){
                            if(onlineofferData.status == true && onlineofferData.is_approved == true){
                                await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).findByIdAndUpdate(onlineofferid, {is_approved : false});
                                let updatedOnlineOffer = await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).findById(onlineofferid).lean();
                                let onlineofferdisapprovedsocketobj = {
                                    title: 'Online Offer Disapproved',
                                    message: 'Oops ! ' + organiserData.name + ' Your Online Offer ' + onlineofferData.shop_name + ' is Disapproved from Festum Evento Admin, Please correct your event data and try again...',
                                    banner: onlineofferData.poster,
                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                    entityid: mongoose.Types.ObjectId(onlineofferData._id),
                                    type: 'onlineoffer',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onOnlineOfferDisapproved(organiserData.channelID, onlineofferdisapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(onlineofferdisapprovedsocketobj);
                                }
                                let onlineofferdisapprovedfirebasepayload = {
                                    notification: {
                                        title: 'Online Offer Disapproved',
                                        body: 'Oops ! ' + organiserData.name + ' Your Online Offer ' + onlineofferData.shop_name + ' is Disapproved from Festum Evento Admin, Please correct your event data and try again...'
                                    },
                                    data: {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        banner: (onlineofferData.poster && onlineofferData.poster != '') ? onlineofferData.poster.toString() : '',
                                        organiserid: organiserData._id.toString(),
                                        entityid: onlineofferData._id.toString(),
                                        type: 'onlineoffer',
                                        timestamp: Date.now().toString()
                                    }
                                };
                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, onlineofferdisapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Online Offer updated successfully!', updatedOnlineOffer, res);
                            }else{
                                await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).findByIdAndUpdate(onlineofferid, {is_approved : true, status : true});
                                let updatedOnlineOffer = await festumeventoDB.model(constants.FE_MODELS.onlineoffers, onlineofferModel).findById(onlineofferid).lean();
                                let onlineofferapprovedsocketobj = {
                                    title: 'Online Offer Approved',
                                    message: 'Congratulations ! ' + organiserData.name + ' Your Online Offer ' + onlineofferData.shop_name + ' is Approved from Festum Evento Admin...',
                                    banner: onlineofferData.poster,
                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                    entityid: mongoose.Types.ObjectId(onlineofferData._id),
                                    type: 'onlineoffer',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onOnlineOfferApproved(organiserData.channelID, onlineofferapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(onlineofferapprovedsocketobj);
                                }
                                let onlineofferapprovedfirebasepayload = {
                                    notification: {
                                        title: 'Online Offer Approved',
                                        body: 'Congratulations ! ' + organiserData.name + ' Your Online Offer ' + onlineofferData.shop_name + ' is Approved from Festum Evento Admin...'
                                    },
                                    data: {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        banner: (onlineofferData.poster && onlineofferData.poster != '') ? onlineofferData.poster.toString() : '',
                                        organiserid: organiserData._id.toString(),
                                        entityid: onlineofferData._id.toString(),
                                        type: 'onlineoffer',
                                        timestamp: Date.now().toString()
                                    }
                                };
                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, onlineofferapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Online Offer updated successfully!', updatedOnlineOffer, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid offer id to update offer data, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid offer id to update offer data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid offer id to Approve or Dis-Approve online offer data, please try again' }, res);
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