let mongoose = require('mongoose');
let mongoDB = mongoose.createConnection(process.env.MONGO_URI);
module.exports = mongoDB;
// , {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }