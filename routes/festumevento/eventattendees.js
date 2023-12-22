var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const eventbookingModel = require('../../models/eventbookings.model');
const userModel = require('../../models/users.model');
const responseManager = require('../../utilities/response.manager');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const AwsCloud = require('../../utilities/aws');
const mongoose = require('mongoose');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/attendeesReport.xlsx';
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid, page, limit } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            let totalAttendance = parseInt(await primary.model(constants.MODELS.eventbookings, eventbookingModel).countDocuments({event_id: mongoose.Types.ObjectId(eventid), isQRscanned: true}));
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            if (eventData && eventData.is_approved == true && eventData.status == true && eventData.iseditable == false) {
                primary.model(constants.MODELS.eventbookings, eventbookingModel).paginate({
                    event_id: mongoose.Types.ObjectId(eventid),
                    isQRscanned: true
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id: -1 },
                    populate: { path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name email mobile profilepic" },
                    lean: true
                }).then((attendeelist) => {
                    let finalData = [];
                    async.forEachSeries(attendeelist.docs, (attendee, next_attendee) => {
                        let booked_tickets = 0;
                        async.forEachSeries(attendee.seats, (seat, next_seat) => {
                            async.forEachSeries(seat.arrangements, (arrangement, next_arrangement) => {
                                booked_tickets += parseInt(arrangement.ItemCount);
                                next_arrangement();
                            }, () => {
                                next_seat();
                            });
                        }, () => {
                            attendee.booked_tickets = booked_tickets;
                            finalData.push(attendee);
                            next_attendee();
                        });
                    }, () => {
                        attendeelist.docs = finalData;
                        attendeelist.totalAttendance = totalAttendance;
                        return responseManager.onSuccess("event booked list...", attendeelist, res);
                    });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid eventid to get event attendees list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid eventid to get event attendees list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/booked', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid, page, limit } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            let totalBookings = parseInt(await primary.model(constants.MODELS.eventbookings, eventbookingModel).countDocuments({event_id: mongoose.Types.ObjectId(eventid)}));
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            if (eventData && eventData.is_approved == true && eventData.status == true && eventData.iseditable == false) {
                primary.model(constants.MODELS.eventbookings, eventbookingModel).paginate({
                    event_id: mongoose.Types.ObjectId(eventid)
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id: -1 },
                    populate: { path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name email mobile profilepic" },
                    lean: true
                }).then((attendeelist) => {
                    let finalData = [];
                    async.forEachSeries(attendeelist.docs, (attendee, next_attendee) => {
                        let booked_tickets = 0;
                        async.forEachSeries(attendee.seats, (seat, next_seat) => {
                            async.forEachSeries(seat.arrangements, (arrangement, next_arrangement) => {
                                booked_tickets += parseInt(arrangement.ItemCount);
                                next_arrangement();
                            }, () => {
                                next_seat();
                            });
                        }, () => {
                            attendee.booked_tickets = booked_tickets;
                            finalData.push(attendee);
                            next_attendee();
                        });
                    }, () => {
                        attendeelist.docs = finalData;
                        attendeelist.totalBookings = totalBookings;
                        return responseManager.onSuccess("event booked list...", attendeelist, res);
                    });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid eventid to get event attendees list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid eventid to get event attendees list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/export', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            if (eventData && eventData.is_approved == true && eventData.status == true && eventData.iseditable == false) {
                let attendeelist = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_id: mongoose.Types.ObjectId(eventid), isQRscanned: true }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name email mobile" }).lean();
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
                        header: 'Event Name',
                        key: 'event_name',
                        width: 50
                    },
                    {
                        header: 'Payment ID',
                        key: 'payment_id',
                        width: 50
                    },
                    {
                        header: 'Status',
                        key: 'status',
                        width: 30
                    },
                    {
                        header: 'Sub Total',
                        key: 'subTotal',
                        width: 40
                    },
                    {
                        header: 'Coupon Amount',
                        key: 'couponAmount',
                        width: 40
                    },
                    {
                        header: 'Final Total',
                        key: 'finalTotal',
                        width: 40
                    },
                    {
                        header: 'Discount Amount',
                        key: 'discountOnTotalBill',
                        width: 40
                    },
                    {
                        header: 'Net Paid Amount',
                        key: 'amount',
                        width: 40
                    },
                    {
                        header: 'Date Time',
                        key: 'timestamp',
                        style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                        width: 50
                    },
                    {
                        header: 'Invoice URL',
                        key: 'invoice_url',
                        width: 80
                    },
                    {
                        header: 'Total Seat Booked',
                        key: 'totalseats',
                        width: 30
                    },
                    {
                        header: 'Seat Details',
                        key: 'seatsdetails',
                        width: 100
                    }
                ];
                async.forEachSeries(attendeelist, (attendee, next_attendee) => {
                    let totalseats = 0;
                    let seatsdetails = "";
                    let obj = {
                        invoice_no: attendee.invoice_no,
                        attendee_name: attendee.userid.name,
                        event_name: eventData.name,
                        payment_id: attendee.payment_id,
                        status: attendee.status,
                        subTotal: attendee.subTotal,
                        couponAmount: attendee.couponAmount,
                        finalTotal: attendee.finalTotal,
                        discountOnTotalBill: attendee.discountOnTotalBill,
                        amount: attendee.amount,
                        timestamp: new Date(attendee.timestamp + 19800000),
                        invoice_url: process.env.AWS_BUCKET_URI + attendee.invoice,
                        totalseats: totalseats,
                        seatsdetails: seatsdetails
                    };
                    async.forEachSeries(attendee.seats, (seat, next_seat) => {
                        async.forEachSeries(seat.arrangements, (arrangement, next_arrangement) => {
                            let eqpincluded = (seat.equipment == true) ? "Included" : "Not-Included";
                            totalseats += parseInt(arrangement.ItemCount);
                            seatsdetails += " ( " + seat.seating_item.itemname + " | " + arrangement.vertical_location + " - " + arrangement.horizontal_location + " | " + arrangement.ItemCount + " | " + " FOOD - " + seat.food + " | " + " Eqp. - " + eqpincluded + " ) ";
                            next_arrangement();
                        }, () => {
                            next_seat();
                        });
                    }, () => {
                        obj.totalseats = totalseats;
                        obj.seatsdetails = seatsdetails;
                        sheet1.addRow(obj);
                        next_attendee();
                    });
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
                return responseManager.badrequest({ message: 'Invalid eventid to get event attendees export report, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid eventid to get event attendees export report, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;