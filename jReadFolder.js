var fs = require('fs');
var path = require('path');

var readFolder = function(folder, callback){
    callback = callback || function(){};

    console.log("j is here", folder);

    let allObjects = [];
    let allAccessibleFiles = [];
    let fileRoot = {};
    let scheduledItems = 1;
    let itemsCounter = 0;

    console.time("readFS");
    readFS(folder, fileRoot, function(){
        console.timeEnd("readFS");
        fs.writeFile('asd.txt', JSON.stringify(fileRoot, null, "\t"), function(err){if (err) throw err;});
        fs.writeFile('asd2.txt', JSON.stringify(allAccessibleFiles, null, "\t"), function(err){if (err) throw err;});
        fs.writeFile('asd3.txt', JSON.stringify(allObjects, null, "\t"), function(err){if (err) throw err;});

        console.log(process.memoryUsage());

        callback(allAccessibleFiles);
    });

    function readFS(item, fileRoot, callback) {

        fs.stat(item, function(err, stats) {
            let obj = {
                path: item
            };
            allObjects.push(obj);

            if (err) {
                obj.err = err;

                console.warn("stat err", item, err);
                processItem(fileRoot, obj);
            } else {
                obj.stats = stats;
                obj.isDirectory = stats.isDirectory();

                if (obj.isDirectory){
                    fs.readdir(item, function(err, list){
                        if (err) {
                            obj.err = err;

                            console.warn("readdir err", item, err);
                            processItem(fileRoot, obj);
                        } else {
                            scheduledItems += list.length;
                            fileRoot.children = [];
                            for (let i = 0; i < list.length; i++){
                                let child = {};
                                fileRoot.children.push(child);
                                readFS(path.join(item, list[i]), child, callback);
                            }

                            processItem(fileRoot, obj);
                        }
                    });

                } else {
                    allAccessibleFiles.push({
                        path: obj.path
                    });

                    processItem(fileRoot, obj);
                }
            }
        });

        function processItem(fileRoot, obj){
            // extend
            for (let property in obj){
                if (obj.hasOwnProperty(property)){
                    fileRoot[property] = obj[property];
                }
            }

            itemsCounter++;
            if (itemsCounter === scheduledItems){
                callback();
            }
        }
    }

};

module.exports = readFolder;
