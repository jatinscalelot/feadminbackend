let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const multerFn = require('../../utilities/multer.functions');
const listProjectCtrl = require('../../controllers/superadmin/projects/list');
const saveProjectCtrl = require('../../controllers/superadmin/projects/save');
const onoffProjectCtrl = require('../../controllers/superadmin/projects/onoff');
const getoneProjectCtrl = require('../../controllers/superadmin/projects/getone');
router.get('/', helper.authenticateToken, listProjectCtrl.withoutpagination);
router.post('/', helper.authenticateToken, listProjectCtrl.withpagination);
router.post('/save', helper.authenticateToken, multerFn.memoryUpload.single("file"), saveProjectCtrl.saveproject);
router.post('/onoff', helper.authenticateToken, onoffProjectCtrl.activeinactiveproject);
router.post('/getone', helper.authenticateToken, getoneProjectCtrl.getoneproject);
module.exports = router;
