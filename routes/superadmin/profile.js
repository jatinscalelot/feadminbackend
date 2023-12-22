let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const adminModel = require('../../models/superadmin/admins.model');
const roleModel = require('../../models/superadmin/roles.model');
const mongoose = require('mongoose');
const multerFn = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require('../../utilities/content-types');
const config = require('../../utilities/config');
const async = require('async');
router.get('/', helper.authenticateToken, async (req, res) => {
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
});
router.post('/', helper.authenticateToken, async (req, res) => {
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
                            let updatedAdmin = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
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
});
router.post('/profilepic', helper.authenticateToken, multerFn.memoryUpload.single("file"), async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= 10) {
                        AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'profile').then((result) => {
                            if(result && result.data && result.data.Key){
                                primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(req.token.superadminid, { profile_pic: result.data.Key }).then((updateprofileobj) => {
                                    return responseManager.onSuccess('Updated Admin Profile...', updateprofileobj, res);
                                }).catch((err) => {
                                    return responseManager.onError(err, res);
                                });
                            }else{
                                return responseManager.badrequest({ message: 'Invalid Images file, Unable to upload the file, please try again' }, res);
                            }
                        }).catch((err) => {
                            return responseManager.onError(err, res);
                        });
                    } else {
                        return responseManager.badrequest({ message: 'Images files must be less than 10 mb to upload, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid image file formate for profile, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid image file please upload valid file, and try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Oops ! Invalid Admin, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Oops ! Invalid Admin, please try again' }, res);
    }
});
module.exports = router;