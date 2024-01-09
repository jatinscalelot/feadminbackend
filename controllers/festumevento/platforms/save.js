const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const AwsCloud = require('../../../utilities/fe_aws');
const allowedContentTypes = require('../../../utilities/content-types');
const adminModel = require('../../../models/superadmin/admins.model');
const platformModel = require('../../../models/festumevento/platforms.model');
const mongoose = require('mongoose');
exports.saveplatform = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "platforms", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { platformid, name, description } = req.body;
                if(name && name.trim() != '' && name != null){
                    if(description && description.trim() != '' && description != null){
                        if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                            let existingplatform = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findOne({_id : {$ne : platformid}, name : name}).lean();
                            if(existingplatform == null){
                                if (req.file) {
                                    if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                        let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                        if (filesizeinMb <= 10) {
                                            AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'platform').then((result) => {
                                                if (result && result.data && result.data.Key) {
                                                    (async () => {
                                                        let obj = {
                                                            name : name,
                                                            platformimage : result.data.Key,
                                                            description : description,
                                                            updatedBy : new mongoose.Types.ObjectId(req.token.superadminid)
                                                        };
                                                        await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findByIdAndUpdate(platformid, obj);
                                                        let updatedData = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(platformid).populate([
                                                            { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                                            { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                                                        ]).lean();
                                                        return responseManager.onSuccess('Platform Data Updated Successfully...', updatedData, res);
                                                    })().catch((error) => { return responseManager.onError(error, res); });
                                                } else {
                                                    return responseManager.badrequest({ message: 'Invalid Images file for Platform Pic, Unable to upload the file, please try again' }, res);
                                                }
                                            }).catch((err) => { return responseManager.onError(err, res); });
                                        } else {
                                            return responseManager.badrequest({ message: 'Invalid Images file for Platform Pic, File size must be <= 10 MB, please try again' }, res);
                                        }
                                    } else {
                                        return responseManager.badrequest({ message: 'Invalid Images file for Platform Pic, File must be Image, please try again' }, res);
                                    }
                                }else{
                                    let obj = {
                                        name : name,
                                        description : description,
                                        updatedBy : new mongoose.Types.ObjectId(req.token.superadminid)
                                    };
                                    await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findByIdAndUpdate(platformid, obj);
                                    let updatedData = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(platformid).populate([
                                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                                    ]).lean();
                                    return responseManager.onSuccess('Platform Data Updated Successfully...', updatedData, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Platform name can not be identical, please try again' }, res);
                            }
                        }else{
                            let existingplatform = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findOne({_id : {$ne : platformid}, name : name}).lean();
                            if(existingplatform == null){
                                if (req.file) {
                                    if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                        let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                        if (filesizeinMb <= 10) {
                                            AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'platform').then((result) => {
                                                if (result && result.data && result.data.Key) {
                                                    (async () => {
                                                        let obj = {
                                                            name : name,
                                                            platformimage : result.data.Key,
                                                            description : description,
                                                            status : true,
                                                            owner : 'superadmin',
                                                            createdBy : new mongoose.Types.ObjectId(req.token.superadminid),
                                                            updatedBy : new mongoose.Types.ObjectId(req.token.superadminid)
                                                        };
                                                       let newObject = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).create(obj);
                                                        let newcreatedData = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).findById(newObject._id).populate([
                                                            { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                                                            { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                                                        ]).lean();
                                                        return responseManager.onSuccess('Platform created Successfully...', newcreatedData, res);
                                                    })().catch((error) => { return responseManager.onError(error, res); });
                                                } else {
                                                    return responseManager.badrequest({ message: 'Invalid Images file for Platform Pic, Unable to upload the file, please try again' }, res);
                                                }
                                            }).catch((err) => { return responseManager.onError(err, res); });
                                        } else {
                                            return responseManager.badrequest({ message: 'Invalid Images file for Platform Pic, File size must be <= 10 MB, please try again' }, res);
                                        }
                                    } else {
                                        return responseManager.badrequest({ message: 'Invalid Images file for Platform Pic, File must be Image, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Invalid Platform Pic, Please upload platform picture and try again...' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Platform name can not be identical, please try again' }, res);
                            }
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid platform description, Platform description can not be empty, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid platform name, Platform name can not be empty, please try again' }, res);
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