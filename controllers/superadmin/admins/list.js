const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
exports.listwithpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "admins", "view", "superadmin", primary);
            if (havePermission) {
                const { page, limit, search, status } = req.body;
                let totalAdmins = parseInt(await primary.model(constants.MODELS.admins, adminModel).countDocuments({}));
                let totalActiveAdmins = parseInt(await primary.model(constants.MODELS.admins, adminModel).countDocuments({status : true}));
                let totalInActiveAdmins = parseInt(await primary.model(constants.MODELS.admins, adminModel).countDocuments({status : false}));
                let query = {};
                if(status != 'All'){
                    if(status == 'InActive'){
                        query.status = false;
                    }else if(status == 'Active'){
                        query.status = true;
                    }
                }
                await primary.model(constants.MODELS.admins, adminModel).paginate({
                    $or: [
                        { name: { '$regex': new RegExp(search, "i") } },
                        { email: { '$regex': new RegExp(search, "i") } },
                        { mobile: { '$regex': new RegExp(search, "i") } },
                        { about: { '$regex': new RegExp(search, "i") } },
                        { city: { '$regex': new RegExp(search, "i") } },
                        { country: { '$regex': new RegExp(search, "i") } },
                        { pincode: { '$regex': new RegExp(search, "i") } },
                        { state: { '$regex': new RegExp(search, "i") } },
                        { adminid: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    populate: [
                        {path : 'roleId', model: primary.model(constants.MODELS.roles, roleModel)},
                        {path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},
                        {path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}
                    ],
                    select : "-password",
                    lean: true
                }).then((adminList) => {
                    adminList.totaladmins = totalAdmins;
                    adminList.totalactiveadmins = totalActiveAdmins;
                    adminList.totalinactiveadmins = totalInActiveAdmins;
                    return responseManager.onSuccess('Admin List!', adminList, res);
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