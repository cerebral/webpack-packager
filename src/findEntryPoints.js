var path = require('path');
var utils = require('./utils');

function isValidFile (file, filePath, packageName) {
  return (
    (path.extname(file) === '.js' || path.extname(file) === '.css') &&
    file[0] !== '_' &&
    file !== 'gulpfile.js' &&
    !utils.isPrebundledFile(file) &&
    file.indexOf('.test.js') === -1 &&
    file.indexOf('.spec.js') === -1
  );
}

var invalidDirs = [
  'dist',
  'es6',
  'es',
  'src',
  'bundles',
  'examples',
  'scripts',
  'tests',
  'test',
  'testing',
  'min',
  'node_modules'
];

function isValidDir (dir, dirOverride) {
  return (
    path.join('/', dir) === path.join('/', dirOverride) ||
    invalidDirs.indexOf(dir) === -1
  )
}

module.exports = function readPackage (packageName, filePath, dirOverride) {
  return utils.readDir(filePath)
    .then(function (dir) {
      return Promise.all(dir.map(function (fileOrDir) {
        var currentPath = path.join(filePath, fileOrDir);
        return utils.stat(currentPath)
          .then(function (fileStat) {
            if (fileStat.isDirectory() && isValidDir(fileOrDir, dirOverride)) {
              return readPackage(packageName, currentPath, dirOverride);
            } else if (!fileStat.isDirectory() && isValidFile(fileOrDir, currentPath, packageName)) {
              return currentPath;
            }
          });
      }))
        .then(function (hits) {
          return hits.reduce(function (entryPoints, hit) {
            if (hit) {
              return entryPoints.concat(hit);
            }

            return entryPoints;
          }, []);
        })
    })
}
