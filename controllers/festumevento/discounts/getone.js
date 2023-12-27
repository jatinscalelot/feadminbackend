const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const discountModel = require('../../../models/festumevento/discounts.model');
const mongoose = require('mongoose');
exports.getonediscount = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "discounts", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { discountid } = req.body;
                if( discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)){
                    let discountData = await festumeventoDB.model(constants.FE_MODELS.discounts, discountModel).findById(discountid).lean();
                    if(discountData){
                        return responseManager.onSuccess('Discount data!', discountData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Invalid discount id to get discount data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid discount id to get discount data, please try again' }, res);
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