const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const socketBox = require('../../../utilities/sockets');
const firebaseHelper = require('../../../utilities/firebase_helper');
const shopModel = require('../../../models/festumevento/shops.model');
const organizerModel = require('../../../models/festumevento/organizers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const organisernotificationModel = require('../../../models/festumevento/organisernotifications.model');
const mongoose = require('mongoose');
const async = require('async');
exports.approvedisapproveofflineshop = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "shops", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { offlineshopid } = req.body;
                if (offlineshopid && offlineshopid != '' && mongoose.Types.ObjectId.isValid(offlineshopid)) {
                    let shopData = await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).findById(offlineshopid).lean();
                    if(shopData){
                        let organiserData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(shopData.createdBy).lean();
                        if(organiserData){
                            if(shopData.status == true && shopData.is_approved == true){
                                await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).findByIdAndUpdate(offlineshopid, {is_approved : false});
                                let updatedOfflineShopData = await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).findById(offlineshopid).lean();
                                let offlineshopdisapprovedsocketobj = {
                                    title: 'Offline Shop Disapproved',
                                    message: 'Oops ! ' + organiserData.name + ' Your Shop ' + updatedOfflineShopData.shop_name + ' is Disapproved from Festum Evento Admin, Please correct your shop data and try again...',
                                    banner: updatedOfflineShopData.banner,
                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                    entityid: mongoose.Types.ObjectId(updatedOfflineShopData._id),
                                    type: 'shop',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onShopDisapproved(organiserData.channelID, offlineshopdisapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(offlineshopdisapprovedsocketobj);
                                }
                                let offlineshopdisapprovedfirebasepayload = {
                                    notification: {
                                        title: 'Offline Shop Disapproved',
                                        body: 'Oops ! ' + organiserData.name + ' Your Shop ' + updatedOfflineShopData.shop_name + ' is Disapproved from Festum Evento Admin, Please correct your shop data and try again...'
                                    },
                                    data: {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        banner: (updatedOfflineShopData.banner && updatedOfflineShopData.banner != '') ? updatedOfflineShopData.banner.toString() : '',
                                        organiserid: organiserData._id.toString(),
                                        entityid: updatedOfflineShopData._id.toString(),
                                        type: 'shop',
                                        timestamp: Date.now().toString()
                                    }
                                };
                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, offlineshopdisapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Offline Shop updated successfully!', updatedOfflineShopData, res);
                            }else{
                                await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).findByIdAndUpdate(offlineshopid, {is_approved : true, status : true});
                                let updatedOfflineShopData = await festumeventoDB.model(constants.FE_MODELS.shops, shopModel).findById(offlineshopid).lean();
                                let offlineshopapprovedsocketobj = {
                                    title: 'Offline Shop Approved',
                                    message: 'Congratulations ! ' + organiserData.name + ' Your Shop ' + updatedOfflineShopData.shop_name + ' is Approved successfully...',
                                    banner: updatedOfflineShopData.banner,
                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                    entityid: mongoose.Types.ObjectId(updatedOfflineShopData._id),
                                    type: 'shop',
                                    timestamp: Date.now()
                                };
                                if(organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null){
                                    socketBox.onShopApproved(organiserData.channelID, offlineshopapprovedsocketobj);
                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(offlineshopapprovedsocketobj);
                                }
                                let offlineshopapprovedfirebasepayload = {
                                    notification: {
                                        title: 'Offline Shop Approved',
                                        body: 'Congratulations ! ' + organiserData.name + ' Your Shop ' + updatedOfflineShopData.shop_name + ' is Approved successfully...'
                                    },
                                    data: {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        banner: (updatedOfflineShopData.banner && updatedOfflineShopData.banner != '') ? updatedOfflineShopData.banner.toString() : '',
                                        organiserid: organiserData._id.toString(),
                                        entityid: updatedOfflineShopData._id.toString(),
                                        type: 'shop',
                                        timestamp: Date.now().toString()
                                    }
                                };
                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, offlineshopapprovedfirebasepayload);
                                }
                                return responseManager.onSuccess('Offline Shop updated successfully!', updatedOfflineShopData, res);
                            }
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid shop id to update shop data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid offline shop id to approve or dis-approve Shop data, please try again' }, res);
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