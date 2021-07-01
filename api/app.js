import mongoose from 'mongoose'
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var registerRouter = require("./routes/register");
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var checkTokenRouter = require('./routes/checkToken')
var connectDriveRouter = require('./routes/connectDrive')
var authenticateDriveRouter = require('./routes/authenticateDrive')
var getFilesRouter = require('./routes/getFiles')
var deleteFileRouter = require('./routes/deleteFile')
var deleteDriveRouter = require('./routes/deleteDrive')
var renameFileRouter = require('./routes/renameFile')
var getAccessTokenRouter = require('./routes/getAccessToken')
var shareFileRouter = require('./routes/shareFile')
var createFolderRouter = require('./routes/createFolder')
var driveModeRouter = require('./routes/driveMode')
var getIdealDriveRouter = require('./routes/getIdealDrive')
var uploadVirtualRouter = require('./routes/uploadVirtual')
var getVirtualQuotaRouter = require('./routes/getVirtualQuota')
var getSharedFileLinkRouter = require('./routes/getSharedFileLink')
var getUserSharedFolderIdRouter = require('./routes/getUserSharedFolderId')

require('dotenv').config()

var corsOptions = {
    origin: ['http://localhost:3000', 'http://192.168.1.4:3000'],
    credentials: true
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors(corsOptions))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
/* app.get('*', (req, res) => {
    res.sendFile(path.join(path.join(__dirname, 'public'), 'index.html'));
 }); */


app.use('/', registerRouter);
app.use('/', loginRouter);
app.use('/', logoutRouter);
app.use('/', checkTokenRouter)
app.use('/', connectDriveRouter)
app.use('/', authenticateDriveRouter)
app.use('/', getFilesRouter)
app.use('/', deleteFileRouter)
app.use('/', renameFileRouter)
app.use('/', deleteDriveRouter)
app.use('/', getAccessTokenRouter)
app.use('/', shareFileRouter.router)
app.use('/', createFolderRouter)
app.use('/', driveModeRouter)
app.use('/', getIdealDriveRouter)
app.use('/', uploadVirtualRouter)
app.use('/', getVirtualQuotaRouter)
app.use('/', getSharedFileLinkRouter)
app.use('/', getUserSharedFolderIdRouter)

/* app.get('/api/passes', (req, res) => {
    res.status(500)
}) */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


const connectionString = process.env.MONGODB_CONNECTION_URI
/* console.log(connectionString) */
mongoose.set('useCreateIndex', true);//removes a mongoose warning during compile
mongoose.set('useFindAndModify', false);
mongoose.connect(connectionString,{useNewUrlParser: true, useUnifiedTopology: true}, function(err) {
    if (err) {
        throw err;
    } else {
        console.log('Successfully connected to atlas-mongo');
        console.log('Server is now running...')
    }
});

module.exports = app;