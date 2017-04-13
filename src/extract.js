var exec = require('child_process').exec;

module.exports = function (packages, packagePath) {
  return new Promise(function (resolve, reject) {
    exec(`mkdir -p ${packagePath} && cd ${packagePath} && yarn add --no-lockfile --ignore-scripts ${packages.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve();
      }
    });
  })
}
