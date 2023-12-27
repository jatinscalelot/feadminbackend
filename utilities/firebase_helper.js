let admin = require('firebase-admin');
let serviceAccount = require('./firebase_organizerserviceaccount.json');
let userserviceAccount = require('./firebase_userserviceaccount.json');
const feorganizer = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const feuser = admin.initializeApp({ credential: admin.credential.cert(userserviceAccount) }, 'user');
async function sendNotificationFEOrganizer(token, payload) {
    feorganizer.messaging().sendToDevice(token, payload).then( response => {
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
async function sendNotificationFEUser(token, payload) {
    feuser.messaging().sendToDevice(token, payload).then( response => {
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
module.exports = { sendNotificationFEOrganizer, sendNotificationFEUser};