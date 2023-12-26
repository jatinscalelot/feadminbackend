const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const roleModel = require('../../../models/superadmin/roles.model');
const mongoose = require('mongoose');
exports.getadminprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).select("-password -fcm_token -status -createdBy -updatedBy -createdAt -updatedAt -channelID").populate({ path: 'roleId', model: primary.model(constants.MODELS.roles, roleModel) }).lean();
        if (admindata) {
            return responseManager.onSuccess('Admin data!', admindata, res);
        } else {
            return responseManager.badrequest({ message: 'Oops ! Invalid Admin, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Oops ! Invalid Admin, please try again' }, res);
    }
};