var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const listLivestreamCtrl = require('../../controllers/superadmin/livestream/list');
const getoneLivestreamCtrl = require('../../controllers/superadmin/livestream/getone');
const approveLivestreamCtrl = require('../../controllers/superadmin/livestream/approve');
const rejectLivestreamCtrl = require('../../controllers/superadmin/livestream/reject');
const deleteLivestreamCtrl = require('../../controllers/superadmin/livestream/remove');
const attendeesLivestreamCtrl = require('../../controllers/superadmin/livestream/attendees');
router.post('/', helper.authenticateToken, listLivestreamCtrl.list);
router.post('/getone', helper.authenticateToken, getoneLivestreamCtrl.getone);
router.post('/approve', helper.authenticateToken, approveLivestreamCtrl.approve);
router.post('/reject', helper.authenticateToken, rejectLivestreamCtrl.reject);
router.post('/remove', helper.authenticateToken, deleteLivestreamCtrl.remove);
router.post('/attendees', helper.authenticateToken, attendeesLivestreamCtrl.attendees);
router.post('/exportattendees', helper.authenticateToken, attendeesLivestreamCtrl.export);
module.exports = router;