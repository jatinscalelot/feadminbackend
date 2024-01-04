const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const discountModel = require('../../../models/festumevento/discounts.model');
const mongoose = require('mongoose');
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "discounts", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let allDiscounts = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).find({status : true}).lean();
                return responseManager.onSuccess('Discount list!', allDiscounts, res);
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
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "discounts", "view", "festumevento", primary);
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
                let totalDiscounts = parseInt(await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).countDocuments({}));
                let totalActiveDiscounts = parseInt(await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).countDocuments({status : true}));
                let totalInActiveDiscounts = parseInt(await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).countDocuments({status : false}));
                festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).paginate({
                    $or: [
                        { discountname : { '$regex' : new RegExp(search, "i") } },
                        { discounttype : { '$regex' : new RegExp(search, "i") } },
                        { description : { '$regex' : new RegExp(search, "i") } },
                    ],
                    ...query
                },{
                    page,
                    limit: parseInt(limit),
                    sort: { "_id" : -1 },
                    populate: ([
                        { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, 
                        { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }
                    ]),
                    lean: true
                }).then((discountslist) => {
                    discountslist.totalDiscounts = totalDiscounts;
                    discountslist.totalActiveDiscounts = totalActiveDiscounts;
                    discountslist.totalInActiveDiscounts = totalInActiveDiscounts;
                    return responseManager.onSuccess('Discount list!', discountslist, res);
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