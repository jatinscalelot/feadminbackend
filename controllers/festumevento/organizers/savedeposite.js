const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.saveorganizerdeposite = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, amount, interestper, date, transactionid } = req.body;
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    let organizerData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).lean();
                    if (organizerData && organizerData != null && organizerData.mobileverified == true) {
                        if (amount && !(isNaN(amount)) && (parseFloat(amount) > 0)) {
                            if (interestper && !(isNaN(interestper)) && (parseFloat(interestper) > 0)) {
                                const dateObject = new Date(date);
                                if(dateObject.toString() !== 'Invalid Date'){
                                    if(transactionid && transactionid.trim() != ''){
                                        let obj = {
                                            amount : parseFloat(amount),
                                            interestper : parseFloat(interestper),
                                            date : new Date(date),
                                            timestamp : dateObject.getTime(),
                                            transactionid : transactionid,
                                            currenttime : Date.now()
                                        };
                                        await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, {isdepositereceived : true, deposite : obj, updatedBy : new mongoose.Types.ObjectId(admindata._id)});
                                        let organizerDataFinal = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).populate([
                                            {path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'},
                                            { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                            { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                                        ]).lean();
                                        return responseManager.onSuccess('Organizer deposite received successfully!', organizerDataFinal, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Invalid transaction id to save deposite, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Invalid date to save deposite, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Invalid interest perecentage to save deposite, please try again' }, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid amount to save deposite, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid organizer id to save deposite, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid organizer id to save deposite, please try again' }, res);
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
