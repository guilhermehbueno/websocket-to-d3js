'use strict';

angular.module('websocketToD3jsApp')
  .factory('Session', function ($resource) {
    return $resource('/api/session/');
  });
