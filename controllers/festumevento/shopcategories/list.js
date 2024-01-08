const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const shopcategoryModel = require('../../../models/festumevento/shopcategories.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "shopcategories", "view", "festumevento", primary);
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
                let totalShopCategory = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).countDocuments({}));
                let totalActiveShopCategory = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).countDocuments({ status: true }));
                let totalInActiveShopCategory = parseInt(await festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).countDocuments({ status: false }));
                festumeventoDB.model(constants.FE_MODELS.shopcategories, shopcategoryModel).paginate({
                    $or: [
                        { categoryname: { '$regex': new RegExp(search, "i") } },
                        { description: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id : -1 },
                    populate: [
                        {path : 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"},
                        {path : 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select: "name"}
                    ],
                    lean: true
                }).then((categories) => {
                    categories.totalShopCategory = totalShopCategory;
                    categories.totalActiveShopCategory = totalActiveShopCategory;
                    categories.totalInActiveShopCategory = totalInActiveShopCategory;
                    return responseManager.onSuccess('Shop Categories list!', categories, res);
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
            let havePermission = await config.getPermission(admindata.roleId, "shopcategories", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                festumeventoDB.model(constants.MODELS.shopcategories, shopcategoryModel).find({status : true}).then((categories) => {
                    return responseManager.onSuccess('Categories list!', categories, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                })
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