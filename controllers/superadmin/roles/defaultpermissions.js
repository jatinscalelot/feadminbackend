const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const adminModel = require('../../../models/superadmin/admins.model');
const config = require('../../../utilities/config');
const mongoose = require('mongoose');
const async = require('async');
exports.getdefaultpermissions = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "roles", "view", "superadmin", primary);
            if (havePermission) {
                let permissions = {
                    superadmin : [],
                    festumevento : [],
                    eventopackage : [],
                    festumfield : [],
                    festumcoin : [],
                    festumadvertisingmedia : []
                };
                async.forEachSeries(config.SuperadminCollections, (sapermissions, next_sapermissions) => {
                    let obj = {
                        "displayname" : sapermissions.text,
                        "collectionName" : sapermissions.value,
                        "insertUpdate" : false,
                        "delete" : false,
                        "view" : false
                    };
                    permissions.superadmin.push(obj);
                    next_sapermissions();
                }, () => {
                    async.forEachSeries(config.FestumeventoCollections, (fepermissions, next_fepermissions) => {
                        let obj = {
                            "displayname" : fepermissions.text,
                            "collectionName" : fepermissions.value,
                            "insertUpdate" : false,
                            "delete" : false,
                            "view" : false
                        };
                        permissions.festumevento.push(obj);
                        next_fepermissions();
                    }, () => {
                        async.forEachSeries(config.EventopackageCollections, (eppermissions, next_eppermissions) => {
                            let obj = {
                                "displayname" : eppermissions.text,
                                "collectionName" : eppermissions.value,
                                "insertUpdate" : false,
                                "delete" : false,
                                "view" : false
                            };
                            permissions.eventopackage.push(obj);
                            next_eppermissions();
                        }, () => {
                            async.forEachSeries(config.FestumfieldCollections, (ffpermissions, next_ffpermissions) => {
                                let obj = {
                                    "displayname" : ffpermissions.text,
                                    "collectionName" : ffpermissions.value,
                                    "insertUpdate" : false,
                                    "delete" : false,
                                    "view" : false
                                };
                                permissions.festumfield.push(obj);
                                next_ffpermissions();
                            }, () => {
                                async.forEachSeries(config.FestumcoinCollections, (fcpermissions, next_fcpermissions) => {
                                    let obj = {
                                        "displayname" : fcpermissions.text,
                                        "collectionName" : fcpermissions.value,
                                        "insertUpdate" : false,
                                        "delete" : false,
                                        "view" : false
                                    };
                                    permissions.festumcoin.push(obj);
                                    next_fcpermissions();
                                }, () => {
                                    async.forEachSeries(config.FestumadvertisingmediaCollections, (fampermissions, next_fampermissions) => {
                                        let obj = {
                                            "displayname" : fampermissions.text,
                                            "collectionName" : fampermissions.value,
                                            "insertUpdate" : false,
                                            "delete" : false,
                                            "view" : false
                                        };
                                        permissions.festumadvertisingmedia.push(obj);
                                        next_fampermissions();
                                    }, () => {
                                        return responseManager.onSuccess('Default Permission', {permissions : permissions}, res);
                                    });
                                });
                            });
                        });
                    });
                });
            }else{
                return responseManager.forbiddenRequest(res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};