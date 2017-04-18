var utils = require('./utils');
var path = require('path');
var findEntryPoints = require('./findEntryPoints');

var fallbackDirs = [
  'lib',
  'dist'
];

module.exports = function (entries, packagePath) {
  var entryKeys = Object.keys(entries);

  return Promise.all(entryKeys.map(function (entryKey) {
    if (entries[entryKey]) {
      return findEntryPoints(entryKey, path.resolve(packagePath, 'node_modules', entryKey));
    } else {
      return utils.readDir(path.resolve(packagePath, 'node_modules', entryKey))
        .then(function (dirs) {
          var fallbackDir = fallbackDirs.reduce(function (currentFallbackDir, dir) {
            if (currentFallbackDir) {
              return currentFallbackDir;
            }

            if (dirs.indexOf(dir) >= 0) {
              return dir;
            }

            return currentFallbackDir;
          }, '');

          return findEntryPoints(entryKey, path.resolve(packagePath, 'node_modules', entryKey, fallbackDir));;
        })
    }
  }))
    .then(function (entryPointsList) {
      return entryPointsList.reduce(function (entryPoints, entryPointList, index) {
        var directEntryPath = entries[entryKeys[index]] ? path.resolve(packagePath, 'node_modules', entryKeys[index], entries[entryKeys[index]]) : null;

        if (directEntryPath && entryPointList.indexOf(directEntryPath) === -1) {
          entryPointList.push(directEntryPath);
        }

        return entryPoints.concat(entryPointList);
      }, [])
    })
    .then(function (entryPoints) {
      return entryPoints.reduce(function (allEntryPoints, entryPoint) {
        if (allEntryPoints.indexOf(entryPoint) === -1) {
          return allEntryPoints.concat(entryPoint);
        }

        return allEntryPoints;
      }, []);
    })
}
