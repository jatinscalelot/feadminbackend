let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listPromotionCouponCtrl = require('../../controllers/festumevento/promotioncoupons/list');
const getonePromotionCouponCtrl = require('../../controllers/festumevento/promotioncoupons/getone');
const onoffPromotionCouponCtrl = require('../../controllers/festumevento/promotioncoupons/onoff');
const savePromotionCouponCtrl = require('../../controllers/festumevento/promotioncoupons/save');
router.post('/', helper.authenticateToken, listPromotionCouponCtrl.withpagination);
router.get('/', helper.authenticateToken, listPromotionCouponCtrl.withoutpagination);
router.post('/getone', helper.authenticateToken, getonePromotionCouponCtrl.getonepromotioncoupon);
router.post('/onoff', helper.authenticateToken, onoffPromotionCouponCtrl.onoffpromotioncoupon);
router.post('/save', helper.authenticateToken, savePromotionCouponCtrl.savepromotioncoupon);
module.exports = router;
