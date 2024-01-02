const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const livestreamModel = require('../../../models/festumevento/livestreams.model');
const mongoose = require('mongoose');
const async = require('async');
const { IvsClient, CreateChannelCommand, DeleteChannelCommand } = require("@aws-sdk/client-ivs");
exports.approvedisapprovelivestream = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "livestreams", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { livestreamid } = req.body;
                if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                    let livestreamData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                    if (livestreamData && livestreamData != null) {
                        if(livestreamData.status == true && livestreamData.is_approved == true){
                            if(livestreamData.awsivschannelconfig && livestreamData.awsivschannelconfig.channel && livestreamData.awsivschannelconfig.channel.arn && livestreamData.awsivschannelconfig.channel.arn != ''){
                                const ivsclient = new IvsClient({ 
                                    region: process.env.FE_AWS_REGION, 
                                    credentials: {
                                        accessKeyId: process.env.FE_AWS_IAM_ACCESS_KEY,
                                        secretAccessKey: process.env.FE_AWS_IAM_ACCESS_SECRET
                                    }
                                });
                                setTimeout(function(){
                                    ( async () => {
                                        const ivsinput = {
                                            arn: livestreamData.awsivschannelconfig.channel.arn
                                        };
                                        const ivscommand = new DeleteChannelCommand(ivsinput);
                                        const response = await ivsclient.send(ivscommand);
                                        if(response){
                                            await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { "$set" : { is_approved : false, status : false, is_live : false }, "$unset" : { awss3recordingconfig : "", awsivschannelconfig : ""}});
                                            let updatedData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                                            return responseManager.onSuccess('Organizer event live stream data dis-approved successfully !', updatedData, res);
                                        }
                                    })().catch((error) => {
                                        res.json({ "error": error });
                                        res.end();
                                    });
                                }, 5000);
                            }
                        }else{
                            const ivsclient = new IvsClient({ 
                                region: process.env.FE_AWS_REGION, 
                                credentials: {
                                    accessKeyId: process.env.FE_AWS_IAM_ACCESS_KEY,
                                    secretAccessKey: process.env.FE_AWS_IAM_ACCESS_SECRET
                                }
                            });
                            setTimeout(function(){
                                ( async () => {
                                    const ivsinput = {
                                        name: livestreamid.toString() +'_Channel',
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
                                    await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { is_approved : true, status : true, is_live : true, awss3recordingconfig : {}, awsivschannelconfig : response});
                                    let updatedData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
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