const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const itemModel = require('../../../models/festumevento/items.model');
const mongoose = require('mongoose');
exports.onoffitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "items", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { itemid } = req.body;
                if( itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                    let itemData = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findById(itemid).lean();
                    if(itemData){
                        if(itemData.status == true){
                            await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findByIdAndUpdate(itemid, {status : false});
                            let updatedItem = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findById(itemid).lean();
                            return responseManager.onSuccess('Item status updated successfully!', updatedItem, res);
                        }else{
                            await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findByIdAndUpdate(itemid, {status : true});
                            let updatedItem = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findById(itemid).lean();
                            return responseManager.onSuccess('Item status updated successfully!', updatedItem, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid item id to update item data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid item id to update item data, please try again' }, res);
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