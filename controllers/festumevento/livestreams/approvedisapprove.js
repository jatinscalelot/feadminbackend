const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const socketBox = require('../../../utilities/sockets');
const firebaseHelper = require('../../../utilities/firebase_helper');
const adminModel = require('../../../models/superadmin/admins.model');
const livestreamModel = require('../../../models/festumevento/livestreams.model');
const organizerModel = require('../../../models/festumevento/organizers.model');
const organisernotificationModel = require('../../../models/festumevento/organisernotifications.model');
const mongoose = require('mongoose');
const async = require('async');
const { IvsClient, CreateChannelCommand, DeleteChannelCommand } = require("@aws-sdk/client-ivs");
exports.approvedisapprovelivestream = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "livestreams", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { livestreamid } = req.body;
                if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                    let livestreamData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                    if (livestreamData && livestreamData != null) {
                        let organiserData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(livestreamData.createdBy).lean();
                        if (organiserData && organiserData != null) {
                            if (livestreamData.status == true && livestreamData.is_approved == true) {
                                if (livestreamData.awsivschannelconfig && livestreamData.awsivschannelconfig.channel && livestreamData.awsivschannelconfig.channel.arn && livestreamData.awsivschannelconfig.channel.arn != '') {
                                    const ivsclient = new IvsClient({
                                        region: process.env.FE_AWS_REGION,
                                        credentials: {
                                            accessKeyId: process.env.FE_AWS_IAM_ACCESS_KEY,
                                            secretAccessKey: process.env.FE_AWS_IAM_ACCESS_SECRET
                                        }
                                    });
                                    setTimeout(function () {
                                        (async () => {
                                            const ivsinput = {
                                                arn: livestreamData.awsivschannelconfig.channel.arn
                                            };
                                            const ivscommand = new DeleteChannelCommand(ivsinput);
                                            const response = await ivsclient.send(ivscommand);
                                            if (response) {
                                                await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { "$set": { is_approved: false, status: false, is_live: false }, "$unset": { awss3recordingconfig: "", awsivschannelconfig: "" } });
                                                let updatedData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                                                let livestreamdisapprovedsocketobj = {
                                                    title: 'Livestream Disapproved',
                                                    message: 'Oops ! ' + organiserData.name + ' Your Livestream ' + updatedData.event_name + ' is Disapproved from Festum Evento Admin, Please correct your shop data and try again...',
                                                    banner: updatedData.banner,
                                                    organiserid: mongoose.Types.ObjectId(organiserData._id),
                                                    entityid: mongoose.Types.ObjectId(updatedData._id),
                                                    type: 'livestream',
                                                    timestamp: Date.now()
                                                };
                                                if (organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null) {
                                                    socketBox.onLivestreamDisapproved(organiserData.channelID, livestreamdisapprovedsocketobj);
                                                    await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(livestreamdisapprovedsocketobj);
                                                }
                                                let livestreamdisapprovedfirebasepayload = {
                                                    notification: {
                                                        title: 'Livestream Disapproved',
                                                        body: 'Oops ! ' + organiserData.name + ' Your Livestream ' + updatedData.event_name + ' is Disapproved from Festum Evento Admin, Please correct your shop data and try again...'
                                                    },
                                                    data: {
                                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                                        banner: (updatedData.banner && updatedData.banner != '') ? updatedData.banner.toString() : '',
                                                        organiserid: organiserData._id.toString(),
                                                        entityid: updatedData._id.toString(),
                                                        type: 'livestream',
                                                        timestamp: Date.now().toString()
                                                    }
                                                };
                                                if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                                    firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, livestreamdisapprovedfirebasepayload);
                                                }
                                                return responseManager.onSuccess('Organizer event live stream data dis-approved successfully !', updatedData, res);
                                            }
                                        })().catch((error) => {
                                            res.json({ "error": error });
                                            res.end();
                                        });
                                    }, 5000);
                                } else {
                                    await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { "$set": { is_approved: false, status: false, is_live: false }, "$unset": { awss3recordingconfig: "", awsivschannelconfig: "" } });
                                    let updatedData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                                    let livestreamdisapprovedsocketobj = {
                                        title: 'Livestream Disapproved',
                                        message: 'Oops ! ' + organiserData.name + ' Your Livestream ' + updatedData.event_name + ' is Disapproved from Festum Evento Admin, Please correct your shop data and try again...',
                                        banner: updatedData.banner,
                                        organiserid: mongoose.Types.ObjectId(organiserData._id),
                                        entityid: mongoose.Types.ObjectId(updatedData._id),
                                        type: 'livestream',
                                        timestamp: Date.now()
                                    };
                                    if (organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null) {
                                        socketBox.onLivestreamDisapproved(organiserData.channelID, livestreamdisapprovedsocketobj);
                                        await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(livestreamdisapprovedsocketobj);
                                    }
                                    let livestreamdisapprovedfirebasepayload = {
                                        notification: {
                                            title: 'Livestream Disapproved',
                                            body: 'Oops ! ' + organiserData.name + ' Your Livestream ' + updatedData.event_name + ' is Disapproved from Festum Evento Admin, Please correct your shop data and try again...'
                                        },
                                        data: {
                                            click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                            banner: (updatedData.banner && updatedData.banner != '') ? updatedData.banner.toString() : '',
                                            organiserid: organiserData._id.toString(),
                                            entityid: updatedData._id.toString(),
                                            type: 'livestream',
                                            timestamp: Date.now().toString()
                                        }
                                    };
                                    if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                        firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, livestreamdisapprovedfirebasepayload);
                                    }
                                    return responseManager.onSuccess('Organizer event live stream data dis-approved successfully !', updatedData, res);
                                }
                            } else {
                                const ivsclient = new IvsClient({
                                    region: process.env.FE_AWS_REGION,
                                    credentials: {
                                        accessKeyId: process.env.FE_AWS_IAM_ACCESS_KEY,
                                        secretAccessKey: process.env.FE_AWS_IAM_ACCESS_SECRET
                                    }
                                });
                                setTimeout(function () {
                                    (async () => {
                                        const ivsinput = {
                                            name: livestreamid.toString() + '_Channel',
                                            latencyMode: "NORMAL",
                                            type: "STANDARD",
                                            authorized: false,
                                            tags: {
                                                "streamid": livestreamData._id.toString()
                                            },
                                            insecureIngest: false,
                                            preset: ""
                                        };
                                        const ivscommand = new CreateChannelCommand(ivsinput);
                                        const response = await ivsclient.send(ivscommand);
                                        await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { is_approved: true, status: true, is_live: true, awss3recordingconfig: {}, awsivschannelconfig: response });
                                        let updatedData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                                        let livestreamapprovedsocketobj = {
                                            title: 'Livestream Approved',
                                            message: 'Congratulations ! ' + organiserData.name + ' Your Livestream ' + updatedData.event_name + ' is Approved from Festum Evento Admin...',
                                            banner: updatedData.banner,
                                            organiserid: mongoose.Types.ObjectId(organiserData._id),
                                            entityid: mongoose.Types.ObjectId(updatedData._id),
                                            type: 'livestream',
                                            timestamp: Date.now()
                                        };
                                        if (organiserData.channelID && organiserData.channelID != '' && organiserData.channelID != null) {
                                            socketBox.onLivestreamApproved(organiserData.channelID, livestreamapprovedsocketobj);
                                            await festumeventoDB.model(constants.FE_MODELS.organisernotifications, organisernotificationModel).create(livestreamapprovedsocketobj);
                                        }
                                        let livestreamapprovedfirebasepayload = {
                                            notification: {
                                                title: 'Livestream Approved',
                                                body: 'Congratulations ! ' + organiserData.name + ' Your Livestream ' + updatedData.event_name + ' is Approved from Festum Evento Admin..'
                                            },
                                            data: {
                                                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                                banner: (updatedData.banner && updatedData.banner != '') ? updatedData.banner.toString() : '',
                                                organiserid: organiserData._id.toString(),
                                                entityid: updatedData._id.toString(),
                                                type: 'livestream',
                                                timestamp: Date.now().toString()
                                            }
                                        };
                                        if (organiserData.fcm_token && organiserData.fcm_token != null && organiserData.fcm_token != '') {
                                            firebaseHelper.sendNotificationFEOrganizer(organiserData.fcm_token, livestreamapprovedfirebasepayload);
                                        }
                                        return responseManager.onSuccess('Organizer event live stream data approved successfully !', updatedData, res);
                                    })().catch((error) => {
                                        res.json({ "error": error });
                                        res.end();
                                    });
                                }, 5000);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid event live stream id to approve dis-approve live stream data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event live stream id to approve dis-approve live stream data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event live stream id to approve dis-approve live stream data, please try again' }, res);
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