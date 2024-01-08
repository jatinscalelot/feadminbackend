let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const getGlobalSettingCtrl = require('../../controllers/festumevento/settings/getglobalsetting');
const onoffDepositeOnGlobalSettingCtrl = require('../../controllers/festumevento/settings/deposite');
router.get('/', helper.authenticateToken, getGlobalSettingCtrl.getglobalsetting);
router.post('/onoffdeposite', helper.authenticateToken, onoffDepositeOnGlobalSettingCtrl.onoffdepositemoduleonglobalsetting);
module.exports = router;