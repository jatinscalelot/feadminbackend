const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "agents", "view", "festumevento", primary);
            if (havePermission) {
                const { page, limit, search, status, approval_status, mobile_status } = req.body;
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let query = {};
                if(status != 'All'){
                    if(status == 'InActive'){
                        query.status = false;
                    }else if(status == 'Active'){
                        query.status = true;
                    }
                }
                if(approval_status != 'All'){
                    if(approval_status == 'InActive'){
                        query.is_approved = false;
                    }else if(approval_status == 'Active'){
                        query.is_approved = true;
                    }
                }
                if(mobile_status != 'All'){
                    if(mobile_status == 'InActive'){
                        query.mobileverified = false;
                    }else if(mobile_status == 'Active'){
                        query.mobileverified = true;
                    }
                }
                let totalAgents = parseInt(await festumeventoDB.model(constants.FE_MODELS.agents, agentModel).countDocuments({}));
                let totalActiveAgents = parseInt(await festumeventoDB.model(constants.FE_MODELS.agents, agentModel).countDocuments({status : true, is_approved : true, mobileverified : true}));
                let totalInActiveAgents = parseInt(await festumeventoDB.model(constants.FE_MODELS.agents, agentModel).countDocuments({$or: [{status : false}, {is_approved : false}, {mobileverified : false}]}));
                festumeventoDB.model(constants.FE_MODELS.agents, agentModel).paginate({
                    $or: [
                        { name : { '$regex' : new RegExp(search, "i") } },
                        { email : { '$regex' : new RegExp(search, "i") } },
                        { mobile : { '$regex' : new RegExp(search, "i") } }
                    ],
                    ...query
                },{
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    lean: true
                }).then((agentList) => {
                    agentList.totalAgents = totalAgents;
                    agentList.totalActiveAgents = totalActiveAgents;
                    agentList.totalInActiveAgents = totalInActiveAgents;
                    return responseManager.onSuccess('agent list!', agentList, res);
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