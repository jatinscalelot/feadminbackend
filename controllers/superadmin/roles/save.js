const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.saverole = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "insertUpdate", "superadmin", primary);
            if (havePermission) {
                const { roleid, name, description, permissions } = req.body;
                if(name && name.trim() != ''){
                    if(description && description.trim() != ''){
                        if(permissions && permissions.superadmin && permissions.festumevento && permissions.eventopackage && permissions.festumfield && permissions.festumcoin && permissions.festumadvertisingmedia){
                            if(roleid && roleid != null && roleid != '' && mongoose.Types.ObjectId.isValid(roleid)){
                                let checkExisting = await primary.model(constants.MODELS.roles, roleModel).findOne({ name: name }).lean();
                                if(checkExisting == null || (checkExisting && checkExisting._id.toString() == roleid.toString())){
                                    let obj = {
                                        name : name,
                                        description : description,
                                        permissions : permissions,
                                        updatedBy : new mongoose.Types.ObjectId(req.token.superadminid)
                                    };
                                    await primary.model(constants.MODELS.roles, roleModel).findByIdAndUpdate(roleid, obj);
                                    let updatedRole =  await primary.model(constants.MODELS.roles, roleModel).findById(roleid).lean();
                                    return responseManager.onSuccess('Role updated successfully!', updatedRole, res);
                                }else{
                                    return responseManager.badrequest({ message: 'Identical Role, Role data already exist with same Name, Please try again' }, res);
                                }
                            }else{
                                let checkExisting = await primary.model(constants.MODELS.roles, roleModel).findOne({ name: name }).lean();
                                if(checkExisting == null){
                                    let obj = {
                                        name : name,
                                        description : description,
                                        status : true,
                                        permissions : permissions,
                                        createdBy : new mongoose.Types.ObjectId(req.token.superadminid),
                                        updatedBy : new mongoose.Types.ObjectId(req.token.superadminid),
                                    };
                                    let newrole = await primary.model(constants.MODELS.roles, roleModel).create(obj);
                                    return responseManager.onSuccess('Role created successfully!', newrole, res);
                                }else{
                                    return responseManager.badrequest({ message: 'Identical Role, Role data already exist with same Name, Please try again' }, res);
                                }
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Invalid permissions to create or update a role, Please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid description, Description can not be empty while create or update a role, Please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid Role Name, Name can not be empty while create or update a role, Please try again' }, res);
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