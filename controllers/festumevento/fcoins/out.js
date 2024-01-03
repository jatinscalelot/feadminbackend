const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const fcointransactionModel = require('../../../models/festumevento/fcointransactions.model');
const organizerModel = require('../../../models/festumevento/organizers.model');
const userModel = require('../../../models/festumevento/users.model');
const mongoose = require('mongoose');
const async = require('async');
exports.fcoinouttransactions = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "fcointransactions", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { page, limit, search } = req.body;
                let totalfcointransactions = parseInt(await festumeventoDB.model(constants.FE_MODELS.fcointransactions, fcointransactionModel).countDocuments({}));
                festumeventoDB.model(constants.FE_MODELS.fcointransactions, fcointransactionModel).paginate({
                    $or: [
                        { transaction_type : { '$regex' : new RegExp(search, "i") } }
                    ]
                },{
                    page,
                    limit: parseInt(limit),
                    sort: { "timestamp" : -1 },
                    lean: true
                }).then((outtransactions) => {
                    if(outtransactions && outtransactions.docs && outtransactions.docs.length > 0){
                        let finalData = [];
                        async.forEachSeries(outtransactions.docs, (redeem, next_redeem) => {
                            ( async () => {
                                if(redeem.receiver_id != null){
                                    let receiverorganiser = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(redeem.receiver_id).select('name email mobile profile_pic').lean();
                                    if(receiverorganiser){
                                        redeem.receiver_id = receiverorganiser;
                                    }else{
                                        let receiveruser = await festumeventoDB.model(constants.FE_MODELS.users, userModel).findById(redeem.receiver_id).select('name email mobile profilepic').lean();
                                        if(receiveruser){
                                            receiveruser.profile_pic = receiveruser.profilepic;
                                            delete receiveruser.profilepic;
                                            redeem.receiver_id = receiveruser;
                                        }
                                    }
                                }
                                if(redeem.sender_id != null){
                                    let senderorganiser = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(redeem.sender_id).select('name email mobile profile_pic').lean();
                                    if(senderorganiser){
                                        redeem.sender_id = senderorganiser;
                                    }else{
                                        let senderuser = await festumeventoDB.model(constants.FE_MODELS.users, userModel).findById(redeem.sender_id).select('name email mobile profilepic').lean();
                                        if(senderuser){
                                            senderuser.profile_pic = senderuser.profilepic;
                                            delete senderuser.profilepic;
                                            redeem.sender_id = senderuser;
                                        }
                                    }
                                }
                                if(redeem.transaction_type == 'refer'){
                                    if(redeem.refer_data && Object.keys(redeem.refer_data).length > 0){
                                        if(redeem.refer_data.to_refer != null){
                                            let receiverorganiser = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(redeem.refer_data.to_refer).select('name email mobile profile_pic').lean();
                                            if(receiverorganiser){
                                                redeem.refer_data.to_refer = receiverorganiser;
                                            }else{
                                                let receiveruser = await festumeventoDB.model(constants.FE_MODELS.users, userModel).findById(redeem.refer_data.to_refer).select('name email mobile profilepic').lean();
                                                if(receiveruser){
                                                    receiveruser.profile_pic = receiveruser.profilepic;
                                                    delete receiveruser.profilepic;
                                                    redeem.refer_data.to_refer = receiveruser;
                                                }
                                            }
                                        }
                                        if(redeem.refer_data.from_refer != null){
                                            let senderorganiser = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(redeem.refer_data.from_refer).select('name email mobile profile_pic').lean();
                                            if(senderorganiser){
                                                redeem.refer_data.from_refer = senderorganiser;
                                            }else{
                                                let senderuser = await festumeventoDB.model(constants.FE_MODELS.users, userModel).findById(redeem.refer_data.from_refer).select('name email mobile profilepic').lean();
                                                if(senderuser){
                                                    senderuser.profile_pic = senderuser.profilepic;
                                                    delete senderuser.profilepic;
                                                    redeem.refer_data.from_refer = senderuser;
                                                }
                                            }
                                        }
                                    }
                                }
                                finalData.push(redeem);
                                next_redeem();
                            })().catch((error) => {return responseManager.onError(error, res);});
                        }, () => {
                            outtransactions.docs = finalData;
                            outtransactions.totalfcointransactions = totalfcointransactions;
                            return responseManager.onSuccess('F-Coins Out Transactions list!', outtransactions, res);
                        });
                    }else{
                        outtransactions.totalfcointransactions = totalfcointransactions;
                        return responseManager.onSuccess('F-Coins Out Transactions list!', outtransactions, res);
                    }
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