let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const adminModel = require('../../models/superadmin/admins.model');
const roleModel = require('../../models/superadmin/roles.model');
const mongoose = require('mongoose');
const config = require('../../utilities/config');
const async = require('async');
router.get('/defaultpermissions', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "view", "superadmin", primary);
            if (havePermission) {
                let permissions = {
                    superadmin : [],
                    festumevento : [],
                    eventopackage : [],
                    festumfield : [],
                    festumcoin : [],
                    festumadvertisingmedia : []
                };
                async.forEachSeries(config.SuperadminCollections, (sapermissions, next_sapermissions) => {
                    let obj = {
                        "displayname" : sapermissions.text,
                        "collectionName" : sapermissions.value,
                        "insertUpdate" : false,
                        "delete" : false,
                        "view" : false
                    };
                    permissions.superadmin.push(obj);
                    next_sapermissions();
                }, () => {
                    async.forEachSeries(config.FestumeventoCollections, (fepermissions, next_fepermissions) => {
                        let obj = {
                            "displayname" : fepermissions.text,
                            "collectionName" : fepermissions.value,
                            "insertUpdate" : false,
                            "delete" : false,
                            "view" : false
                        };
                        permissions.festumevento.push(obj);
                        next_fepermissions();
                    }, () => {
                        async.forEachSeries(config.EventopackageCollections, (eppermissions, next_eppermissions) => {
                            let obj = {
                                "displayname" : eppermissions.text,
                                "collectionName" : eppermissions.value,
                                "insertUpdate" : false,
                                "delete" : false,
                                "view" : false
                            };
                            permissions.eventopackage.push(obj);
                            next_eppermissions();
                        }, () => {
                            async.forEachSeries(config.FestumfieldCollections, (ffpermissions, next_ffpermissions) => {
                                let obj = {
                                    "displayname" : ffpermissions.text,
                                    "collectionName" : ffpermissions.value,
                                    "insertUpdate" : false,
                                    "delete" : false,
                                    "view" : false
                                };
                                permissions.festumfield.push(obj);
                                next_ffpermissions();
                            }, () => {
                                async.forEachSeries(config.FestumcoinCollections, (fcpermissions, next_fcpermissions) => {
                                    let obj = {
                                        "displayname" : fcpermissions.text,
                                        "collectionName" : fcpermissions.value,
                                        "insertUpdate" : false,
                                        "delete" : false,
                                        "view" : false
                                    };
                                    permissions.festumcoin.push(obj);
                                    next_fcpermissions();
                                }, () => {
                                    async.forEachSeries(config.FestumadvertisingmediaCollections, (fampermissions, next_fampermissions) => {
                                        let obj = {
                                            "displayname" : fampermissions.text,
                                            "collectionName" : fampermissions.value,
                                            "insertUpdate" : false,
                                            "delete" : false,
                                            "view" : false
                                        };
                                        permissions.festumadvertisingmedia.push(obj);
                                        next_fampermissions();
                                    }, () => {
                                        return responseManager.onSuccess('Default Permission', {permissions : permissions}, res);
                                    });
                                });
                            });
                        });
                    });
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
});
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "view", "superadmin", primary);
            if (havePermission) {
                const { page, limit, search, state } = req.body;
                let totalRoles = parseInt(await primary.model(constants.MODELS.roles, roleModel).countDocuments({}));
                let totalActiveRoles = parseInt(await primary.model(constants.MODELS.roles, roleModel).countDocuments({status : true}));
                let totalInActiveRoles = parseInt(await primary.model(constants.MODELS.roles, roleModel).countDocuments({status : false}));
                let query = {};
                if(state != 'All'){
                    if(state == 'InActive'){
                        query.status = false;
                    }else if(state == 'Active'){
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
});
router.post('/save', helper.authenticateToken, async (req, res) => {
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
});
router.post('/onoff', helper.authenticateToken, async (req, res) => {
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
                            await primary.model(constants.MODELS.roles, roleModel).findByIdAndUpdate(roleid, {status : false});
                            let updatedRole = await primary.model(constants.MODELS.roles, roleModel).findById(roleid).lean();
                            return responseManager.onSuccess('Role status updated successfully!', updatedRole, res);
                        }else{
                            await primary.model(constants.MODELS.roles, roleModel).findByIdAndUpdate(roleid, {status : true});
                            let updatedRole = await primary.model(constants.MODELS.roles, roleModel).findById(roleid).lean();
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
});
module.exports = router;
