const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { page, limit, search, status, approval_status, mobile_status, kyc_status } = req.body;
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
                if(kyc_status != 'All'){
                    if(kyc_status == 'approved'){
                        query['kyc_details.status'] = 'approved';
                    }else if(kyc_status == 'rejected'){
                        query['kyc_details.status'] = 'rejected';
                    }else if(kyc_status == 'pending'){
                        query['kyc_details.status'] = 'pending';
                    }
                }
                let totalOrganizers = parseInt(await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).countDocuments({}));
                let totalActiveOrganizers = parseInt(await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).countDocuments({status : true, is_approved : true, mobileverified : true}));
                let totalInActiveOrganizers = parseInt(await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).countDocuments({$or: [{status : false}, {is_approved : false}, {mobileverified : false}]}));
                festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).paginate({
                    $or: [
                        { name: { '$regex': new RegExp(search, "i") } },
                        { email: { '$regex': new RegExp(search, "i") } },
                        { mobile: { '$regex': new RegExp(search, "i") } },
                        { refer_code: { '$regex': new RegExp(search, "i") } },
                        { my_refer_code: { '$regex': new RegExp(search, "i") } },
                        { about: { '$regex': new RegExp(search, "i") } },
                        { city: { '$regex': new RegExp(search, "i") } },
                        { country: { '$regex': new RegExp(search, "i") } },
                        { state: { '$regex': new RegExp(search, "i") } },
                        { pincode: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id : -1 },
                    populate: ([
                        {path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'},
                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                    ]),
                    lean: true
                }).then((organizersList) => {
                    organizersList.totalOrganizers = totalOrganizers;
                    organizersList.totalActiveOrganizers = totalActiveOrganizers;
                    organizersList.totalInActiveOrganizers = totalInActiveOrganizers;
                    return responseManager.onSuccess('organizers list!', organizersList, res);
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
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let organizerList = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).find({status : true, is_approved : true, mobileverified : true}).select("name email mobile country_code profile_pic").sort({_id : -1}).lean();
                return responseManager.onSuccess('organizers list!', organizerList, res);
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

