const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const fcointransactionModel = require('../../../models/festumevento/fcointransactions.model');
const fcoinModel = require('../../../models/festumevento/fcoins.model');
const mongoose = require("mongoose");
exports.freezfcoinsfororganizer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, freezfcoins, total_max_user, fcoins_transfer_to_user } = req.body;
                let defaultSetting = await festumeventoDB.model(constants.FE_MODELS.fcoins, fcoinModel).find({}).lean();
                if (defaultSetting && defaultSetting.length > 0) {
                    let currentCoins = defaultSetting[0];
                    if(freezfcoins && !isNaN(freezfcoins) && parseInt(freezfcoins) > 0 && parseInt(currentCoins.fcoins) >= parseInt(freezfcoins)){
                        if(total_max_user && !isNaN(total_max_user) && parseInt(total_max_user) > 0){
                            if(fcoins_transfer_to_user && !isNaN(fcoins_transfer_to_user) && parseInt(fcoins_transfer_to_user) > 0){
                                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                                    let organizerData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).lean();
                                    if (organizerData && organizerData != null && organizerData.mobileverified == true) {
                                        if(organizerData.status == true && organizerData.is_approved == true){
                                            if(organizerData.freezedfcoins){
                                                return responseManager.badrequest({ message: 'Organizer already have freezed coins you can not update or create freezed coins for this organizer.' }, res);
                                            }else{
                                                let obj = {
                                                    freezfcoins : parseInt(freezfcoins),
                                                    cointoinr : parseFloat(parseInt(freezfcoins) / parseInt(process.env.ONE_RUPEE_FCOIN)),
                                                    total_max_user : parseInt(total_max_user),
                                                    fcoins_transfer_to_user : parseInt(fcoins_transfer_to_user),
                                                    total_user_scanned : parseInt(0),
                                                    total_user_scanned_remaining : parseInt(total_max_user)
                                                };
                                                await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, { freezedfcoins : obj, updatedBy : new mongoose.Types.ObjectId(admindata._id) });
                                                let updatedData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).populate([{path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'}, { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                                                let fcointransactionobj = {
                                                    receiver_id : new mongoose.Types.ObjectId(organizerData._id),
                                                    sender_id : null,
                                                    admin_name : admindata.name,
                                                    admin_id : new mongoose.Types.ObjectId(admindata._id),
                                                    transaction_type : 'freezed',
                                                    transaction_icon : 'global/tricons/transaction.png',
                                                    f_coins : parseInt(freezfcoins),
                                                    timestamp : Date.now()
                                                };
                                                await festumeventoDB.model(constants.FE_MODELS.fcointransactions, fcointransactionModel).create(fcointransactionobj);
                                                let remainingfcoins = parseInt(parseInt(currentCoins.fcoins) - parseInt(freezfcoins));
                                                await festumeventoDB.model(constants.FE_MODELS.fcoins, fcoinModel).findByIdAndUpdate(defaultSetting[0]._id, {fcoins : parseInt(remainingfcoins)});
                                                return responseManager.onSuccess('Organizer coin freezed successfully !', updatedData, res);                                
                                            }
                                        }else{
                                            return responseManager.badrequest({ message: 'Approve organizer data first to freez f-coins for this organizer, please try again' }, res);
                                        }
                                    } else {
                                        return responseManager.badrequest({ message: 'Invalid organizer id to to freez f-coins, please try again' }, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid organizer id to freez f-coins, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Invalid F-Coin count to transfer each scanned user, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Invalid max user count, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid Freez F-Coin count, please try again' }, res);
                    }
                } else {
                    return responseManager.unauthorisedRequest(res);
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
