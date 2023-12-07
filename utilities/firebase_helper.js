let admin = require('firebase-admin');
let serviceAccount = require('./firebase_organizerserviceaccount.json');
let userserviceAccount = require('./firebase_userserviceaccount.json');
const organizer = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const user = admin.initializeApp({ credential: admin.credential.cert(userserviceAccount) }, 'user');
async function sendNotificationOrganizer(token, payload) {
    organizer.messaging().sendToDevice(token, payload).then( response => {
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', token, error);
            } else{
                console.log('Sucessfully sent to '+ token);
            }
        });
    }).catch(err => console.log(err));
};
async function sendNotificationUser(token, payload) {
    user.messaging().sendToDevice(token, payload).then( response => {
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', token, error);
            } else{
                console.log('Sucessfully sent to '+ token);
            }
        });
    }).catch(err => console.log(err));
};
module.exports = { sendNotificationOrganizer, sendNotificationUser};