let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listAgentCtrl = require('../../controllers/festumevento/agents/list');
const getoneAgentCtrl = require('../../controllers/festumevento/agents/getone');
const getOrganiserByAgentCtrl = require('../../controllers/festumevento/agents/getorganizers');
const exportAgentCtrl = require('../../controllers/festumevento/agents/export');
router.post('/', helper.authenticateToken, listAgentCtrl.withpagination);
router.post('/getone', helper.authenticateToken, getoneAgentCtrl.getoneagent);
router.post('/getorganiser', helper.authenticateToken, getOrganiserByAgentCtrl.getorganizersbyagent);
router.post('/export', helper.authenticateToken, exportAgentCtrl.exportagents);
module.exports = router; 