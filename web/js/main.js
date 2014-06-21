(function() {
  "user strict";

  var app = angular.module('datahack', []);

  app.controller('MyLittleCtrl', ['$scope', function($scope) {
    $scope.test = 'coucou';
  }]);
})();
