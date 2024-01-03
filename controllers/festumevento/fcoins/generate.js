const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const AwsCloud = require('../../../utilities/aws');
const config = require('../../../utilities/config');
const allowedContentTypes = require('../../../utilities/content-types');
const adminModel = require('../../../models/superadmin/admins.model');
const fcoinintransactionsModel = require('../../../models/festumevento/fcoinintransactions.model');
const fcoinsModel = require('../../../models/festumevento/fcoins.model');
const mongoose = require('mongoose');
exports.generatefcoinbalance = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && req.token.superadminid != '' && req.token.superadminid != null && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.superadminid).lean();
        if(admindata){
            let havePermission = await config.getPermission(admindata.roleId, "fcoinintransactions", "insertUpdate", "festumevento", primary);
            if (havePermission) {
                let festumeventoDB = mongoConnection.useDb(constants.FESTUMEVENTO_DB);
                if(((req.body.transaction_reference_id && req.body.transaction_reference_id.trim() != '') || (req.body.chequeno && req.body.chequeno.trim() != '')) && req.body.amount && !isNaN(req.body.amount) && parseFloat(req.body.amount) > 0){
                    if (req.file) {
                        if (allowedContentTypes.imagedocarray.includes(req.file.mimetype)) {
                            let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                            if (filesizeinMb <= 10) {
                                AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'generatecoin').then((result) => {
                                    ( async () => {
                                        if(result && result.data && result.data.Key){
                                            let obj = {
                                                transaction_reference_id : (req.body.transaction_reference_id.trim()) ? req.body.transaction_reference_id.trim() : '',
                                                chequeno : (req.body.chequeno.trim()) ? req.body.chequeno.trim() : '',
                                                bank_name : (req.body.bank_name.trim()) ? req.body.bank_name.trim() : '',
                                                ifsc_code : (req.body.ifsc_code.trim()) ? req.body.ifsc_code.trim() : '',
                                                amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(req.body.amount) : 0,
                                                coin_amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(parseFloat(req.body.amount) * 25) : 0,
                                                description : (req.body.description.trim()) ? req.body.description.trim() : '',
                                                notes : (req.body.notes.trim()) ? req.body.notes.trim() : '',
                                                document_file : result.data.Key,
                                                timestamp : Date.now(),
                                                createdBy : new mongoose.Types.ObjectId(req.token.superadminid)
                                            };
                                            let currentCoins = await festumeventoDB.model(constants.FE_MODELS.fcoins, fcoinsModel).find({}).lean();
                                            if(currentCoins && currentCoins.length > 0){
                                                let newCoin = parseFloat(parseFloat(currentCoins[0].fcoins) + parseFloat(parseFloat(req.body.amount) * 25));
                                                await festumeventoDB.model(constants.FE_MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoins[0]._id, {fcoins : newCoin});
                                                let insertedData = await festumeventoDB.model(constants.FE_MODELS.fcoinintransactions, fcoinintransactionsModel).create(obj);
                                                return responseManager.onSuccess('F-coin added successfully!', insertedData, res);
                                            }else{
                                                return responseManager.badrequest({ message: 'Something went wrong no coin found to update Sorry, Try again' }, res);
                                            }                                        
                                        }else{
                                            return responseManager.badrequest({ message: 'Document file must be <= 10 MB, please try again' }, res);
                                        }
                                    })().catch((error) => {
                                        return responseManager.onError(error, res);
                                    });
                                }).catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            }else{
                                return responseManager.badrequest({ message: 'Document file must be <= 10 MB, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Invalid file type only Document / Image files allowed, please try again' }, res);
                        }
                    }else{
                        let obj = {
                            transaction_reference_id : (req.body.transaction_reference_id.trim()) ? req.body.transaction_reference_id.trim() : '',
                            chequeno : (req.body.chequeno.trim()) ? req.body.chequeno.trim() : '',
                            bank_name : (req.body.bank_name.trim()) ? req.body.bank_name.trim() : '',
                            ifsc_code : (req.body.ifsc_code.trim()) ? req.body.ifsc_code.trim() : '',
                            amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(req.body.amount) : 0,
                            coin_amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(parseFloat(req.body.amount) * 25) : 0,
                            description : (req.body.description.trim()) ? req.body.description.trim() : '',
                            notes : (req.body.notes.trim()) ? req.body.notes.trim() : '',
                            document_file : '',
                            timestamp : Date.now(),
                            createdBy : new mongoose.Types.ObjectId(req.token.superadminid)
                        };
                        let currentCoins = await festumeventoDB.model(constants.FE_MODELS.fcoins, fcoinsModel).find({}).lean();
                        if(currentCoins && currentCoins.length > 0){
                            let newCoin = parseFloat(parseFloat(currentCoins[0].fcoins) + parseFloat(parseFloat(req.body.amount) * 25));
                            await festumeventoDB.model(constants.FE_MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoins[0]._id, {fcoins : newCoin});
                            let insertedData = await festumeventoDB.model(constants.FE_MODELS.fcoinintransactions, fcoinintransactionsModel).create(obj);
                            return responseManager.onSuccess('F-coin added successfully!', insertedData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Something went wrong no coin found to update Sorry, Try again' }, res);
                        }
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid transaction or reference id or cheque no or amount to generate coin, please try again' }, res);
                }
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