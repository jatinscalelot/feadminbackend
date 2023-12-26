const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const projectModel = require('../../../models/superadmin/projects.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "projects", "view", "superadmin", primary);
            if (havePermission) {
                let allProjects = await primary.model(constants.MODELS.projects, projectModel).find({ status: true }).select("display_name key_name description status project_pic").sort({ display_name: 1 }).lean();
                return responseManager.onSuccess('Project List!', allProjects, res);
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
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "projects", "view", "superadmin", primary);
            if (havePermission) {
                const { page, limit, search, status } = req.body;
                let totalProjects = parseInt(await primary.model(constants.MODELS.projects, projectModel).countDocuments({}));
                let totalActiveProjects = parseInt(await primary.model(constants.MODELS.projects, projectModel).countDocuments({ status: true }));
                let totalInActiveProjects = parseInt(await primary.model(constants.MODELS.projects, projectModel).countDocuments({ status: false }));
                let query = {};
                if (status != 'All') {
                    if (status == 'InActive') {
                        query.status = false;
                    } else if (status == 'Active') {
                        query.status = true;
                    }
                }
                await primary.model(constants.MODELS.projects, projectModel).paginate({
                    $or: [
                        { display_name: { '$regex': new RegExp(search, "i") } },
                        { key_name: { '$regex': new RegExp(search, "i") } },
                        { description: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id": -1 },
                    lean: true
                }).then((projectList) => {
                    projectList.totalprojects = totalProjects;
                    projectList.totalactiveprojects = totalActiveProjects;
                    projectList.totalinactiveprojects = totalInActiveProjects;
                    return responseManager.onSuccess('Project List!', projectList, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
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