/**
 * Created by jaric on 09.07.2015.
 */

(function (angular){

    "use strict";

    console.log("jShareFolderControllers", angular);

    var jShareFolderControllers = angular.module('jShareFolderControllers', ['angularTreeview']);


    jShareFolderControllers.controller('jShareFolderController', ['$scope', '$http', function($scope, $http) {

        init();

        function init(){
            $scope.videos = [];
            $scope.folders = [];
            $scope.subvideos = [];
            $scope.sizes = [];
            $scope.subsizes = [];

            $http.get('/api/videos')
                .success(function(data){
                    $scope.videos = data.files;
                    $scope.folders = data.folders;
                    $scope.sizes = data.sizes;

                    $scope.subvideos = [];
                    $scope.subsizes = [];
                    for (var i = 0; i < $scope.folders.length; i++){
                        var folder = $scope.folders[i];
                        var subvideos = [];
                        var subsizes = [];
                        for (var j = 0; j < $scope.videos.length; j++){
                            var video = $scope.videos[j];
                            var size = $scope.sizes[j];
                            if (video.indexOf(folder + "/") != -1){
                                subvideos.push(video);
                                subsizes.push(size);
                            }
                        }
                        $scope.subvideos.push(subvideos);
                        $scope.subsizes.push(subsizes / 1024 / 1024);
                    }

                    console.log($scope.videos);
                    console.log($scope.sizes);
                })
                .error(function(err){
                    console.log("/api/videos failed :C, trying one more time, error:", err);
                });
        }

    }]);

    jShareFolderControllers.controller('jShareFolderNewController', ['$scope', '$http', function($scope, $http) {

        init();

        $scope.roleList = [];

        function init(){
            $scope.data = {};

            $http.get('/api/files')
                .success(function(data){

                    function treeProcess(tree){
                        if (tree.hasOwnProperty('path')){
                            tree.roleName = tree.path;
                        }
                        if (tree.hasOwnProperty('children')){
                            for (var i = 0; i < tree.children.length; i++){
                                treeProcess(tree.children[i]);
                            }
                        } else {
                            tree.children = [];
                        }
                    }
                    treeProcess(data.allObjects[0]);

                    $scope.data = data;

                    $scope.roleList = data.allObjects;

                    console.log('/api/files', $scope.data);
                })
                .error(function(err){
                    console.log("/api/files failed :C, trying one more time, error:", err);
                });
        }

    }]);

    jShareFolderControllers.directive('sharedFolder', function() {
        return {
            restrict: 'E',
            templateUrl: 'shared-folder.html',
            controller: 'jShareFolderNewController',
            controllerAs: 'sharedObjects'
        };
    });

})(angular);