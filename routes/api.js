/**
 * Created by jaric on 09.07.2015.
 */

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');

router.get('/files', function(req, res, next){
    var sharedFolder = req.app.sharedFolder;

    var exclusions = ['!channel', '!distr', '!jnote', '0', 'Ansys', 'Call of Duty 2', 'ChessPlanet', 'CoD2 1.3', 'd2',
        'Disciples', 'domru.ru', 'HL2 EP1', 'HMM3 WoG', 'HMM375', 'HMM375WT', 'HMM5', 'INP', 'j_old_notehdd_1',
        'Need For Speed Most Wanted (2005)', 'Need For Speed Underground 2', 'Nox', 'Robin Hood game', 'Sims 3'];

    readFolderRecursive(sharedFolder, 0, exclusions, function(err, data){
        if (err) throw err;

        res.send(data);
    });
});

//http://stackoverflow.com/a/7550430
function readFolderRecursive(item, level, exclusions, cb) {
    level = typeof level !== 'undefined' ? level : 0;

    var recursionData = {};

    if (level == 0){
        recursionData.private = {};

        recursionData.private.homePath = item;
    }

    recursionData.statistics = {};
    recursionData.statistics.timestamp = new Date().getTime();

    var allObjects = [];

    var allFiles = [];

    recursionData.allFiles = allFiles;
    recursionData.allObjects = allObjects;

    function stopRecursion(){
        cb(null, recursionData);
    }

    if (level > 3) {
        stopRecursion();
        return;
    }

    var lastPartIndex = item.lastIndexOf('\\');
    var lastPart = item.substr(lastPartIndex + 1, item.length - lastPartIndex - 1);
    var isExclusion = false;
    for (var excIndex = 0; excIndex < exclusions.length; excIndex++){
        if (exclusions[excIndex] == lastPart){
            isExclusion = true;
            break;
        }
    }
    if (isExclusion == true) {
        stopRecursion();
        return;
    }

    // fs.lstat
    fs.stat(item, function(err, stats) {
        if (err) throw err;

        var objType;

        var currentObj = {
            path: item
            , stats: stats
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
                        readFolderRecursive(path.join(item, diritem), level+1, exclusions, function(err, data) {

                            for (var someFile in data.allFiles){
                                if (data.allFiles.hasOwnProperty(someFile)){
                                    allFiles.push(data.allFiles[someFile]);
                                }
                            }

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

                            function treeProcess(tree){
                                if (tree.hasOwnProperty('path')){
                                    tree.path = tree.path.substr(recursionData.private.homePath.length, tree.path.length - recursionData.private.homePath.length);

                                    // probably this command could be moved to client side
                                    tree.path = tree.path.replace(/\\/g, "/");
                                }
                                if (tree.hasOwnProperty('children')){
                                    for (var i = 0; i < tree.children.length; i++){
                                        treeProcess(tree.children[i]);
                                    }
                                }
                            }
                            treeProcess(recursionData.allObjects[0]);
                            for (var i = 0; i < recursionData.allFiles.length; i++){
                                treeProcess(recursionData.allFiles[i]);
                            }

                            delete recursionData.statistics;
                            delete recursionData.private;
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

function isValidFile(filename){
    var isValid = false;
    var filenameNorm = filename.toLowerCase();
    var filenameNormLen = filenameNorm.length;
    var matches = ['mp4', 'avi', 'mkv', 'srt', 'pdf', 'zip', 'jpg', 'png', 'img'];

    var filenameNorm3 = filenameNorm.substr(filenameNormLen - 3, 3);
    for (var i = 0, len = matches.length; i < len; i++){
        if (filenameNorm3 == matches[i]){
            isValid = true;
            break;
        }
    }

    return isValid;
}

//readFolderRecursive(path.join('x:', '1'), 0, function(err, data){
//    for (var index in lotsOfFiles){
//        console.log(index, lotsOfFiles[index]);
//    }
//    console.log(JSON.stringify(lotsOfObjects));
//});

module.exports = router;
