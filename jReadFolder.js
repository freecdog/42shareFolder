/**
 * Created by jaric on 09.09.2019.
 */

let fs = require('fs');
let path = require('path');

let readFolder = function(folder, options, callback){
    callback = callback || function(){};

    console.log("j is here", folder);

    // let allObjects = [];
    let allAccessibleFiles = [];
    let filesTree = {};
    let scheduledItems = 1;
    let itemsCounter = 0;
    let fileTypes = [];
    let skipDirectories = [];

    let level = Number.MAX_SAFE_INTEGER;

    initVars();

    function initVars(){
        level = options.level !== undefined ? options.level : level;
        fileTypes = options.fileTypes !== undefined ? options.fileTypes : fileTypes;
        for (let i = 0; i < fileTypes.length; i++) fileTypes[i] = '.' + fileTypes[i];
        skipDirectories = options.skipDirectories !== undefined ? options.skipDirectories : skipDirectories;
    }

    console.time("readFS");
    readFS(folder, 0, filesTree, function(){

        if (fileTypes.length > 0){
            filterTree(filesTree);
            filterFiles(allAccessibleFiles);
            countValidElementsInDirectories(filesTree);
            clearEmptyDirectories(filesTree);
        }

        cutRootFolder(folder, filesTree, allAccessibleFiles);

        console.timeEnd("readFS");
        // fs.writeFile('testFilesTree.txt', JSON.stringify(filesTree, null, "\t"), function(err){if (err) throw err;});
        // fs.writeFile('testFiles.txt', JSON.stringify(allAccessibleFiles, null, "\t"), function(err){if (err) throw err;});
        // fs.writeFile('testObjects.txt', JSON.stringify(allObjects, null, "\t"), function(err){if (err) throw err;});

        // console.log(process.memoryUsage());

        callback({
            allFiles: allAccessibleFiles
            // , allObjects: allObjects
            , filesTree: filesTree
        });
    });

    function readFS(item, lvl, filesTree, callback) {

        fs.stat(item, function(err, stats) {
            let obj = {
                path: item
            };
            // allObjects.push(obj);
            filesTree.path = item;

            if (err) {
                obj.err = err;

                console.warn("stat err", item, err);
                processItem(filesTree, obj);
            } else {
                obj.stats = stats;
                obj.isDirectory = stats.isDirectory();

                let skipDir = false;
                if (obj.isDirectory) {
                    let index = obj.path.lastIndexOf(path.sep);
                    let dirName = obj.path.substr(index+1, obj.path.length - index-1);
                    for (let i = 0; i < skipDirectories.length; i++){
                        if (skipDirectories[i] === dirName) {
                            skipDir = true;
                            break;
                        }
                    }
                    if (skipDir){
                        processItem(filesTree, obj);
                        return;
                    }
                }

                if (obj.isDirectory){
                    if (lvl >= level) {
                        processItem(filesTree, obj);
                    } else {
                        fs.readdir(item, function(err, list){
                            if (err) {
                                obj.err = err;

                                console.warn("readdir err", item, err);
                                processItem(filesTree, obj);
                            } else {
                                scheduledItems += list.length;
                                filesTree.children = [];
                                for (let i = 0; i < list.length; i++){
                                    let child = {};
                                    filesTree.children.push(child);
                                    readFS(path.join(item, list[i]), lvl+1, child, callback);
                                }

                                processItem(filesTree, obj);
                            }
                        });
                    }
                } else {
                    allAccessibleFiles.push({
                        path: obj.path
                    });

                    processItem(filesTree, obj);
                }
            }
        });

        function processItem(filesTree, obj){
            extend(filesTree, obj);

            processCounter();
        }

        function processCounter(){
            itemsCounter++;
            if (itemsCounter === scheduledItems){
                callback();
            }
        }
    }

    function isValidFile(filename){
        let isValid = false;
        let filenameNorm = filename.toLowerCase();
        let filenameNormLen = filenameNorm.length;
        let matches = fileTypes;

        let filenameEnding, mLength;
        for (let i = 0, len = matches.length; i < len; i++){
            mLength = matches[i].length;
            filenameEnding = filenameNorm.substr(filenameNormLen - mLength, mLength);
            if (filenameEnding === matches[i]){
                isValid = true;
                break;
            }
        }

        return isValid;
    }

    function filterTree(node){
        if (node.children !== undefined){
            for (let i = 0; i < node.children.length; i++){
                let child = node.children[i];
                if (child.children !== undefined) {
                    filterTree(child);
                } else {
                    if (isValidFile(child.path) === false){
                        delete node.children[i];
                    }
                }
            }
            removeEmptiesFromArray(node.children);
        }
    }

    function countValidElementsInDirectories(node, parents){
        let safeStack = parents !== undefined ? parents : [];

        if (node.children !== undefined) {
            if (node.count === undefined) node.count = 0;

            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];
                if (child.children !== undefined) {
                    safeStack.push(node);
                    countValidElementsInDirectories(child, safeStack);
                    safeStack.pop();
                } else {
                    node.count++;
                    for (let j = 0; j < safeStack.length; j++) safeStack[j].count++;
                }
            }
        }
    }

    function clearEmptyDirectories(node){
        if (node.children !== undefined) {
            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];
                if (child.children !== undefined) {
                    if (child.count === 0){
                        delete node.children[i];
                    } else {
                        clearEmptyDirectories(child);
                    }
                }
            }
            removeEmptiesFromArray(node.children);
        }
    }

    function filterFiles(filesArr){
        for (let i = 0; i < filesArr.length; i++){
            if (isValidFile(filesArr[i].path) === false){
                delete filesArr[i];
            }
        }
        removeEmptiesFromArray(filesArr);
    }

    function cutRootFolder(rootPath, treeRoot, allFiles){
        function treeProcess(tree){
            if (tree.hasOwnProperty('path')){
                let homePathLength = rootPath.length;
                if (rootPath[0] === "." && rootPath[1] === '/') homePathLength -= 2;

                tree.path = tree.path.substr(homePathLength, tree.path.length - homePathLength);

                tree.path = tree.path.replace(/\\/g, "/");
            }
            if (tree.hasOwnProperty('children')){
                for (let i = 0; i < tree.children.length; i++){
                    treeProcess(tree.children[i]);
                }
            }
        }
        treeProcess(treeRoot);
        for (let i = 0; i < allFiles.length; i++){
            treeProcess(allFiles[i]);
        }
    }

    function extend(dest, src){
        for (let property in src){
            if (src.hasOwnProperty(property)){
                dest[property] = src[property];
            }
        }
    }

    function removeEmptiesFromArray(arr){
        let empties = [];
        let emptiesCounter = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === undefined) {
                empties.push(i);
                emptiesCounter++;
            } else {
                if (empties.length > 0) {
                    // .shift() pick first element from arr and fix length
                    arr[empties.shift()] = arr[i];    // place on empty
                    delete arr[i];                    // delete from here
                    empties.push(i);                  // add empty
                }
            }
        }
        arr.length -= emptiesCounter;
    }

};

module.exports = readFolder;
