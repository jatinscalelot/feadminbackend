const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const itemModel = require('../../../models/festumevento/items.model');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require('../../../utilities/content-types');
const mongoose = require('mongoose');
exports.saveitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "items", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { itemid, itemname, description, isonlyperperson } = req.body;
                if (itemname && itemname.trim() != '') {
                    if (itemid && itemid != '' && itemid != null && mongoose.Types.ObjectId.isValid(itemid)) {
                        let checkExisting = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findOne({ _id: { $ne: itemid }, itemname: itemname }).lean();
                        if (checkExisting == null) {
                            if (req.file) {
                                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                    if (filesizeinMb <= 10) {
                                        AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'item').then((result) => {
                                            if (result && result.data && result.data.Key) {
                                                (async () => {
                                                    let obj = {
                                                        itemname: itemname,
                                                        itemimage: result.data.Key,
                                                        description: description,
                                                        isonlyperperson: isonlyperperson,
                                                        updatedBy: new mongoose.Types.ObjectId(admindata._id)
                                                    };
                                                    await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findByIdAndUpdate(itemid, obj);
                                                    let updatedData = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findById(itemid).lean();
                                                    return responseManager.onSuccess('Item Data Updated Successfully...', updatedData, res);
                                                })().catch((error) => { return responseManager.onError(error, res); });
                                            } else {
                                                return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, Unable to upload the file, please try again' }, res);
                                            }
                                        }).catch((err) => { return responseManager.onError(err, res); });
                                    } else {
                                        return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, File size must be <= 10 MB, please try again' }, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, File must be Image, please try again' }, res);
                                }
                            } else {
                                let obj = {
                                    itemname: itemname,
                                    description: description,
                                    isonlyperperson: isonlyperperson,
                                    updatedBy: new mongoose.Types.ObjectId(admindata._id)
                                };
                                await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findByIdAndUpdate(itemid, obj);
                                let updatedData = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findById(itemid).lean();
                                return responseManager.onSuccess('Item Data Updated Successfully...', updatedData, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Item name can not be identical, please try again' }, res);
                        }
                    } else {
                        let existingitem = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).findOne({ itemname: itemname }).lean();
                        if (existingitem == null) {
                            if (req.file) {
                                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                    if (filesizeinMb <= 10) {
                                        AwsCloud.saveToS3(req.file.buffer, admindata._id.toString(), req.file.mimetype, 'item').then((result) => {
                                            if (result && result.data && result.data.Key) {
                                                (async () => {
                                                    let obj = {
                                                        itemname: itemname,
                                                        itemimage:  result.data.Key,
                                                        description: description,
                                                        isonlyperperson: isonlyperperson,
                                                        status: true,
                                                        createdBy: new mongoose.Types.ObjectId(admindata._id),
                                                        updatedBy: new mongoose.Types.ObjectId(admindata._id)
                                                    };
                                                    let insertedData = await festumeventoDB.model(constants.FE_MODELS.items, itemModel).create(obj);
                                                    return responseManager.onSuccess('Item Data Created Successfully...', insertedData, res);
                                                })().catch((error) => { return responseManager.onError(error, res); });
                                            } else {
                                                return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, Unable to upload the file, please try again' }, res);
                                            }
                                        }).catch((err) => { return responseManager.onError(err, res); });
                                    } else {
                                        return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, File size must be <= 10 MB, please try again' }, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, File must be Image, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Invalid Images file for Item Pic, File must be Image, please try again' }, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Item name can not be identical, please try again' }, res);
                        }
                    }
                } else {
                    return responseManager.badrequest({ message: 'Item Name Can not be Empty, please try again' }, res);
                }
            } else {
                return responseManager.forbiddenRequest(res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};