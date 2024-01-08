const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.activeinactiverole = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "insertUpdate", "superadmin", primary);
            if (havePermission) {
                const { roleid } = req.body;
                if(roleid && roleid != null && roleid != '' && mongoose.Types.ObjectId.isValid(roleid)){
                    let roledata = await primary.model(constants.MODELS.roles, roleModel).findById(roleid).lean();
                    if(roledata){
                        if(roledata.status == true){
                            await primary.model(constants.MODELS.roles, roleModel).findByIdAndUpdate(roleid, {status : false, updatedBy: new mongoose.Types.ObjectId(admindata._id)});
                            let updatedRole = await primary.model(constants.MODELS.roles, roleModel).findById(roleid).populate([{ path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                            return responseManager.onSuccess('Role status updated successfully!', updatedRole, res);
                        }else{
                            await primary.model(constants.MODELS.roles, roleModel).findByIdAndUpdate(roleid, {status : true, updatedBy: new mongoose.Types.ObjectId(admindata._id)});
                            let updatedRole = await primary.model(constants.MODELS.roles, roleModel).findById(roleid).populate([{ path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                            return responseManager.onSuccess('Role status updated successfully!', updatedRole, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Role Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid role id to update role data, Please try again' }, res);
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