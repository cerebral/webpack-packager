var exec = require('child_process').exec;

module.exports = function (packages) {
  return new Promise(function (resolve, reject) {
    exec(`./node_modules/.bin/yarn add --no-lockfile --ignore-scripts ${packages.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}
