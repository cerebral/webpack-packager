var utils = require('../utils');
var AWS = require('aws-sdk');
var dependencyMapper = require('../dependencyMapper');

var CLOUDFRONT_URL = 'https://d1f64oheldbse9.cloudfront.net';

var s3 = new AWS.S3();

function maybeSaveData(fileName, packageData) {
  return new Promise((resolve, reject) => {
    s3.getObject(
      {
        Bucket: 'packager.bundles',
        Key: fileName,
      },
      function(err, data) {
        if (data) {
          resolve(data);
        } else {
          s3.putObject(
            {
              Body: packageData,
              Bucket: 'packager.bundles',
              Key: fileName,
              ACL: 'public-read',
            },
            (err, data) => {
              if (err) return reject(err);

              resolve(data);
            }
          );
        }
      }
    );
  });
}

function generateUrl(req, res) {
  let currentTime = Date.now();
  var packages = req.params.packages.split('+');

  dependencyMapper(packages)
    .then(absolutePackages => {
      var hash = `${utils.getHash(absolutePackages)}`;

      // Check if the file already exists, if it does we do nothing, otherwise
      // we create it. This will trigger the AWS bundle function
      return maybeSaveData(
        `${hash}/.packages`,
        absolutePackages.join('+')
      ).then(data => {
        res.send(
          JSON.stringify({
            status: 'ok',
            url: `${CLOUDFRONT_URL}/${hash}`,
            dependencies: absolutePackages,
          })
        );
      });
    })
    .catch(function(error) {
      console.log(
        'Error - ' +
          error.message +
          ' - ' +
          utils.getDuration(currentTime) +
          's'
      );
      console.log(error.stack);
      currentTime = Date.now();
      res.status(500).send({ error: error.message });
    });
}
module.exports = generateUrl;
