const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.returnorganizerdeposite = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { organizerid } = req.body;
                if (organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)) {
                    let organizerData = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findById(organizerid).lean();
                    if (organizerData && organizerData != null && organizerData.mobileverified == true) {
                        await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, {isdepositereceived : false, deposite : {}, updatedBy : new mongoose.Types.ObjectId(admindata._id)});
                        let organizerDataFinal = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).populate([
                            {path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'},
                            { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                            { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                        ]).lean();
                        return responseManager.onSuccess('Organizer deposite returned successfully!', organizerDataFinal, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid organizer id to return deposite, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid organizer id to return deposite, please try again' }, res);
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
