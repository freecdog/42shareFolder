/**
 * Created by jaric on 09.07.2015.
 */

(function (angular){

    "use strict";

    console.log("jShareFolderControllers", angular);

    var jShareFolderControllers = angular.module('jShareFolderControllers', ['angularTreeview']);

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
                            tree.size = (tree.stats.size / 1024 / 1024).toFixed(2);
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