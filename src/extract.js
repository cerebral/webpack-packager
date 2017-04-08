var exec = require('child_process').exec;

module.exports = function (packages) {
  return new Promise(function (resolve, reject) {
    exec(`yarn add ${packages.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}
