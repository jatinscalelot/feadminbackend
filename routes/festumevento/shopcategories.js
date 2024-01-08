let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const shopcategoryModel = require('../../models/shopcategories.model');
const superadminModel = require('../../models/superadmins.model');
const { default: mongoose } = require("mongoose");
const listShopCategoryCtrl = require('../../controllers/festumevento/shopcategories/list');
const saveShopCategoryCtrl = require('../../controllers/festumevento/shopcategories/save');
const getoneShopCategoryCtrl = require('../../controllers/festumevento/shopcategories/getone');
const onoffShopCategoryCtrl = require('../../controllers/festumevento/shopcategories/onoff');
router.post('/', helper.authenticateToken, listShopCategoryCtrl.withpagination);
router.get('/', helper.authenticateToken, listShopCategoryCtrl.withoutpagination);
router.post('/save', helper.authenticateToken, saveShopCategoryCtrl.saveshopcategory);
router.post('/getone', helper.authenticateToken, getoneShopCategoryCtrl.getoneshopcategory);
router.post('/onoff', helper.authenticateToken, onoffShopCategoryCtrl.onoffshopcategory);

router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            let totalshopcategories = parseInt(await primary.model(constants.MODELS.shopcategories, shopcategoryModel).countDocuments({}));
            primary.model(constants.MODELS.shopcategories, shopcategoryModel).paginate({
                $or: [
                    { categoryname: { '$regex': new RegExp(search, "i") } },
                    { description: { '$regex': new RegExp(search, "i") } }
                ]
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((categories) => {
                categories.totalshopcategories = totalshopcategories;
                return responseManager.onSuccess('Shop Categories list!', categories, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get shop categories list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { categoryid, categoryname, description, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                let existingCategory = await primary.model(constants.MODELS.shopcategories, shopcategoryModel).findOne({ _id: { $ne: categoryid }, categoryname: categoryname }).lean();
                if (existingCategory == null) {
                    let obj = {
                        categoryname: categoryname,
                        description: description,
                        status: status,
                        updatedBy: mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.shopcategories, shopcategoryModel).findByIdAndUpdate(categoryid, obj);
                    let updatedData = await primary.model(constants.MODELS.shopcategories, shopcategoryModel).findById(categoryid).lean();
                    return responseManager.onSuccess('Category updated sucecssfully!', updatedData, res);
                } else {
                    return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                }
            } else {
                let existingCategory = await primary.model(constants.MODELS.shopcategories, shopcategoryModel).findOne({ categoryname: categoryname }).lean();
                if (existingCategory == null) {
                    let obj = {
                        categoryname: categoryname,
                        description: description,
                        status: status,
                        createdBy: mongoose.Types.ObjectId(req.token.superadminid),
                        updatedBy: mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    let insertedData = await primary.model(constants.MODELS.shopcategories, shopcategoryModel).create(obj);
                    return responseManager.onSuccess('Category created sucecssfully!', insertedData, res);
                } else {
                    return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                }
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to save category data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { categoryid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                await primary.model(constants.MODELS.shopcategories, shopcategoryModel).findByIdAndUpdate(categoryid, {status : false});
                return responseManager.onSuccess('Category removed sucecssfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid category id to remove category data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to remove category data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            primary.model(constants.MODELS.shopcategories, shopcategoryModel).find({}).then((categories) => {
                return responseManager.onSuccess('Categories list!', categories, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get categories list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { categoryid } = req.body;  
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                let categoryData = await primary.model(constants.MODELS.shopcategories, shopcategoryModel).findById(categoryid);
                return responseManager.onSuccess('Category data !', categoryData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid category id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get category data, please try again' }, res);
    }
});
module.exports = router;
