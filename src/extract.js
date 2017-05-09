var exec = require('child_process').exec;

/**
 * We add these dependencies manually, because this is part of the webpack dependencies
 * and not part of the packager dependencies. If any package tries to import `buffer`
 * it will only load the direct entrypoints of `buffer`, not the entrypoints of its dependencies.
 * 
 * This will add all needed entrypoints for these packages.
*/
var POLYFILL_DEPENDENCIES = ['buffer', 'setimmediate'];

module.exports = function (packages, packagePath) {
  return new Promise(function (resolve, reject) {
    exec(`mkdir -p ${packagePath} && cd ${packagePath} && yarn add ${packages.join(' ')} ${POLYFILL_DEPENDENCIES.join(' ')} --no-lockfile --ignore-scripts --non-interactive --no-bin-links --no-lockfile --ignore-engines`, function (err, stdout, stderr) {
      if (err) {
        reject(err.message.indexOf('versions') >= 0 ? new Error('INVALID_VERSION') : err);
      } else {
        resolve();
      }
    });
  })
}
