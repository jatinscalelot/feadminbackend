const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const itemModel = require('../../../models/festumevento/items.model');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "items", "view", "festumevento", primary);
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
                let totalItems = parseInt(await festumeventoDB.model(constants.FE_MODELS.items, itemModel).countDocuments({}));
                let totalActiveItems = parseInt(await festumeventoDB.model(constants.FE_MODELS.items, itemModel).countDocuments({status : true}));
                let totalInActiveItems = parseInt(await festumeventoDB.model(constants.FE_MODELS.items, itemModel).countDocuments({status : false}));
                festumeventoDB.model(constants.FE_MODELS.items, itemModel).paginate({
                    $or: [
                        { itemname : { '$regex' : new RegExp(search, "i") } },
                        { description : { '$regex' : new RegExp(search, "i") } },
                    ],
                    ...query
                },{
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    lean: true
                }).then((items) => {
                    items.totalItems = totalItems;
                    items.totalActiveItems = totalActiveItems;
                    items.totalInActiveItems = totalInActiveItems;
                    return responseManager.onSuccess('Items list!', items, res);
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
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "items", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                festumeventoDB.model(constants.FE_MODELS.items, itemModel).find({status : true}).then((itemslist) => {
                    return responseManager.onSuccess('Items list!', itemslist, res);
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