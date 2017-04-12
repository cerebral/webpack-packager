var exec = require('child_process').exec;

module.exports = function (packages) {
  return new Promise(function (resolve, reject) {
    exec(`cd packages && yarn add --no-lockfile --ignore-scripts ${packages.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve();
      }
    });
  })
}
