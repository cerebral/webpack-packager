var path = require('path');
var utils = require('./utils');

module.exports = function resolveEntries (packages, packagePath) {
  return function () {
    return Promise.all(packages.map(function (pkg) {
      var packageName = utils.getPackageName(pkg);

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

          if (mainEntry && path.extname(mainEntry)) {
            return entriesPromise.then(function (entries) {
              return Object.assign(entries, {
                [packageJson.name]: {
                  main: mainEntry,
                  other: entryList
                }
              });
            });
          } else if (mainEntry) {
            return utils.stat(path.resolve(packagePath, 'node_modules', packageJson.name, mainEntry + '.js'))
              .then(function () {
                return entriesPromise.then(function (entries) {
                  return Object.assign(entries, {
                    [packageJson.name]: {
                      main: mainEntry + '.js',
                      other: entryList
                    }
                  });
                });
              })
              .catch(function () {
                return utils.stat(path.resolve(packagePath, 'node_modules', packageJson.name, mainEntry, 'index.js'))
                  .then(() => {
                    return entriesPromise.then(function (entries) {
                      return Object.assign(entries, {
                        [packageJson.name]: {
                          main: path.join(mainEntry, 'index.js'),
                          other: entryList
                        }
                      });
                    });
                  })
                  .catch(() => {
                    return entriesPromise.then(function (entries) {
                      return Object.assign(entries, {
                        [packageJson.name]: {
                          main: mainEntry,
                          other: entryList
                        }
                      });
                    });
                  })
              })
          } else {
            return entriesPromise.then(function (entries) {
              return Object.assign(entries, {
                [packageJson.name]: {
                  main: null,
                  other: entryList
                }
              });
            });
          }
        }, Promise.resolve({}))
      });
  }
}
