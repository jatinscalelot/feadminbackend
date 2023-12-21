let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const subscriptionModel = require('../../models/subscriptions.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let totalsubscriptions = parseInt(await primary.model(constants.MODELS.subscriptions, subscriptionModel).countDocuments({}));
            primary.model(constants.MODELS.subscriptions, subscriptionModel).paginate({
                $or: [
                    { planname : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((subscriptionslist) => {
                subscriptionslist.totalsubscriptions = totalsubscriptions;
                return responseManager.onSuccess('Subscriptions list!', subscriptionslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get subscriptions list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { subscriptionid, planname, description, userlimitation, price, no_of_events, max_days, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(subscriptionid && subscriptionid != '' && mongoose.Types.ObjectId.isValid(subscriptionid)){
                let existingsubscription = await primary.model(constants.MODELS.subscriptions, subscriptionModel).findOne({_id : {$ne : subscriptionid}, planname : planname}).lean();
                if(existingsubscription == null){
                    if(planname && planname.trim() != ''){
                        if(!isNaN(userlimitation) && parseInt(userlimitation) > 0){
                            if(!isNaN(price) && parseFloat(price) > 0){
                                if(!isNaN(no_of_events) && parseInt(no_of_events) > 0){
                                    if(!isNaN(max_days) && parseInt(max_days) > 0){
                                        let obj = {
                                            planname : planname,
                                            description : description,
                                            userlimitation : parseInt(userlimitation),
                                            price: price,
                                            no_of_events: no_of_events,
                                            max_days: max_days,
                                            status: status,
                                            updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                                        };
                                        await primary.model(constants.MODELS.subscriptions, subscriptionModel).findByIdAndUpdate(subscriptionid, obj);
                                        let updatedData = await primary.model(constants.MODELS.subscriptions, subscriptionModel).findById(subscriptionid).lean();
                                        return responseManager.onSuccess('Subscription updated sucecssfully!', updatedData, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Maximum nuber of days can not be <= 0, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Number of events can not be <= 0, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Price can not be <= 0, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'User limitation can not be <= 0, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Plan name can not be empty, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'subscription name can not be identical, please try again' }, res);
                }
            }else{
                let existingsubscription = await primary.model(constants.MODELS.subscriptions, subscriptionModel).findOne({planname : planname}).lean();
                if(existingsubscription == null) {
                    if(planname && planname.trim() != ''){
                        if(!isNaN(userlimitation) && parseInt(userlimitation) > 0){
                            if(!isNaN(price) && parseFloat(price) > 0){
                                if(!isNaN(no_of_events) && parseInt(no_of_events) > 0){
                                    if(!isNaN(max_days) && parseInt(max_days) > 0){
                                        let obj = {
                                            planname : planname,
                                            description : description,
                                            userlimitation : parseInt(userlimitation),
                                            price: price,
                                            no_of_events: no_of_events,
                                            max_days: max_days,
                                            status: status,
                                            createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                                            updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                                        };
                                        let insertedData = await primary.model(constants.MODELS.subscriptions, subscriptionModel).create(obj);
                                        return responseManager.onSuccess('Subscription created sucecssfully!', insertedData, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Maximum nuber of days can not be <= 0, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Number of events can not be <= 0, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Price can not be <= 0, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'User limitation can not be <= 0, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Plan name can not be empty, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'subscriptions plan name can not be identical, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to create or update subscription, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to create or update subscription, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.subscriptions, subscriptionModel).find({}).then((subscriptionlist) => {
                return responseManager.onSuccess('subscription list!', subscriptionlist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get subscription list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { subscriptionid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if( subscriptionid && subscriptionid != '' && mongoose.Types.ObjectId.isValid(subscriptionid)){
                let subscriptionData = await primary.model(constants.MODELS.subscriptions, subscriptionModel).findById(subscriptionid);
                return responseManager.onSuccess('subscription data!', subscriptionData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid subscription id to get subscription data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get subscription data, please try again' }, res);
    }
});
module.exports = router;