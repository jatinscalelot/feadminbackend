const _ = require("lodash");
const constants = require('./constants');
var roleModel = require('../models/superadmin/roles.model');
let FestumeventoCollections = [
    { text: 'Agents', value: 'agents' },
    { text: 'Events', value: 'events' },
    { text: 'Events Wishlists', value: 'eventwishlists' },
    { text: 'Event Reviews', value: 'eventreviews' },
    { text: 'Event Categories', value: 'eventcategories' },
    { text: 'Event Discounts', value: 'discounts' },
    { text: 'Event Booking Coupons', value: 'eventbookingcoupons' },
    { text: 'Event Bookings', value: 'eventbookings' },
    { text: 'Entertainment Comments', value: 'entertainmentcomments' },
    { text: 'Email Templates', value: 'emailtemplates' },
    { text: 'Excel Customers', value: 'customerimports' },
    { text: 'Fcoins', value: 'fcoins' },
    { text: 'Fcoin Transactions', value: 'fcointransactions' },
    { text: 'Fcoin In Transactions', value: 'fcoinintransactions' },
    { text: 'Global settings', value: 'settings' },
    { text: 'Get In Touches', value: 'getintouches' },
    { text: 'Livestreams', value: 'livestreams' },
    { text: 'Livestream Reviews', value: 'livestreamreviews' },
    { text: 'Livestream Wishlists', value: 'livestreamwishlists' },
    { text: 'Livestream Bookings', value: 'livestreambookings' },
    { text: 'Livestream Views', value: 'livestreamviews' },
    { text: 'Notifications', value: 'notifications' },
    { text: 'Organizers', value: 'organizers' },
    { text: 'Organiser Notifications', value: 'organisernotifications' },
    { text: 'Organiser Chat Notifications', value: 'organiserchatnotifications' },
    { text: 'Offline Shops', value: 'shops' },
    { text: 'Offline Offers', value: 'offers' },
    { text: 'Offline Offer Bookings', value: 'offlineofferbookings' },
    { text: 'Offline Shops Reviews', value: 'shopreviews' },
    { text: 'Offline Offer Wishlists', value: 'offlineofferwishlists' },
    { text: 'Online Offers', value: 'onlineoffers' },
    { text: 'Online Platforms', value: 'platforms' },
    { text: 'Online Offer Views', value: 'onlineofferviews' },
    { text: 'Online Offer Reviews', value: 'onlineofferreviews' },
    { text: 'Online Offer Wishlists', value: 'onlineofferwishlists' },
    { text: 'Online Offer Clicks', value: 'offerclicks' },
    { text: 'Promotion Coupons', value: 'notificationcoupons' },
    { text: 'Promotion Plans', value: 'promotionplans' },
    { text: 'Seating Items', value: 'items' },
    { text: 'Shop Categories', value: 'shopcategories' },
    { text: 'Subscriptions', value: 'subscriptions' },
    { text: 'Short Links', value: 'links' },
    { text: 'Shop Wishlists', value: 'shopwishlists' },
    { text: 'SMS Templates', value: 'smstemplates' },
    { text: 'Users', value: 'users' },
    { text: 'User Notifications', value: 'usernotifications' },
    { text: 'User Chat Notifications', value: 'userchatnotifications' },
    { text: 'User Organiser Chat', value: 'uochats' }
];
let EventopackageCollections = [
    { text: 'Agents', value: 'agents' },
    { text: 'Categories', value: 'categories' },
    { text: 'Discounts', value: 'discounts' },
    { text: 'Events', value: 'events' },
    { text: 'Event Reviews', value: 'eventreviews' },
    { text: 'Event Bookings', value: 'eventbookings' },
    { text: 'Event Wishlists', value: 'eventwishlists' },
    { text: 'Event Booking Coupons', value: 'eventbookingcoupons' },
    { text: 'Equipments', value: 'equipments' },
    { text: 'Entertainment Comments', value: 'entertainmentcomments' },
    { text: 'Excel Customers', value: 'customerimports' },
    { text: 'Fcoins', value: 'fcoins' },
    { text: 'Fcoin Transactions', value: 'fcointransactions' },
    { text: 'Fcoin In Transactions', value: 'fcoinintransactions' },
    { text: 'Global Settings', value: 'settings' },
    { text: 'Get In Touches', value: 'getintouches' },
    { text: 'Items', value: 'items' },
    { text: 'Notifications', value: 'notifications' },
    { text: 'Notification Coupons', value: 'notificationcoupons' },
    { text: 'Organizers', value: 'organizers' },
    { text: 'Our Products', value: 'ourproduct' },
    { text: 'Promotion Plans', value: 'promotionplans' },
    { text: 'Services', value: 'services' },
    { text: 'Users', value: 'users' }
];
let SuperadminCollections = [
    { text: 'Admin Users', value: 'admins' },
    { text: 'Roles', value: 'roles' },
];
let FestumcoinCollections = [];
let FestumadvertisingmediaCollections = [];
let FestumfieldCollections = [];
async function getPermission(roleID, modelName, permissionType, permissionfor, database) {
    let results = await database.model(constants.MODELS.roles, roleModel).find({ roleId: roleID }).lean();
    if (results.length == 1 && results[0] && results[0].status && results[0].status == true) {
        let finalpermission = []; 
        if (permissionfor == 'superadmin') {
            finalpermission = _.filter(results[0].permissions.superadmin, { 'collectionName': modelName });
        } else if (permissionfor == 'festumevento') {
            finalpermission = _.filter(results[0].permissions.festumevento, { 'collectionName': modelName });
        } else if (permissionfor == 'eventopackage') {
            finalpermission = _.filter(results[0].permissions.eventopackage, { 'collectionName': modelName });
        } else if (permissionfor == 'festumfield') {
            finalpermission = _.filter(results[0].permissions.festumfield, { 'collectionName': modelName });
        } else if (permissionfor == 'festumcoin') {
            finalpermission = _.filter(results[0].permissions.festumcoin, { 'collectionName': modelName });
        } else if (permissionfor == 'festumadvertisingmedia') {
            finalpermission = _.filter(results[0].permissions.festumadvertisingmedia, { 'collectionName': modelName });
        } else {
            return false;
        }
        console.log('finalpermission', finalpermission);
        if (finalpermission.length == 1) {
            if (permissionType == "view") {
                if (finalpermission[0].view == true)
                    return true;
                else
                    return false;
            }
            if (permissionType == "insertUpdate") {
                if (finalpermission[0].insertUpdate == true)
                    return true;
                else
                    return false;
            }
            if (permissionType == "delete") {
                if (finalpermission[0].delete == true)
                    return true;
                else
                    return false;
            }
            return false;
        } else{
            return false;
        }
    } else {
        return false;
    }
};
module.exports = { getPermission, FestumeventoCollections, EventopackageCollections, FestumcoinCollections, FestumadvertisingmediaCollections, FestumfieldCollections, SuperadminCollections };