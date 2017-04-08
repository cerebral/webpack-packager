var path = require('path');
var utils = require('./utils');

function isValidFile (file, filePath, content, packageName) {
  return (
    (path.extname(file) === '.js' || path.extname(file) === '.css') &&
    file[0] !== '_' &&
    !utils.isPrebundledFile(file) &&
    file.indexOf('.test.js') === -1 &&
    file.indexOf('.spec.js') === -1 &&
    (
      (encodeURI(content).split(/%..|./).length - 1) < 102400 ||
      file === 'index.js' ||
      file === packageName + '.js'
    )
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

function isValidDir (dir) {
  return invalidDirs.indexOf(dir) === -1;
}

module.exports = function readPackage (packageName, filePath) {
  return utils.readDir(filePath)
    .then(function (dir) {
      return Promise.all(dir.map(function (fileOrDir) {
        var currentPath = path.join(filePath, fileOrDir);

        return utils.stat(currentPath)
          .then(function (fileStat) {
            if (fileStat.isDirectory() && isValidDir(fileOrDir)) {
              return readPackage(packageName, currentPath);
            } else if (!fileStat.isDirectory()) {
              return utils.readFile(currentPath)
                .then(function (fileContent) {
                  if (isValidFile(fileOrDir, currentPath, fileContent, packageName)) {
                    return currentPath;
                  }
                });
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
