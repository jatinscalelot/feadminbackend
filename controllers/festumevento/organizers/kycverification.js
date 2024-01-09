const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.approvedisapproveorganizerKYC = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid, status, remark } = req.body;
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    let organizerData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).lean();
                    if (organizerData && organizerData != null && organizerData.mobileverified == true) {
                        if(organizerData.status == true && organizerData.is_approved == true){
                            if(status == 'approved' || status == 'rejected'){
                                if(status == 'rejected'){
                                    if(organizerData.kyc_details && organizerData.kyc_details.status == 'pending' || organizerData.kyc_details.status == 'approved' || organizerData.kyc_details.status == 'rejected'){
                                        let kyc_details = organizerData.kyc_details;
                                        kyc_details.status = status;
                                        kyc_details.remark = remark;
                                        await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, { kyc_details : kyc_details, updatedBy : new mongoose.Types.ObjectId(admindata._id) });
                                        let updatedData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).populate([{path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'}, { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                                        return responseManager.onSuccess('Organizer data dis-approved successfully !', updatedData, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Approve organizer data first to approve - reject organizer KYC data, please try again' }, res);
                                    }
                                }else{
                                    if(organizerData.kyc_details && organizerData.kyc_details.status == 'pending' || organizerData.kyc_details.status == 'approved' || organizerData.kyc_details.status == 'rejected'){
                                        let kyc_details = organizerData.kyc_details;
                                        kyc_details.status = status;
                                        await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, { kyc_details : kyc_details, updatedBy : new mongoose.Types.ObjectId(admindata._id) });
                                        let updatedData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).populate([{path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'}, { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                                        return responseManager.onSuccess('Organizer data dis-approved successfully !', updatedData, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Approve organizer data first to approve - reject organizer KYC data, please try again' }, res);
                                    }
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Invalid Status approve - reject organizer KYC data, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Approve organizer data first to approve - reject organizer KYC data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid organizer id to approve dis-approve organizer KYC data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid organizer id to approve dis-approve organizer KYC data, please try again' }, res);
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
