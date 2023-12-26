const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const projectModel = require('../../../models/superadmin/projects.model');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require('../../../utilities/content-types');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.saveproject = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "projects", "insertUpdate", "superadmin", primary);
            if (havePermission) {
                const { projectid, display_name, key_name, description } = req.body;
                if (display_name && display_name.trim() != '') {
                    if (key_name && key_name.trim() != '') {
                        if (description && description.trim() != '') {
                            if (projectid && projectid != '' && projectid != null && mongoose.Types.ObjectId.isValid(projectid)) {
                                let checkExisting = await primary.model(constants.MODELS.projects, projectModel).findOne({ $or: [{ display_name: display_name }, { key_name: key_name }], }).lean();
                                if (checkExisting == null || (checkExisting && checkExisting._id.toString() == projectid.toString())) {
                                    if (req.file) {
                                        if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                            let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                            if (filesizeinMb <= 10) {
                                                AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'project').then((result) => {
                                                    if (result && result.data && result.data.Key) {
                                                        (async () => {
                                                            let obj = {
                                                                display_name: display_name,
                                                                key_name: key_name,
                                                                project_pic: result.data.Key,
                                                                description: description,
                                                                updatedBy: new mongoose.Types.ObjectId(admindata._id)
                                                            };
                                                            await primary.model(constants.MODELS.projects, projectModel).findByIdAndUpdate(projectid, obj);
                                                            let updatedData = await primary.model(constants.MODELS.projects, projectModel).findById(projectid).lean();
                                                            return responseManager.onSuccess('Project Data Updated Successfully...', updatedData, res);
                                                        })().catch((error) => { return responseManager.onError(error, res); });
                                                    } else {
                                                        return responseManager.badrequest({ message: 'Invalid Images file for Project Pic, Unable to upload the file, please try again' }, res);
                                                    }
                                                }).catch((err) => { return responseManager.onError(err, res); });
                                            } else {
                                                return responseManager.badrequest({ message: 'Invalid Images file for Project Pic, File size must be <= 10 MB, please try again' }, res);
                                            }
                                        } else {
                                            return responseManager.badrequest({ message: 'Invalid Images file for Project Pic, File must be Image, please try again' }, res);
                                        }
                                    } else {
                                        let obj = {
                                            display_name: display_name,
                                            key_name: key_name,
                                            description: description,
                                            updatedBy: new mongoose.Types.ObjectId(admindata._id)
                                        };
                                        await primary.model(constants.MODELS.projects, projectModel).findByIdAndUpdate(projectid, obj);
                                        let updatedData = await primary.model(constants.MODELS.projects, projectModel).findById(projectid).lean();
                                        return responseManager.onSuccess('Project Data Updated Successfully...', updatedData, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Identical Project, Project data already exist Name, please try again' }, res);
                                }
                            } else {
                                if (req.file) {
                                    if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                        let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                        if (filesizeinMb <= 10) {
                                            AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'project').then((result) => {
                                                if (result && result.data && result.data.Key) {
                                                    (async () => {
                                                        let obj = {
                                                            display_name: display_name,
                                                            key_name: key_name,
                                                            description: description,
                                                            status: true,
                                                            project_pic: result.data.Key,
                                                            createdBy: new mongoose.Types.ObjectId(admindata._id),
                                                            updatedBy: new mongoose.Types.ObjectId(admindata._id)
                                                        };
                                                        let newcreatedData = await primary.model(constants.MODELS.projects, projectModel).create(obj);
                                                        return responseManager.onSuccess('Project created successfully!', newcreatedData, res);
                                                    })().catch((error) => { return responseManager.onError(error, res); });
                                                } else {
                                                    return responseManager.badrequest({ message: 'Invalid Images file for Project Pic, Unable to upload the file, please try again' }, res);
                                                }
                                            }).catch((err) => { return responseManager.onError(err, res); });
                                        } else {
                                            return responseManager.badrequest({ message: 'Invalid Images file for Project Pic, File size must be <= 10 MB, please try again' }, res);
                                        }
                                    } else {
                                        return responseManager.badrequest({ message: 'Invalid Images file for Project Pic, File must be Image, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Please upload project pic to create a project, please try again' }, res);
                                }
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Project Description Can not be Empty, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Project Key Name Can not be Empty, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Project Display Name Can not be Empty, please try again' }, res);
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
};