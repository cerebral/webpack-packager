var path = require('path');
var utils = require('./utils');

module.exports = function resolveEntries (packages) {
  return function () {
    return Promise.all(packages.map(function (package) {
      var packageName = package.split('@')[0];

      return utils.readFile(path.resolve('node_modules', packageName, 'package.json'))
        .then((result) => JSON.parse(result));
    }))
      .then(function (results) {
        return results.reduce(function (entries, packageJson) {
          var main = packageJson.main;
          var browser = packageJson.browser;
          var module = packageJson.module;
          var unpkg = packageJson.unpkg;
          var mainEntry = 'index.js';

          if (unpkg && !utils.isPrebundledFile(unpkg)) {
            mainEntry = unpkg;
          } else if (main && !utils.isPrebundledFile(main)) {
            mainEntry = main;
          } else if (browser && !utils.isPrebundledFile(browser)) {
            mainEntry = browser;
          } else if (module && !utils.isPrebundledFile(module)) {
            mainEntry = module;
          }

          if (!path.extname(mainEntry)) {
            mainEntry += '.js';
          }

          entries[packageJson.name] = mainEntry;

          return entries;
        }, {})
      });
  }
}
