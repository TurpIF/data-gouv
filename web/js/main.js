(function() {
  "user strict";

  var app = angular.module('datahack', ['ui.bootstrap', 'leaflet-directive']);

  app.controller('MyLittleCtrl', ['$scope', '$interval', function($scope, $interval) {
    $scope.test = 'coucou';
    $scope.year_min = 1996;
    $scope.year_max = 2015;
    $scope.year_current = $scope.year_min;

    $scope.timeline_playing = true;
    $scope.timeline_value = 0;
    $scope.timeline_label = "";
    $scope.timeline_func = undefined;
    $scope.timeline_step = 100;

    $scope.togglePlay = function() {
      $scope.timeline_playing ^= true;
    };

    var months = {
      1: 'Janvier',
      2: 'Février',
      3: 'Mars',
      4: 'Avril',
      5: 'Mai',
      6: 'Juin',
      7: 'Juillet',
      8: 'Août',
      9: 'Septembre',
      10: 'Octobre',
      11: 'Novembre',
      12: 'Décembre'
    };

    $scope.center = {
      lat: 47.0833,
      lng: 2.4,
      zoom: 6
    };

    $scope.google_layers = {
      baselayers: {
        googleTerrain: {
          name: 'Google Terrain',
          layerType: 'TERRAIN',
          type: 'google'
        },
        googleHybrid: {
          name: 'Google Hybrid',
          layerType: 'HYBRID',
          type: 'google'
        },
        googleRoadmap: {
          name: 'Google Streets',
          layerType: 'ROADMAP',
          type: 'google'
        }
      }
    };

    $scope.defaults = {
      tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
      maxZoom: 14,
      scrollWheelZoom: true
    };

    $scope.$watch('timeline_playing', function(v) {
      if (!v && $scope.timeline_func) {
        $interval.cancel($scope.timeline_func);
      }
      if (v) {
        $scope.timeline_func = $interval(function() {
          $scope.year_current += 1.0 / 13;
          if ($scope.year_current >= $scope.year_max) {
            $scope.year_current = $scope.year_max;
            $scope.timeline_playing = false;
          }
          $scope.timeline_value = ($scope.year_current - $scope.year_min) / ($scope.year_max - $scope.year_min) * 100;
          var year = $scope.year_current | 0;
          var month = months[((($scope.year_current - year) * 12) | 0) + 1];
          $scope.timeline_label = month + ' ' + year;
        }, $scope.timeline_step);
      }
    });
  }]);
})();
