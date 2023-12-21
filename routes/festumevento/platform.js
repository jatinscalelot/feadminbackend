let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const platformModel = require('../../models/platforms.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let totalplatforms = parseInt(await primary.model(constants.MODELS.platforms, platformModel).countDocuments({}));
            primary.model(constants.MODELS.platforms, platformModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((platforms) => {
                platforms.totalplatforms = totalplatforms;
                return responseManager.onSuccess('Platforms list!', platforms, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get platforms list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { platformid, name, platformimage, description, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                let existingplatform = await primary.model(constants.MODELS.platforms, platformModel).findOne({_id : {$ne : platformid}, name : name,  owner : 'superadmin'}).lean();
                if(existingplatform == null){
                    let obj = {
                        name : name,
                        platformimage : platformimage,
                        description : description,
                        status : status,
                        owner : 'superadmin',
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.platforms, platformModel).findByIdAndUpdate(platformid, obj);
                    let updatedData = await primary.model(constants.MODELS.platforms, platformModel).findById(platformid).lean();
                    return responseManager.onSuccess('Platform updated sucecssfully!', updatedData, res);
                }else{
                    return responseManager.badrequest({ message: 'Platform name can not be identical, please try again' }, res);
                }
            }else{
                let existingplatform = await primary.model(constants.MODELS.platforms, platformModel).findOne({name : name,  owner : 'superadmin'}).lean();
                if(existingplatform == null) {
                    let obj = {
                        name : name,
                        platformimage : platformimage,
                        description : description,
                        status : status,
                        owner: 'superadmin',
                        createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    let insertedData = await primary.model(constants.MODELS.platforms, platformModel).create(obj);
                    return responseManager.onSuccess('Platform created sucecssfully!', insertedData, res);
                }else{
                    return responseManager.badrequest({ message: 'Platform name can not be identical, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to save platform data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token save platform data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { platformid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                await primary.model(constants.MODELS.platforms, platformModel).findByIdAndUpdate(platformid, {status : false});
                return responseManager.onSuccess('Platform removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid platform id to remove platform data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove platform data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.platforms, platformModel).find({}).then((platformslist) => {
                return responseManager.onSuccess('Platforms list!', platformslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get platforms list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { platformid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                let platformData = await primary.model(constants.MODELS.platforms, platformModel).findById(platformid);
                return responseManager.onSuccess('platform data!', platformData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid platform id to get platform data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get platform data, please try again' }, res);
    }
});
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).select('-password').lean();
        if(superadminData && superadminData.status == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'platform').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid superadminid to upload image, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
module.exports = router;
