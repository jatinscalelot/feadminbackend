let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const agentModel = require('../../models/agents.model');
const superadminModel = require('../../models/superadmins.model');
const eventModel = require('../../models/events.model');
const { default: mongoose } = require("mongoose");
const AwsCloud = require('../../utilities/aws');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/agentReport.xlsx';
const async = require('async');
const listAgentCtrl = require('../../controllers/festumevento/agents/list');
const getoneAgentCtrl = require('../../controllers/festumevento/agents/getone');
const getOrganiserByAgentCtrl = require('../../controllers/festumevento/agents/getorganizers');
router.post('/', helper.authenticateToken, listAgentCtrl.withpagination);
router.post('/getone', helper.authenticateToken, getoneAgentCtrl.getoneagent);
router.post('/getorganiser', helper.authenticateToken, getOrganiserByAgentCtrl.getorganizersbyagent);
router.post('/export', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            let agentlist = await primary.model(constants.MODELS.agents, agentModel).find({}).lean();
            var ext = 'xlsx';
            var date = new Date();
            var timestamp = date.getTime().toString();
            const fileName = 'agentReport/' + 'DOC' + '/agentReport-' + helper.makeid(7) + timestamp + '.' + ext;
            const workbook = new jsonexcel.Workbook();
            const sheet1 = workbook.addWorksheet('agentReport');
            sheet1.columns = [
                {
                    header: 'Name',
                    key: 'name',
                    width: 40
                },
                {
                    header: 'Email',
                    key: 'email',
                    width: 40
                },
                {
                    header: 'Country Code',
                    key: 'country_code',
                    width: 30
                },
                {
                    header: 'Mobile',
                    key: 'mobile',
                    width: 40
                },
                {
                    header: 'Mobile Verification',
                    key: 'mobileverified',
                    width: 40
                },
                {
                    header: 'Registration Time',
                    key: 'createdAt',
                    style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                    width: 50
                },
                {
                    header: 'Last Login At',
                    key: 'last_login_at',
                    style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                    width: 50
                }
            ];
            async.forEachSeries(agentlist, (agent, next_agent) => {
                let obj = {
                    name : (agent.name && agent.name != '') ? agent.name : 'N/A',
                    email : (agent.email && agent.email != '') ? agent.email : 'N/A',
                    country_code : (agent.country_code && agent.country_code != '') ? agent.country_code : 'N/A',
                    mobile : (agent.mobile && agent.mobile != '') ? agent.mobile : 'N/A',
                    mobileverified : (agent.mobileverified && agent.mobileverified != '') ? agent.mobileverified : 'N/A',
                    createdAt : new Date(agent.createdAt),
                    last_login_at : (agent.last_login_at && agent.last_login_at != '') ? new Date(agent.last_login_at + 19800000) : 'N/A'
                };
                sheet1.addRow(obj);
                next_agent();
            }, () => {
                workbook.xlsx.writeFile(excelFileName).then(() => {
                    var data = fs.readFileSync(excelFileName);
                    if (data) {
                        AwsCloud.saveToS3withFileName(data, req.token.superadminid.toString(), 'application/vnd.ms-excel', fileName).then((fileresponse) => {
                            return responseManager.onSuccess('file added successfully', process.env.AWS_BUCKET_URI + fileresponse.data.Key, res);
                        }).catch((err) => {
                            return responseManager.onError(err, res);
                        });
                    }
                });
            });
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to export agents list, please try again' }, res);
    }
});
module.exports = router;