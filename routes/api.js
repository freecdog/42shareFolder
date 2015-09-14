/**
 * Created by jaric on 09.07.2015.
 */

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

function isFile(filename){
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
                    if (isFile(subFileName)){
                        files.push(folder + "/" + subFileName);
                        sizes.push(stats.size);
                        console.log(subFileName, stats);
                    }
                });
            } else {
                if (isFile(pathname)) {
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

var async = require('async');
function readFolderRecursive(item, level, cb) {
    level = typeof level !== 'undefined' ? level : 0;

    var allObjects = [];
    var objType;

    var allFiles = [];

    if (level > 3) {
        cb(null, allFiles, allObjects);
        return;
    }

    var currentObj = {
        path: item
        //, stats: stats
    };
    allObjects.push(currentObj);

    // fs.lstat
    fs.stat(item, function(err, stats) {

        if (!err && stats.isDirectory()) {

            objType = 'folder';
            currentObj.type = objType;
            currentObj.children = [];

            fs.readdir(item, function(err, list) {
                if (err) return cb(err);

                async.forEach(
                    list,
                    function(diritem, callback) {
                        readFolderRecursive(path.join(item, diritem), level+1, function(err, manyFiles, manyObjects) {

                            //console.log('mf', manyFiles);
                            for (var someFile in manyFiles){
                                if (manyFiles.hasOwnProperty(someFile)){
                                    allFiles.push(manyFiles[someFile]);
                                }
                            }
                            //console.log('af', allFiles);

                            for (var someObject in manyObjects){
                                if (manyObjects.hasOwnProperty(someObject)){
                                    currentObj.children.push(manyObjects[someObject]);
                                }
                            }

                            callback(err);
                        });
                    },
                    function(err) {
                        //console.log('aaff', level, allFiles);
                        cb(err, allFiles, allObjects);
                    }
                );
            });

        }
        else {
            objType = 'file';
            currentObj.type = objType;

            allFiles.push({
                path: item
                //, stats: stats
                , type: objType
            });
            cb(err, allFiles, allObjects);
        }
    });
}
var timeStamp = (new Date()).getTime();
readFolderRecursive(path.join('x:', '1'), 0, function(err, lotsOfFiles, lotsOfObjects){

    //for (var index in lotsOfFiles){
    //    console.log(index, lotsOfFiles[index]);
    //}
    //console.log(JSON.stringify(lotsOfObjects));

    console.log( ((new Date()).getTime() - timeStamp), 'msec' );
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
