const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const eventModel = require('../../../models/festumevento/events.model');
const mongoose = require('mongoose');
const AwsCloud = require('../../../utilities/aws');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/agentReport.xlsx';
const async = require('async');
exports.getorganizersbyagent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "agents", "view", "festumevento", primary);
            if (havePermission) {
                const { agentid } = req.body;
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                if(agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)){
                    let agentData = await festumeventoDB.model(constants.FE_MODELS.agents, agentModel).findById(agentid).lean();
                    if(agentData){
                        let organiserList = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).find({agentid : mongoose.Types.ObjectId(agentid)
                        }).lean();
                        return responseManager.onSuccess('Organizer data !', organiserList, res);
                    }else{
                        return responseManager.badrequest({ message: 'Agent Not Found, Invalid agent id to get agent data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Agent Not Found, Invalid agent id to get agent data, please try again' }, res);
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