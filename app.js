var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var api = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.sharedFolder = path.join('X:', '1');

//app.use(express.static( app.sharedFolder ));
checkPathArgv(function(err, argPath){
    if (!err){
        console.log('applied path from Argv:', argPath.path);
        app.sharedFolder = argPath.path;
    }
    app.use(express.static( app.sharedFolder ));
});

function checkPathArgv(callback){
    callback = callback || function(){};
    //console.log(process.argv);

    var argPath = {pathInArgv: false};
    //app.argPath = argPath;

    var pathIndexInArgv = process.argv.indexOf("--path");
    if (pathIndexInArgv != -1) {
        var fs = require('fs');

        var pathToCheck = process.argv[pathIndexInArgv + 1];

        if (pathToCheck !== undefined){
            //var rec = path.parse(pathToCheck);
            //pathToCheck = path.join(rec.dir, rec.base);
            pathToCheck = path.normalize(pathToCheck);

            // TODO using ExistsSync because it seems that express.static is not applied in parallel mode
            // fileExist is deprecated, fileExistSync is not, fs.access is recommended
            if (fs.existsSync(pathToCheck)) {
                argPath = {
                    pathInArgv: true,
                    path: pathToCheck
                };
                callback(null, argPath);
            } else {
                callback({message: pathToCheck + ' not exist'}, null);
            }
            //fs.open(pathToCheck, 'r', function(err, fd){
            //    if (err) {
            //        if (err.code === 'ENOENT') {
            //            console.error(pathToCheck, 'does not exist');
            //            //return;
            //        }
            //        //throw err;
            //        callback(err, null);
            //    } else {
            //        argPath = {
            //            pathInArgv: true,
            //            path: pathToCheck
            //        };
            //        //console.log(argPath);
            //        callback(null, argPath);
            //    }
            //});
        } else {
            callback({message: 'no path given'});
        }
    } else {
        callback({message: 'no --path argument'});
    }
}

app.use('/', routes);
app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
