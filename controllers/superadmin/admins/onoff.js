const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
exports.activeinactiveadmin = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "admins", "insertUpdate", "superadmin", primary);
            if (havePermission) {
                const { saadminid } = req.body;
                if(saadminid && saadminid != '' && saadminid != null && mongoose.Types.ObjectId.isValid(saadminid)){
                    let existingAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                    if(existingAdmin){
                        if(existingAdmin.status == true){
                            await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(saadminid, {status : false});
                            let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                            return responseManager.onSuccess('Admin status updated successfully!', updatedAdmin, res);
                        }else{
                            await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(saadminid, {status : true});
                            let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(saadminid).lean();
                            return responseManager.onSuccess('Admin status updated successfully!', updatedAdmin, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Oops ! Invalid Admin Mongo ID, please try again' }, res);
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