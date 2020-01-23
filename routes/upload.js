/**
 * Created by jaric on 25.12.2018.
 */

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');

var multer = require('multer');
var multerDownloadFolder = path.join(__dirname, '..', 'uploads');
var multerUpload = multer({ dest: multerDownloadFolder });

router.post('/:name', multerUpload.single('zipped'), function(req, res){    // "zipped" is a formData field name
//}, multerUpload.fields([{name: 'zipped', maxCount: 1}]), function(req, res){
    if (req.file) {
        console.dir(req.file);

        var sharedFolder = req.app.sharedFolder;

        var recentFilePath = path.join(multerDownloadFolder, req.file.filename);

        var name = req.params.name;
        var date = currentDateToStr();
        console.log("date:", date);

        var pathToFile = path.join(sharedFolder, name);
        copyFileTo(
            recentFilePath,
            pathToFile,
            { replace: true },
            function(){
                fs.unlink(recentFilePath, noop);
            }
        );

        return res.end('Thank you for the file');
    }
    res.end('Missing file');
});

function currentDateToStr(){
    // it is better to use server local time. The reason why is time=d.toLocalTimeString() so it might be a new day (by time) and old day by UTC
    var d = new Date();
    //var year = d.getUTCFullYear().toString();
    var year = d.getFullYear().toString();
    //var month = d.getUTCMonth()+1;  // months are counted from 0
    var month = d.getMonth()+1;  // months are counted from 0
    if (month < 10) month = "0" + month;
    //var day = d.getUTCDate();
    var day = d.getDate();
    if (day < 10) day = "0" + day;
    var time = d.toLocaleTimeString();
    time = replaceAll(time, ":", "");
    return year + month + day + time;
}

function copyFileTo(src, dst, options, callback){
    var mkdirp = require('mkdirp');

    var srcPath = src;
    var dstPath = dst;

    var dstDir = path.dirname(dstPath);
    mkdirp(dstDir, function(err){
        if (err) throw err;

        fscopy(srcPath, dstPath, options, function (err) {
            if (err) throw err;
            console.log("Copied", srcPath, "to", dstPath);
            callback();
        });
    });
}
function fscopy(src, dst, opts, cb) {
    // modified from https://github.com/coolaj86/utile-fs/blob/master/fs.extra/fs.copy.js
    if ('function' === typeof opts) {
        cb = opts;
        opts = null;
    }
    opts = opts || {};

    function copyHelper(err) {
        var is
            , os
            ;
        if (!err && !(opts.replace || opts.overwrite)) {
            return cb(new Error("File " + dst + " exists."));
        }
        fs.stat(src, function (err, stat) {
            if (err) {
                return cb(err);
            }
            is = fs.createReadStream(src);
            os = fs.createWriteStream(dst);

            is.pipe(os);
            os.on('close', function (err) {
                if (err) {
                    return cb(err);
                }
                fs.utimes(dst, stat.atime, stat.mtime, cb);
            });
        });
    }
    cb = cb || noop;
    fs.stat(dst, copyHelper);
}
function noop(){};


module.exports = router;