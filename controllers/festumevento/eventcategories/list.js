const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const eventcategoryModel = require('../../../models/festumevento/eventcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "eventcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { page, limit, search, status } = req.body;
                let query = {};
                if (status != 'All') {
                    if (status == 'InActive') {
                        query.status = false;
                    } else if (status == 'Active') {
                        query.status = true;
                    }
                }
                let totalEventcategories = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).countDocuments({}));
                let totalActiveEventcategories = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).countDocuments({ status: true }));
                let totalInActiveEventcategories = parseInt(await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).countDocuments({ status: false }));
                festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).paginate({
                    $or: [
                        { categoryname: { '$regex': new RegExp(search, "i") } },
                        { description: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { "_id": -1 },
                    populate: ([
                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                    ]),
                    lean: true
                }).then((categories) => {
                    categories.totalEventcategories = totalEventcategories;
                    categories.totalActiveEventcategories = totalActiveEventcategories;
                    categories.totalInActiveEventcategories = totalInActiveEventcategories;
                    return responseManager.onSuccess('Categories list!', categories, res);
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
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "eventcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { event_type } = req.body;
                let query = {};
                if (event_type != 'All') {
                    query.event_type = event_type;
                }
                let allActiveEventCategory = await festumeventoDB.model(constants.FE_MODELS.eventcategories, eventcategoryModel).find({ status: true, ...query }).lean();
                return responseManager.onSuccess('Categories list!', allActiveEventCategory, res);
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