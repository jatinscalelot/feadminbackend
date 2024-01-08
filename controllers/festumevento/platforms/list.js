const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const fileHelper = require('../../../utilities/multer.functions');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require('../../../utilities/content-types');
const adminModel = require('../../../models/superadmin/admins.model');
const platformModel = require('../../../models/festumevento/platforms.model');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "platforms", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { page, limit, search, status } = req.body;
                let query = {};
                if(status != 'All'){
                    if(status == 'InActive'){
                        query.status = false;
                    }else if(status == 'Active'){
                        query.status = true;
                    }
                }
                let totalPlatforms = parseInt(await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).countDocuments({}));
                let totalActivePlatforms = parseInt(await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).countDocuments({ status : true }));
                let totalInActivePlatforms = parseInt(await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).countDocuments({ status : false}));
                festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).paginate({
                    $or: [
                        { name : { '$regex' : new RegExp(search, "i") } },
                        { description : { '$regex' : new RegExp(search, "i") } },
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id : -1 },
                    populate: ([
                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                    ]),
                    lean: true
                }).then((platformList) => {
                    platformList.totalPlatforms = totalPlatforms;
                    platformList.totalActivePlatforms = totalActivePlatforms;
                    platformList.totalInActivePlatforms = totalInActivePlatforms;
                    return responseManager.onSuccess('organizers list!', platformList, res);
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
};
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "platforms", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let allPlatforms = await festumeventoDB.model(constants.FE_MODELS.platforms, platformModel).find({status : true}).lean();
                return responseManager.onSuccess('Platforms list!', allPlatforms, res);
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