const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const AwsCloud = require('../../../utilities/aws');
const organizerModel = require('../../../models/festumevento/organizers.model');
const agentModel = require('../../../models/festumevento/agents.model');
const adminModel = require('../../../models/superadmin/admins.model');
const mongoose = require("mongoose");
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/organizerReport.xlsx';
const async = require('async');
exports.exportorganizer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "organizers", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let organizerlist = await festumeventoDB.model(constants.FE_MODELS.organizers, organizerModel).find({}).populate(
                    {path: 'agentid', model: festumeventoDB.model(constants.FE_MODELS.agents, agentModel), select: 'name email mobile country_code'}
                ).lean();
                var ext = 'xlsx';
                var date = new Date();
                var timestamp = date.getTime().toString();
                const fileName = 'organizerReport/' + 'DOC' + '/organizerReport-' + helper.makeid(7) + timestamp + '.' + ext;
                const workbook = new jsonexcel.Workbook();
                const sheet1 = workbook.addWorksheet('organizerReport');
                sheet1.columns = [
                    {
                        header: 'Organizer Name',
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
                        header: 'Reference By',
                        key: 'refer_code',
                        width: 30
                    },
                    {
                        header: 'Refer Code',
                        key: 'my_refer_code',
                        width: 30
                    },
                    {
                        header: 'Agent Name',
                        key: 'agentname',
                        width: 40
                    },
                    {
                        header: 'Agent Email',
                        key: 'agentemail',
                        width: 40
                    },
                    {
                        header: 'Agent Mobile',
                        key: 'agentmobile',
                        width: 40
                    },
                    {
                        header: 'Approval',
                        key: 'is_approved',
                        width: 40
                    },
                    {
                        header: 'F-Coin Balance',
                        key: 'f_coins',
                        width: 30
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
                    },
                    {
                        header: 'Flat No',
                        key: 'flat_no',
                        width: 40
                    },
                    {
                        header: 'Street',
                        key: 'street',
                        width: 40
                    },
                    {
                        header: 'Area',
                        key: 'area',
                        width: 40
                    },
                    {
                        header: 'City',
                        key: 'city',
                        width: 40
                    },
                    {
                        header: 'State',
                        key: 'state',
                        width: 40
                    },
                    {
                        header: 'Country',
                        key: 'country',
                        width: 40
                    },
                    {
                        header: 'Pincode',
                        key: 'pincode',
                        width: 40
                    },
                    {
                        header: 'About',
                        key: 'about',
                        width: 40
                    }
                ];
                async.forEachSeries(organizerlist, (organizer, next_organizer) => {
                    let obj = {
                        name: (organizer.name && organizer.name != '') ? organizer.name : 'N/A',
                        email: (organizer.email && organizer.email != '') ? organizer.email : 'N/A',
                        country_code: (organizer.country_code && organizer.country_code != '') ? organizer.country_code : 'N/A',
                        mobile: (organizer.mobile && organizer.mobile != '') ? organizer.mobile : 'N/A',
                        mobileverified: (organizer.mobileverified && organizer.mobileverified != '') ? organizer.mobileverified : 'N/A',
                        refer_code: (organizer.refer_code && organizer.refer_code != '') ? organizer.refer_code : 'N/A',
                        my_refer_code: (organizer.my_refer_code && organizer.my_refer_code != '') ? organizer.my_refer_code : 'N/A',
                        agentname: (organizer.agentid && organizer.agentid != '' && organizer.agentid != null) ? organizer.agentid.name : 'N/A',
                        agentemail: (organizer.agentid && organizer.agentid != '' && organizer.agentid != null) ? organizer.agentid.email : 'N/A',
                        agentmobile: (organizer.agentid && organizer.agentid != '' && organizer.agentid != null) ? organizer.agentid.mobile : 'N/A',
                        is_approved: organizer.is_approved,
                        f_coins: (organizer.f_coins && parseFloat(organizer.f_coins) > 0) ? parseFloat(organizer.f_coins).toFixed(2) : '0.00',
                        createdAt: new Date(organizer.createdAt),
                        last_login_at: (organizer.last_login_at && organizer.last_login_at != '') ? new Date(organizer.last_login_at + 19800000) : 'N/A',
                        flat_no: (organizer.flat_no && organizer.flat_no != '') ? organizer.flat_no : 'N/A',
                        street: (organizer.street && organizer.street != '') ? organizer.street : 'N/A',
                        area: (organizer.area && organizer.area != '') ? organizer.area : 'N/A',
                        city: (organizer.city && organizer.city != '') ? organizer.city : 'N/A',
                        state: (organizer.state && organizer.state != '') ? organizer.state : 'N/A',
                        country: (organizer.country && organizer.country != '') ? organizer.country : 'N/A',
                        pincode: (organizer.pincode && organizer.pincode != '') ? organizer.pincode : 'N/A',
                        about: (organizer.about && organizer.about != '') ? organizer.about : 'N/A'
                    };
                    sheet1.addRow(obj);
                    next_organizer();
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
                return responseManager.forbiddenRequest(res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};
