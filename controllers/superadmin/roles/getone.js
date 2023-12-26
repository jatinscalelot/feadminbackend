const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.getonerole = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "roles", "view", "superadmin", primary);
            if (havePermission) {
                const { roleid } = req.body;
                if (roleid && roleid != '' && roleid != null && mongoose.Types.ObjectId.isValid(roleid)) {
                    let existingRole = await primary.model(constants.MODELS.roles, roleModel).findById(roleid).lean();
                    if (existingRole) {
                        return responseManager.onSuccess('Role details!', existingRole, res);
                    } else {
                        return responseManager.badrequest({ message: 'Oops ! Invalid Role Mongo ID, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Oops ! Invalid Role Mongo ID, please try again' }, res);
                }
            } else {
                return responseManager.forbiddenRequest(res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
}