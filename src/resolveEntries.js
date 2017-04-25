var path = require('path');
var utils = require('./utils');

module.exports = function resolveEntries (packages, packagePath) {
  return function () {
    return Promise.all(packages.map(function (package) {
      var packageName = utils.getPackageName(package);

      return utils.readFile(path.resolve(packagePath, 'node_modules', packageName, 'package.json'))
        .then((result) => JSON.parse(result));
    }))
      .then(function (results) {
        return results.reduce(function (entriesPromise, packageJson) {
          var main = utils.evaluateEntry(packageJson.main);
          var browser = utils.evaluateEntry(packageJson.browser);
          var module = utils.evaluateEntry(packageJson.module);
          var unpkg = utils.evaluateEntry(packageJson.unpkg);
          var bin = utils.evaluateEntry(packageJson.bin);
          var entryList = [
            utils.evaluateEntry(packageJson.unpkg),
            utils.evaluateEntry(packageJson.browser),
            utils.evaluateEntry(packageJson.module),
            utils.evaluateEntry(packageJson.main),
            utils.evaluateEntry(packageJson.bin)
          ].filter(function (entry) {
            return Boolean(entry);
          }).sort(function (entryA, entryB) {
            if (utils.isPrebundledFile(entryA) && !utils.isPrebundledFile(entryB)) {
              return 1;
            } else if (!utils.isPrebundledFile(entryA) && utils.isPrebundledFile(entryB)) {
              return -1;
            }

            return 0;
          })

          var mainEntry = entryList.shift()

          if (path.extname(mainEntry)) {
            return entriesPromise.then(function (entries) {
              return Object.assign(entries, {
                [packageJson.name]: {
                  main: mainEntry,
                  other: entryList
                }
              });
            });
          } else {
            return utils.stat(path.resolve(packagePath, 'node_modules', packageJson.name, mainEntry))
              .then(function (stat) {
                return entriesPromise.then(function (entries) {
                  return Object.assign(entries, {
                    [packageJson.name]: {
                      main: mainEntry,
                      other: entryList
                    }
                  });
                });
              })
              .catch(function () {
                return entriesPromise.then(function (entries) {
                  return Object.assign(entries, {
                    [packageJson.name]: {
                      main: mainEntry + '.js',
                      other: entryList
                    }
                  });
                });
              })
          }

        }, Promise.resolve({}))
      });
  }
}
