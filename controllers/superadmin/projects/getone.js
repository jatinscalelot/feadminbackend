const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const projectModel = require('../../../models/superadmin/projects.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.getoneproject = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "projects", "view", "superadmin", primary);
            if (havePermission) {
                const { projectid } = req.body;
                if (projectid && projectid != '' && projectid != null && mongoose.Types.ObjectId.isValid(projectid)) {
                    let existingProject = await primary.model(constants.MODELS.projects, projectModel).findById(projectid).populate([{ path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                    if (existingProject) {
                        return responseManager.onSuccess('Project details!', existingProject, res);
                    } else {
                        return responseManager.badrequest({ message: 'Oops ! Invalid Project Mongo ID, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Oops ! Invalid Project Mongo ID, please try again' }, res);
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