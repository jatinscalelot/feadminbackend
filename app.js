const dotenv = require('dotenv').config();
const cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
let mongoose = require("mongoose");
var CronJob = require('cron').CronJob;
var expressLayouts = require('express-ejs-layouts');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));
app.use(cors());
mongoose.set('runValidators', true);
mongoose.set('strictQuery', false);
// useNewUrlParser: true,
// useUnifiedTopology: true
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.once('open', () => {
  console.log("Well done! , connected with mongoDB database");
}).on('error', error => {
  console.log("Oops! database connection error:" + error);
});
const superadminpaths = [
  { pathUrl: '/', routeFile: 'login' },
  { pathUrl: '/roles', routeFile: 'roles' },
  { pathUrl: '/admins', routeFile: 'admins' },
  { pathUrl: '/profile', routeFile: 'profile' },
  { pathUrl: '/projects', routeFile: 'projects' }
];
const festumeventopaths = [ 
  { pathUrl: '/agent', routeFile: 'agent' },
  { pathUrl: '/event', routeFile: 'event' },
  { pathUrl: '/eventcategories', routeFile: 'eventcategories' },
  { pathUrl: '/eventcoupon', routeFile: 'eventcoupon' },
  { pathUrl: '/eventdiscount', routeFile: 'eventdiscount' },
  { pathUrl: '/fcoin', routeFile: 'fcoin' },
  { pathUrl: '/seatingitem', routeFile: 'item' },
  { pathUrl: '/livestream', routeFile: 'livestream' },
  { pathUrl: '/offlineshop', routeFile: 'offlineshop' },
  { pathUrl: '/offlineoffer', routeFile: 'offlineoffer' },
  { pathUrl: '/onlineoffer', routeFile: 'onlineoffer' },
  { pathUrl: '/organizer', routeFile: 'organizer' },
  { pathUrl: '/onlineplatform', routeFile: 'platform' },
  { pathUrl: '/promotioncoupon', routeFile: 'promotioncoupons' },
  { pathUrl: '/globalsetting', routeFile: 'setting' },
  { pathUrl: '/shopcategories', routeFile: 'shopcategories' },
  { pathUrl: '/user', routeFile: 'user' },
];
superadminpaths.forEach((path) => {
  app.use('/admin' + path.pathUrl, require('./routes/superadmin/' + path.routeFile));
});
festumeventopaths.forEach((path) => {
  app.use('/festumevento' + path.pathUrl, require('./routes/festumevento/' + path.routeFile));
});
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
