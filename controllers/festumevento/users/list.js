const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const userModel = require('../../../models/festumevento/users.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "users", "view", "festumevento", primary);
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
                let totalUsers = parseInt(await festumeventoDB.model(constants.FE_MODELS.users, userModel).countDocuments({}));
                let totalActiveUsers = parseInt(await festumeventoDB.model(constants.FE_MODELS.users, userModel).countDocuments({status : true, mobileverified : true}));
                let totalInActiveUsers = parseInt(await festumeventoDB.model(constants.FE_MODELS.users, userModel).countDocuments({$or: [{status : false}, {mobileverified : false}]}));
                festumeventoDB.model(constants.MODELS.users, userModel).paginate({
                    $or: [
                        { name: { '$regex': new RegExp(search, "i") } },
                        { email: { '$regex': new RegExp(search, "i") } },
                        { mobile: { '$regex': new RegExp(search, "i") } },
                        { country_code: { '$regex': new RegExp(search, "i") } },
                        { refer_code: { '$regex': new RegExp(search, "i") } },
                        { my_refer_code: { '$regex': new RegExp(search, "i") } },
                        { about: { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id : -1 },
                    select: '-password',
                    lean: true
                }).then((userList) => {
                    userList.totalUsers = totalUsers;
                    userList.totalActiveUsers = totalActiveUsers;
                    userList.totalInActiveUsers = totalInActiveUsers;
                    return responseManager.onSuccess('users list!', userList, res);
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