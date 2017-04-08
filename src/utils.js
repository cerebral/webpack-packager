var fs = require('fs');
var hash = require('string-hash');
var path = require('path');

module.exports = {
  readFile: function (path) {
    return new Promise(function (resolve, reject) {
      fs.readFile(path, 'utf-8', function (error, content) {
          if (error) {
            reject(error);
          } else {
            resolve(content);
          }
      });
    });
  },
  writeFile: function (path, content) {
    return new Promise(function (resolve, reject) {
      fs.writeFile(path, content, function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
      });
    });
  },
  readDir: function (path) {
    return new Promise(function (resolve, reject) {
      fs.readdir(path, function (error, dir) {
          if (error) {
            reject(error);
          } else {
            resolve(dir);
          }
      });
    });
  },
  stat: function (path) {
    return new Promise(function (resolve, reject) {
      fs.stat(path, function (error, stat) {
          if (error) {
            reject(error);
          } else {
            resolve(stat);
          }
      });
    });
  },
  isPrebundledFile: function (file) {
    if (typeof file !== 'string') {
      return false
    }

    return (
      file.match(/.min.js$/) ||
      file.match(/\-min.js$/) ||
      file.match(/.umd.js$/) ||
      file.match(/.common.js$/) ||
      file.match(/.es.js$/) ||
      file.match(/.es6.js$/) ||
      file.match(/.bundle.js$/)
    )
  },
  cleanManifestContent: function (manifest, entries) {
    var entryKeys = Object.keys(entries);
    var entryPaths = entryKeys.reduce(function (currentEntryPaths, entryKey) {
      return currentEntryPaths.concat(entries[entryKey]);
    }, []);
    var projectPath = path.resolve();

    return Object.keys(manifest.content).reduce(function (currentManifest, key) {
      var entryMatchIndex = entryPaths.reduce(function (matchIndex, entryPath, index) {
        if (key.indexOf(entryPath) >= 0) {
          return index;
        }

        return matchIndex;
      }, -1);

      var pathKey = key.replace(projectPath, '');

      if (entryMatchIndex >= 0) {
        pathKey = './' + path.join('node_modules/', entryKeys[entryMatchIndex]);
      }

      currentManifest[pathKey] = manifest.content[key].id;

      return currentManifest;
    }, {});
  },
  createExternals: function (manifest) {
    return Object.keys(manifest.content).reduce(function (externals, manifestKey, index) {
      var directPath = manifestKey.substr(2).split('/').slice(1).join('/');
      var fileName = path.basename(directPath)
      var extName = path.extname(directPath)
      var baseName = path.basename(fileName, extName)

      externals[directPath] = 'dll_bundle(' + manifest.content[manifestKey] + ')';
      externals[path.dirname(directPath) + '/' + baseName] = 'dll_bundle(' + manifest.content[manifestKey] + ')';

      if (!directPath.match(/node_modules/) && fileName === 'index.js') {
        externals[path.dirname(directPath)] = 'dll_bundle(' + manifest.content[manifestKey] + ')';
      }

      return externals;
    }, {});
  }
}
