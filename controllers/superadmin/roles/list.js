const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "view", "superadmin", primary);
            if (havePermission) {
                let allRoles = await primary.model(constants.MODELS.roles, roleModel).find({status : true}).select("status description name").lean();
                return responseManager.onSuccess('Roles List!', allRoles, res);
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
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "view", "superadmin", primary);
            if (havePermission) {
                const { page, limit, search, status } = req.body;
                let totalRoles = parseInt(await primary.model(constants.MODELS.roles, roleModel).countDocuments({}));
                let totalActiveRoles = parseInt(await primary.model(constants.MODELS.roles, roleModel).countDocuments({status : true}));
                let totalInActiveRoles = parseInt(await primary.model(constants.MODELS.roles, roleModel).countDocuments({status : false}));
                let query = {};
                if(status != 'All'){
                    if(status == 'InActive'){
                        query.status = false;
                    }else if(status == 'Active'){
                        query.status = true;
                    }
                }
                await primary.model(constants.MODELS.roles, roleModel).paginate({
                    $or: [
                        { name: { '$regex': new RegExp(search, "i") } },
                        { description: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    select: "-permissions -__v",
                    populate : [
                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" },
                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                    ],
                    lean: true
                }).then((roleList) => {
                    roleList.totalroles = totalRoles;
                    roleList.totalactiveroles = totalActiveRoles;
                    roleList.totalinactiveroles = totalInActiveRoles;
                    return responseManager.onSuccess('Roles List!', roleList, res);
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