const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require('mongoose');
exports.setadminprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        const { name, email, mobile, country_code, about, city, country, dob, pincode, state } = req.body;
        if (name && name.trim() != '') {
            if (email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
                if (mobile && mobile.trim() != '' && mobile.length == 10) {
                    if (country_code && country_code.trim() != '') {
                        let checkExisting = await primary.model(constants.MODELS.admins, adminModel).findOne({ $or: [{ name: name }, { email: email }, { mobile: mobile }], }).lean();
                        if (checkExisting == null || (checkExisting && checkExisting._id.toString() == req.token.superadminid.toString())) {
                            let obj = {
                                name: name,
                                email: email,
                                mobile: mobile,
                                country_code: country_code,
                                about: (about && about != '') ? about : '',
                                city: (city && city != '') ? city : '',
                                country: (country && country != '') ? country : '',
                                dob: (dob && dob != '') ? dob : '',
                                pincode: (pincode && pincode != '') ? pincode : '',
                                state: (state && state != '') ? state : '',
                                updatedBy: new mongoose.Types.ObjectId(req.token.superadminid),
                            };
                            await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(req.token.superadminid, obj);
                            let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).populate([{ path: 'roleId', model: primary.model(constants.MODELS.roles, roleModel) }, { path: 'createdBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }, { path: 'updatedBy', model: primary.model(constants.MODELS.admins, adminModel), select : "name" }]).lean();
                            return responseManager.onSuccess('Admin data updated successfully!', updatedAdmin, res);
                        } else {
                            return responseManager.badrequest({ message: 'Identical Admin, Admin data already exist with either Name, Email, or Mobile please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Oops ! Invalid Country Code, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Oops ! Invalid Mobile Number, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Oops ! Invalid Email-ID, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Oops ! Invalid or Empty Admin Full Name, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Oops ! Invalid Admin, please try again' }, res);
    }
};