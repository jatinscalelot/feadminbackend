const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const AwsCloud = require('../../../utilities/aws');
const userModel = require('../../../models/festumevento/users.model');
const adminModel = require('../../../models/superadmin/admins.model');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/userReport.xlsx';
const async = require('async');
const mongoose = require("mongoose");
exports.exportuser = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "users", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                let userlist = await festumeventoDB.model(constants.FE_MODELS.users, userModel).find({}).lean();
                var ext = 'xlsx';
                var date = new Date();
                var timestamp = date.getTime().toString();
                const fileName = 'userReport/' + 'DOC' + '/userReport-' + helper.makeid(7) + timestamp + '.' + ext;
                const workbook = new jsonexcel.Workbook();
                const sheet1 = workbook.addWorksheet('userReport');
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
                        header: 'About',
                        key: 'about',
                        width: 40
                    }
                ];
                async.forEachSeries(userlist, (user, next_user) => {
                    let obj = {
                        name: (user.name && user.name != '') ? user.name : 'N/A',
                        email: (user.email && user.email != '') ? user.email : 'N/A',
                        country_code: (user.country_code && user.country_code != '') ? user.country_code : 'N/A',
                        mobile: (user.mobile && user.mobile != '') ? user.mobile : 'N/A',
                        mobileverified: (user.mobileverified && user.mobileverified != '') ? user.mobileverified : 'N/A',
                        refer_code: (user.refer_code && user.refer_code != '') ? user.refer_code : 'N/A',
                        my_refer_code: (user.my_refer_code && user.my_refer_code != '') ? user.my_refer_code : 'N/A',
                        f_coins: (user.f_coins && parseFloat(user.f_coins) > 0) ? parseFloat(user.f_coins).toFixed(2) : '0.00',
                        createdAt: new Date(user.createdAt),
                        last_login_at: (user.last_login_at && user.last_login_at != '') ? new Date(user.last_login_at + 19800000) : 'N/A',
                        about: (user.about && user.about != '') ? user.about : 'N/A'
                    };
                    sheet1.addRow(obj);
                    next_user();
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