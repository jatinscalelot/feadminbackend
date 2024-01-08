const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const config = require('../../../utilities/config');
const AwsCloud = require('../../../utilities/aws');
const helper = require('../../../utilities/helper');
const shopModel = require('../../../models/festumevento/shops.model');
const offlineofferModel = require('../../../models/festumevento/offlineoffers.model');
const adminModel = require('../../../models/superadmin/admins.model');
const userModel = require('../../../models/festumevento/users.model');
const offlineofferbookingModel = require('../../../models/festumevento/offlineofferbookings.model');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/attendeesReport.xlsx';
const mongoose = require('mongoose');
const async = require('async');
exports.attendees = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "offlineofferbookings", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { shopid, offlineofferid, page, limit } = req.body;
                if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid) && offlineofferid && offlineofferid != '' && mongoose.Types.ObjectId.isValid(offlineofferid)) {
                    let offlineOfferData = await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                    if (offlineOfferData && offlineOfferData.shopid.toString() == shopid.toString()) {
                        festumeventoDB.model(constants.FE_MODELS.offlineofferbookings, offlineofferbookingModel).paginate({
                            offerid : new mongoose.Types.ObjectId(offlineofferid),
                            shopid : new mongoose.Types.ObjectId(shopid),
                        },{
                            page,
                            limit: parseInt(limit),
                            sort: { _id : -1 },
                            populate: { path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name email mobile profilepic"},
                            lean: true
                        }).then((attendeelist) => {
                            return responseManager.onSuccess("shop offer attendees list", attendeelist, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    } else {
                        return responseManager.badrequest({ message: 'Invalid shop id to get offline offer attendees data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid shop id to get offline offer attendees list, please try again' }, res);
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
exports.exportattendees = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if (admindata) {
            let havePermission = await config.getPermission(admindata.roleId, "offlineofferbookings", "view", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                const { shopid, offlineofferid } = req.body;
                if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid) && offlineofferid && offlineofferid != '' && mongoose.Types.ObjectId.isValid(offlineofferid)) {
                    let offlineOfferData = await festumeventoDB.model(constants.FE_MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                    if (offlineOfferData && offlineOfferData.shopid.toString() == shopid.toString()) {
                        let attendeelist = await festumeventoDB.model(constants.FE_MODELS.offlineofferbookings, offlineofferbookingModel).find({
                            offerid : new mongoose.Types.ObjectId(offlineofferid),
                            shopid : new mongoose.Types.ObjectId(shopid),
                        }).populate([{ path: 'userid', model: festumeventoDB.model(constants.FE_MODELS.users, userModel), select: "name email mobile profilepic"},{ path: 'shopid', model : festumeventoDB.model(constants.FE_MODELS.shops, shopModel), select : 'shop_name'}]).lean();
                        var ext = 'xlsx';
                        var date = new Date();
                        var timestamp = date.getTime().toString();
                        const fileName = 'attendeesReport/' + 'DOC' + '/attendeesReport-' + helper.makeid(7) + timestamp + '.' + ext;
                        const workbook = new jsonexcel.Workbook();
                        const sheet1 = workbook.addWorksheet('attendeesReport');
                        sheet1.columns = [
                            {
                                header: 'Invoice Number',
                                key: 'invoice_no',
                                width: 40
                            },
                            {
                                header: 'Attendee Name',
                                key: 'attendee_name',
                                width: 50
                            },
                            {
                                header: 'Offer Title',
                                key: 'offer_title',
                                width: 50
                            },
                            {
                                header: 'Shop Name',
                                key: 'shop_name',
                                width: 50
                            },
                            {
                                header: 'Status',
                                key: 'status',
                                width: 30
                            },
                            {
                                header: 'Offer Start Date',
                                key: 'offer_start_date',
                                width: 40
                            },
                            {
                                header: 'Offer End Date',
                                key: 'offer_end_date',
                                width: 40
                            },
                            {
                                header: 'Booked Date',
                                key: 'timestamp',
                                style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                                width: 50
                            },
                            {
                                header: 'Offer Valit Till',
                                key: 'valid_till',
                                width: 40
                            },
                        ];
                        async.forEachSeries(attendeelist, (attendee, next_attendee) => {
                            let obj = {
                                invoice_no : attendee.invoice_no,
                                attendee_name : attendee.userid.name,
                                offer_title : offlineOfferData.offer_title,
                                shop_name : attendee.shopid.shop_name,
                                status : 'Booked',
                                offer_start_date : offlineOfferData.start_date,
                                offer_end_date : offlineOfferData.end_date,
                                timestamp : new Date(attendee.timestamp + 19800000),
                                valid_till :  offlineOfferData.end_date
                            };
                            sheet1.addRow(obj);
                            next_attendee();
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
                        return responseManager.badrequest({ message: 'Invalid shop id to get offline offer data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid shop id to get offline offer attendees list, please try again' }, res);
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