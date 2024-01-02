const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
exports.getoneadmin = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "admins", "view", "superadmin", primary);
            if (havePermission) {
                const { saadminid } = req.body;
                if(saadminid && saadminid != '' && saadminid != null && mongoose.Types.ObjectId.isValid(saadminid)){
                    let existingAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).populate([{path : 'roleId', model: primary.model(constants.MODELS.roles, roleModel)},{path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},{path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}]).select("-password").lean();
                    if(existingAdmin){
                        return responseManager.onSuccess('Admin details!', existingAdmin, res);
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
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