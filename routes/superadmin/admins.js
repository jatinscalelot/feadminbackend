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
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "admins", "view", "superadmin", primary);
            if (havePermission) {
                const { page, limit, search, state } = req.body;
                let totalAdmins = parseInt(await primary.model(constants.MODELS.admins, adminModel).countDocuments({}));
                let totalActiveAdmins = parseInt(await primary.model(constants.MODELS.admins, adminModel).countDocuments({status : true}));
                let totalInActiveAdmins = parseInt(await primary.model(constants.MODELS.admins, adminModel).countDocuments({status : false}));
                let query = {};
                if(state != 'All'){
                    if(state == 'InActive'){
                        query.status = false;
                    }else if(state == 'Active'){
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
                        {path : 'roleId', model: primary.model(constants.MODELS.roles, roleModel)}
                    ],
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
                return response.forbiddenRequest(res);
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
            let havePermission = await config.getPermission(admindata.roleId, "admins", "insertUpdate", "superadmin", primary);
            if (havePermission) {
                const { saadminid, name, email, mobile, country_code, password, about, city, country, dob, pincode, state, adminid, roleId } = req.body;
                if(name && name.trim() != ''){
                    if(email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))){
                        if(mobile && mobile.trim() != '' && mobile.length == 10){
                            if(country_code && country_code.trim() != ''){
                                if(adminid && adminid.trim() != '' && adminid.length >= 7){
                                    if(roleId && roleId != '' && roleId != null && mongoose.Types.ObjectId.isValid(roleId)){
                                        if(saadminid && saadminid != '' && saadminid != null && mongoose.Types.ObjectId.isValid(saadminid)){
                                            let checkExisting = await primary.model(constants.MODELS.admins, adminModel).findOne({$or: [{ name: name },{ email: email },{ mobile: mobile }, { adminid: adminid }],}).lean();
                                            if(checkExisting == null || (checkExisting && checkExisting._id.toString() == saadminid.toString())){
                                                let obj = {
                                                    name : name,
                                                    email : email,
                                                    mobile : mobile,
                                                    country_code : country_code,
                                                    about : (about && about != '') ? about : '',
                                                    city : (city && city != '') ? city : '',
                                                    country : (country && country != '') ? country : '',
                                                    dob : (dob && dob != '') ? dob : '',
                                                    pincode : (pincode && pincode != '') ? pincode : '',
                                                    state : (state && state != '') ? state : '',
                                                    adminid : adminid,
                                                    roleId : new mongoose.Types.ObjectId(roleId),
                                                    updatedBy : ''
                                                };
                                                await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(saadminid, obj);
                                                let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                                                return responseManager.onSuccess('Admin data updated successfully!', updatedAdmin, res);
                                            }else{
                                                return responseManager.badrequest({ message: 'Identical Admin, Admin data already exist with either Name, Email, Mobile, or AdminID please try again' }, res);
                                            }                               
                                        }else{
                                            let checkExisting = await primary.model(constants.MODELS.admins, adminModel).findOne({$or: [{ name: name },{ email: email },{ mobile: mobile }, { adminid: adminid }],}).lean();
                                            if(checkExisting == null) {
                                                let obj = {
                                                    name : name,
                                                    email : email,
                                                    mobile : mobile,
                                                    country_code : country_code,
                                                    password : await helper.passwordEncryptor(password),
                                                    fcm_token : '',
                                                    status : true,
                                                    about : (about && about != '') ? about : '',
                                                    city : (city && city != '') ? city : '',
                                                    country : (country && country != '') ? country : '',
                                                    dob : (dob && dob != '') ? dob : '',
                                                    pincode : (pincode && pincode != '') ? pincode : '',
                                                    state : (state && state != '') ? state : '',
                                                    profile_pic : '',
                                                    adminid : adminid,
                                                    channelID : '',
                                                    roleId : new mongoose.Types.ObjectId(roleId),
                                                    createdBy : '',
                                                    updatedBy : ''
                                                };
                                                let createdAdmin = await primary.model(constants.MODELS.admins, adminModel).create(obj);
                                                await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(createdAdmin._id, { channelID: createdAdmin.mobile.toString() + '_' + createdAdmin._id.toString() });
                                                let adminData = await primary.model(constants.MODELS.admins, adminModel).findById(createdAdmin._id).lean();
                                                return responseManager.onSuccess('Admin created successfully!', adminData, res);
                                            }else{
                                                return responseManager.badrequest({ message: 'Identical Admin, Admin data already exist with either Name, Email, Mobile, or AdminID please try again' }, res);
                                            }
                                        }
                                    }else{
                                        return responseManager.badrequest({ message: 'Oops ! Invalid roal-ID, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Oops ! Invalid Admin-ID, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Oops ! Invalid Country Code, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Oops ! Invalid Mobile Number, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Email-ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Invalid or Empty Admin Full Name, please try again' }, res);
                }
            }else{
                return response.forbiddenRequest(res);
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
            let havePermission = await config.getPermission(admindata.roleId, "admins", "insertUpdate", "superadmin", primary);
            if (havePermission) {
                const { saadminid } = req.body;
                if(saadminid && saadminid != '' && saadminid != null && mongoose.Types.ObjectId.isValid(saadminid)){
                    let existingAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                    if(existingAdmin){
                        if(existingAdmin.status == true){
                            await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(saadminid, {status : false});
                            let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                            return responseManager.onSuccess('Admin status updated successfully!', updatedAdmin, res);
                        }else{
                            await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(saadminid, {status : true});
                            let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                            return responseManager.onSuccess('Admin status updated successfully!', updatedAdmin, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
                }
            }else{
                return response.forbiddenRequest(res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
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
                    let existingAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).populate({path : 'roleId', model: primary.model(constants.MODELS.roles, roleModel)}).lean();
                    if(existingAdmin){
                        return responseManager.onSuccess('Admin details!', existingAdmin, res);
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
                }
            }else{
                return response.forbiddenRequest(res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;