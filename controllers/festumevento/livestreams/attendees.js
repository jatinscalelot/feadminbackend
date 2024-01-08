const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const AwsCloud = require('../../../utilities/aws');
const helper = require('../../../utilities/helper');
const config = require('../../../utilities/config');
const adminModel = require('../../../models/superadmin/admins.model');
const livestreamModel = require('../../../models/festumevento/livestreams.model');
const userModel = require('../../../models/festumevento/users.model');
const livestreamviewerModel = require('../../../models/festumevento/livestreamviews.model');
const mongoose = require('mongoose');
const async = require('async');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/attendeesReport.xlsx';
exports.attendees = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "livestreamviews", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { livestreamid, page, limit } = req.body;
                if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                    let livestreamData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                    if (livestreamData && livestreamData != null) {
                        festumeventoDB.model(constants.FE_MODELS.livestreamviews, livestreamviewerModel).paginate({
                            livestreamid: new mongoose.Types.ObjectId(livestreamid)
                        }, {
                            page,
                            limit: parseInt(limit),
                            sort: { _id: -1 },
                            populate: { path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name email mobile profilepic" },
                            lean: true
                        }).then((attendeelist) => {
                            return responseManager.onSuccess("Livestream attendees list", attendeelist, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream attendees, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream attendees, please try again' }, res);
                }
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
exports.export = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "livestreamviews", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { livestreamid } = req.body;
                if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                    let livestreamData = await festumeventoDB.model(constants.FE_MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                    if (livestreamData && livestreamData != null) {
                        let attendeelist = await festumeventoDB.model(constants.FE_MODELS.livestreamviews, livestreamviewerModel).find({
                            livestreamid: new mongoose.Types.ObjectId(livestreamid)
                        }).populate({ path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name email mobile country_code profilepic" }).lean();
                        var ext = 'xlsx';
                        var date = new Date();
                        var timestamp = date.getTime().toString();
                        const fileName = 'attendeesReport/' + 'DOC' + '/attendeesReport-' + helper.makeid(7) + timestamp + '.' + ext;
                        const workbook = new jsonexcel.Workbook();
                        const sheet1 = workbook.addWorksheet('attendeesReport');
                        sheet1.columns = [
                            {
                                header: 'Attendee Name',
                                key: 'attendee_name',
                                width: 50
                            },
                            {
                                header: 'Attendee Email',
                                key: 'attendee_email',
                                width: 50
                            },
                            {
                                header: 'Attendee Mobile',
                                key: 'attendee_mobile',
                                width: 50
                            },
                            {
                                header: 'Livestream Title',
                                key: 'livestream_title',
                                width: 50
                            },
                            {
                                header: 'View Date Time',
                                key: 'timestamp',
                                style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                                width: 50
                            }
                        ];
                        async.forEachSeries(attendeelist, (attendee, next_attendee) => {
                            if (attendee && attendee.userid && attendee.userid.name && attendee.userid.email && attendee.userid.country_code && attendee.userid.mobile) {
                                let obj = {
                                    attendee_name: attendee.userid.name,
                                    attendee_email: attendee.userid.email,
                                    attendee_mobile: attendee.userid.country_code.toString() + attendee.userid.mobile.toString(),
                                    livestream_title: livestreamData.event_name,
                                    timestamp: new Date(attendee.createdAt)
                                };
                                sheet1.addRow(obj);
                                next_attendee();
                            } else {
                                next_attendee();
                            }
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
                        return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream attendees, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream attendees, please try again' }, res);
                }
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