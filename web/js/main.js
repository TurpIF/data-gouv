(function() {
  "user strict";

  var app = angular.module('datahack', ['ui.bootstrap', 'leaflet-directive']);

  app.controller('MyLittleCtrl', ['$scope', '$interval', '$http',
    function($scope, $interval, $http) {
    $scope.test = 'coucou';
    $scope.year_min = 1996;
    $scope.year_max = 2015;
    $scope.year_current = $scope.year_min;

    $scope.timeline_playing = true;
    $scope.timeline_value = 0;
    $scope.timeline_label = "";
    $scope.timeline_func = undefined;
    $scope.timeline_step = 100;

    $scope.aggregate_data = true;

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

    $scope.data = [];
    // $scope.data = [
    // {
    //   lat: 47.0835,
    //   lng: 2.4,
    //   street: '12 rue des Brocolies',
    //   city: 'Metz',
    //   departement: 'Moselle',
    //   region: 'Rhône-Alpes',
    //   zipcode: 55000,
    //   type: 'A',
    //   value: 42,
    // },
    // {
    //   lat: 47.4937,
    //   lng: 2.4,
    //   street: '13 rue des Brocolies',
    //   city: 'Metz',
    //   departement: 'Moselle',
    //   region: 'Lorraine',
    //   zipcode: 55000,
    //   type: 'A',
    //   value: 42,
    // },
    // {
    //   lat: 47.2539,
    //   lng: 2.6,
    //   street: '14 rue des Brocolies',
    //   city: 'Metz',
    //   departement: 'Moselle',
    //   region: 'Lorraine',
    //   zipcode: 55000,
    //   type: 'A',
    //   value: 42,
    // },
    // {
    //   lat: 47.6841,
    //   lng: 2.8,
    //   street: '15 rue des Brocolies',
    //   city: 'Metz',
    //   departement: 'Moselle',
    //   region: 'Lorraine',
    //   zipcode: 55000,
    //   type: 'A',
    //   value: 42,
    // },
    // ];

    var datas2markers = function(ds) {
      var value_max = d3.max(ds, function(d) { return d.value; });

      return ds.map(function(d) {
        var m = {};
        m.model = d.model;
        m.lat = d.lat;
        m.lng = d.lng;
        m.focus = false;
        m.draggable = false;
        if (d.street)           m.message = d.street;
        else if (d.city)        m.message = d.city;
        else if (d.zipcode)     m.message = '' + d.zipcode;
        else if (d.departement) m.message = d.departement;
        else if (d.region)      m.message = d.region;

        var font_size = Math.log(d.value / value_max + 1) * 42 * 1.6;

        var type2color = function(t) {
          if (t == 'Gendarmerie')       return '#2b468d';
          if (t == 'Police Municipale') return '#7db7fd';
          if (t == 'Autre')             return '#304568';
          console.log(t);
          return 'red';
        };

        var type2class = function(t) {
          return 'glyphicon-home';
        };

        var color = type2color(d.type);
        var class_ = type2class(d.type);

        m.icon = {
          type: 'div',
             iconSize: [1, 1],
             html: '<i class="glyphicon marker ' + class_ + '" style="font-size: ' + font_size + 'px; top: -' + font_size / 2 + 'px; left: -' + font_size / 2 + 'px; color: ' + color + '"></i>',
             popupAnchor: [0, 0],
        };

        return m;
      });
    };

    $scope.markers = [];

    $scope.geojson = {};

    $scope.google_layers = {
      baselayers: {
        googleRoadmap: {
          name: 'Google Streets',
          layerType: 'ROADMAP',
          type: 'google'
        },
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
      }
    };

    $scope.defaults = {
      tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
      maxZoom: 14,
      scrollWheelZoom: true
    };

    $scope.eventsMap = {
      map: {
        enable: ['zoomend', 'click'],
          logic: 'emit'
      }
    };

    $http.get('./data/polices_gendarmes.json').success(function(data, status) {
      $scope.data = data.map(function(d) {
        return {
          lat: d.latitude,
          lng: d.longitude,
          street: d.adresse,
          city: d.ville,
          departement: d.nom_dept,
          region: d.nom_region,
          zipcode: d.postal_code,
          type: d.type,
          name: d.label,
          value: d.nbmarechaussaux,
          model: d,
        };
      }).filter(function(d) {
        if (d.region == 'REUNION') return false;
        if (d.region == 'MARTINIQUE') return false;
        if (d.region == 'GUADELOUPE') return false;
        if (d.region == 'GUYANNE') return false;
        return true;
      });
    });

    $scope.$on('leafletDirectiveMap.zoomend', function(e, d) {
      // console.log('zoom', e, d);
      var zoom = d.leafletEvent.target._zoom;
      // console.log(zoom);

      var aggreg_level = function(zoom) {
        if (zoom <= 7)  return 'region';
        if (zoom <= 8)  return 'departement';
        return 'departement';
        if (zoom <= 10) return 'city';
        if (zoom <= 11) return undefined;
      };

      var aggreg_by = function(d, by) {
        if (!by)  return d;
        if (by == 'city') return d;

        var sortBy = function(ls, by) {
          var sorted = {};
          var na = [];
          for (var i in ls) {
            var e = ls[i];
            if (!(by in e)) {
              na.push(e);
              continue;
            }
            if (!sorted[e[by]]) {
              sorted[e[by]] = [e];
            } else {
              sorted[e[by]].push(e);
            }
          }
          return {sorted: sorted, not_available: na};
        };

        var sorted = sortBy(d, by);

        var agg = [];
        for (var i in sorted.sorted) {
          var e = sorted.sorted[i];
          var types = sortBy(e, 'type').sorted;

          for (var j in types) {
            var t = types[j];
            agg_d = {
              lat: d3.mean(t, function(a) { return a.lat; }),
              lng: d3.mean(t, function(a) { return a.lng; }),
              street: t[0].street,
              city: t[0].city,
              departement: t[0].departement,
              region: t[0].region,
              zipcode: t[0].zipcode,
              type: t[0].type,
              value: d3.median(t, function(a) { return a.value; }),
            };

            if (by == 'region' && agg_d.region) {
              agg_d.street = undefined;
              agg_d.city = undefined;
              agg_d.zipcode = undefined;
              agg_d.departement = undefined;
            }
            if (by == 'departement' && agg_d.departement) {
              agg_d.street = undefined;
              agg_d.city = undefined;
              agg_d.zipcode = undefined;
            }
            if (by == 'city' && agg_d.city) {
              agg_d.street = undefined;
            }
            agg.push(agg_d);
          }
        }
        // agg.push.apply(agg, sorted.not_available);
        return agg;
      };

      var aggreg_data = $scope.data;
      var level = aggreg_level(zoom);
      if ($scope.aggregate_data)
        aggreg_data = aggreg_by($scope.data, level);
      console.log(aggreg_data);

      var geojson_file = 'departements';
      var geojson_opacity = 0.0;
      if (level == 'region')  geojson_file = 'regions';
      // if (level == 'city')    geojson_opacity = 0.2;
      $http.get('./data/' + geojson_file + '.geojson').success(function(data, status) {
        $scope.geojson = {
          data: data,
          style: function(d) {
            return {
              fillColor: "red",
              weight: 1,
              opacity: 1,
              color: '#666',
              // dashArray: '3',
              fillOpacity: geojson_opacity
            };
          }
        };
      });

      if ($scope.aggregate_data) {
        aggreg_data = aggreg_data.filter(function(d) {
          if (!(level in d) || !d[level])
            return false;
          return true;
        });
      }

      $scope.markers = datas2markers(aggreg_data);
    });

    $scope.$on('leafletDirectiveMap.click', function(e, d) {
      console.log('click', e, d);
    });

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
