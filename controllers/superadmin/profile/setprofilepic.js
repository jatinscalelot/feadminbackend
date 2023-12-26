const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require('../../../utilities/content-types');
const mongoose = require('mongoose');
exports.setadminprofilepic = async (req, res) => {
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
                                    ( async () => {
                                        let updatedData = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
                                        return responseManager.onSuccess('Updated Admin Profile...', updatedData, res);
                                    })().catch((error) => { return responseManager.onError(error, res); });
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
};