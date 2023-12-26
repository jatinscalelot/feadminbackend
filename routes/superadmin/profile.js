let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const multerFn = require('../../utilities/multer.functions');
const getAdminProfileCtrl = require('../../controllers/superadmin/profile/getprofile');
const setAdminProfileCtrl = require('../../controllers/superadmin/profile/setprofile');
const setAdminProfilePicCtrl = require('../../controllers/superadmin/profile/setprofilepic');
router.get('/', helper.authenticateToken, getAdminProfileCtrl.getadminprofile);
router.post('/', helper.authenticateToken, setAdminProfileCtrl.setadminprofile);
router.post('/profilepic', helper.authenticateToken, multerFn.memoryUpload.single("file"), setAdminProfilePicCtrl.setadminprofilepic);
module.exports = router;