var fs = require('fs');
var hash = require('string-hash');
var path = require('path');

module.exports = {
  getHash: function(packages) {
    if (!packages || Object.keys(packages).length === 0) {
      return null;
    }
    var packagesList = Object.keys(packages)
      .map(function(key) {
        return key + ':' + packages[key];
      })
      .sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
    return String(hash(JSON.stringify(packagesList)));
  },
  isValidPackages: function(packages) {
    return packages.split('+').reduce(function(isValid, pkg) {
      if (pkg.indexOf('@') === -1) {
        return false;
      }

      return isValid;
    }, true);
  },
  getDuration: function(time) {
    return (Date.now() - time) / 1000;
  },
};
