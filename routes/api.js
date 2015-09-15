/**
 * Created by jaric on 09.07.2015.
 */

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

function isValidFile(filename){
    var filenameNorm = filename.toLowerCase();
    if (filenameNorm.indexOf('mp4') != -1 ||

        filenameNorm.indexOf('img') != -1 ||

        filenameNorm.indexOf('avi') != -1 ||
        filenameNorm.indexOf('mkv') != -1 ||
        filenameNorm.indexOf('srt') != -1 ||

        filenameNorm.indexOf('pdf') != -1 ||
        filenameNorm.indexOf('zip') != -1 ||
        filenameNorm.indexOf('jpg') != -1 ||
        filenameNorm.indexOf('png') != -1
    ) return true;
    return false;
}

router.get('/videos', function(req, res, next) {

    var sharedPath = req.app.sharedFolder;

    fs.readdir(sharedPath, function(err, foldersAndFiles){
        if (!foldersAndFiles){
            foldersAndFiles = [];
        }
        //console.log(foldersAndFiles);

        var files = [];
        var folders = [];
        var sizes = [];

        // TODO do fucking recursion, isn't that hard :S
        _.forEach(foldersAndFiles, function(pathname){
            var subPath = path.join(sharedPath, pathname);
            var stats = fs.lstatSync(subPath);

            if (stats.isDirectory()){
                var folder = pathname;
                folders.push(folder);
                var subFiles = fs.readdirSync(sharedPath + '/' + folder);
                _.forEach(subFiles, function(subFileName){
                    if (isValidFile(subFileName)){
                        files.push(folder + "/" + subFileName);
                        sizes.push(stats.size);
                        //console.log(subFileName, stats);
                    }
                });
            } else {
                if (isValidFile(pathname)) {
                    files.push(pathname);
                    sizes.push(stats.size);
                }
            }
        });

        var ans = {
            folders: folders,
            files: files,
            sizes: sizes
        };
        //console.log(ans);
        res.send(ans);
    });
});

router.get('/files', function(req, res, next){
    var sharedFolder = req.app.sharedFolder;

    readFolderRecursive(sharedFolder, 0, function(err, data){
        if (err) throw err;

        res.send(data);
    });
});

var async = require('async');
function readFolderRecursive(item, level, cb) {
    level = typeof level !== 'undefined' ? level : 0;

    var recursionData = {};

    recursionData.statistics = {};
    recursionData.statistics.timestamp = new Date().getTime();

    var allObjects = [];

    var allFiles = [];

    recursionData.allFiles = allFiles;
    recursionData.allObjects = allObjects;

    if (level > 2) {
        cb(null, recursionData);
        return;
    }

    // fs.lstat
    fs.stat(item, function(err, stats) {
        if (err) throw err;

        var objType;

        var currentObj = {
            path: item
            //, stats: stats
        };

        if (!err && stats.isDirectory()) {

            objType = 'folder';
            currentObj.type = objType;
            currentObj.children = [];
            allObjects.push(currentObj);

            fs.readdir(item, function(err, list) {
                if (err) return cb(err);

                async.forEach(
                    list,
                    function(diritem, callback) {
                        readFolderRecursive(path.join(item, diritem), level+1, function(err, data) {

                            //console.log('mf', data.allFiles);
                            for (var someFile in data.allFiles){
                                if (data.allFiles.hasOwnProperty(someFile)){
                                    allFiles.push(data.allFiles[someFile]);
                                }
                            }
                            //console.log('af', data.allFiles);

                            for (var someObject in data.allObjects){
                                if (data.allObjects.hasOwnProperty(someObject)){
                                    currentObj.children.push(data.allObjects[someObject]);
                                }
                            }

                            callback(err);
                        });
                    },
                    function(err) {

                        if (level == 0){
                            recursionData.statistics.timestamp = (new Date().getTime()) - recursionData.statistics.timestamp;
                            console.log(recursionData.statistics.timestamp, 'msec');
                        }

                        cb(err, recursionData);
                    }
                );
            });

        }
        else {
            objType = 'file';
            currentObj.type = objType;

            if (isValidFile(item)){
                allObjects.push(currentObj);

                allFiles.push({
                    path: item
                    //, stats: stats
                    , type: objType
                });
            }

            cb(err, recursionData);
        }
    });
}

readFolderRecursive(path.join('x:', '1'), 0, function(err, data){
    //for (var index in lotsOfFiles){
    //    console.log(index, lotsOfFiles[index]);
    //}
    //console.log(JSON.stringify(lotsOfObjects));
});

//http://stackoverflow.com/a/7550430
//var fs = require('fs'),
//    path = require('path'),
//    async = require('async');
//
//function readSizeRecursive(item, cb) {
//    fs.lstat(item, function(err, stats) {
//        if (!err && stats.isDirectory()) {
//            var total = stats.size;
//
//            fs.readdir(item, function(err, list) {
//                if (err) return cb(err);
//
//                async.forEach(
//                    list,
//                    function(diritem, callback) {
//                        readSizeRecursive(path.join(item, diritem), function(err, size) {
//                            total += size;
//                            callback(err);
//                        });
//                    },
//                    function(err) {
//                        cb(err, total);
//                    }
//                );
//            });
//        }
//        else {
//            cb(err);
//        }
//    });
//}

module.exports = router;
