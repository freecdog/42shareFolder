/**
 * Created by jaric on 09.07.2015.
 */

(function (angular){

    "use strict";

    console.log("jShareFolderControllers", angular);

    var jShareFolderControllers = angular.module('jShareFolderControllers', ['angularTreeview']);

    jShareFolderControllers.controller('jShareFolderNewController', ['$scope', '$http', function($scope, $http) {

        init();

        //$scope.roleList = [];
        $scope.roleList = [{roleName:'Loading'}];

        function init(){
            $scope.data = {};

            // const url = "/api/files";
            const url = "/api/filesNew";
            $http.get(url)
                .success(function(data){

                    function treeProcess(tree){
                        if (tree.hasOwnProperty('path')){
                            tree.roleName = tree.path;
                        }
                        if (tree.hasOwnProperty('children')){
                            for (let i = 0; i < tree.children.length; i++){
                                treeProcess(tree.children[i]);
                            }
                        } else {
                            tree.children = [];
                            if (tree.stats !== undefined) {
                                tree.size = (tree.stats.size / 1024 / 1024).toFixed(2);
                            }
                            // tree.size = (tree.stats.size / 1024 / 1024).toFixed(2);
                        }
                    }
                    // treeProcess(data.allObjects[0]);     // for /api/files
                    treeProcess(data.filesTree);

                    $scope.data = data;

                    // $scope.roleList = data.allObjects;   // for /api/files
                    $scope.roleList = [data.filesTree];

                    console.log(url, $scope.data);
                })
                .error(function(err){
                    console.log(`${url} failed :C, trying one more time, error:`, err);
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