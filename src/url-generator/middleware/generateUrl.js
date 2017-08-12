var utils = require('../utils');
var AWS = require('aws-sdk');
var dependencyMapper = require('../dependencyMapper');

var CLOUDFRONT_URL =
  process.env.SERVERLESS_STAGE === 'dev'
    ? 'https://d1are1eif7hvx.cloudfront.net'
    : 'https://d3i2v4dxqvxaq9.cloudfront.net';

var s3 = new AWS.S3();

const BUCKET_NAME = process.env.BUCKET_NAME;

function maybeSaveData(fileName, packageData) {
  return new Promise((resolve, reject) => {
    s3.getObject(
      {
        Bucket: BUCKET_NAME,
        Key: fileName,
      },
      function(err, data) {
        if (data) {
          resolve(data);
        } else {
          s3.putObject(
            {
              Body: packageData,
              Bucket: BUCKET_NAME,
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

function generateUrl(packages) {
  let currentTime = Date.now();

  return dependencyMapper(packages).then(absolutePackages => {
    var hash = `${utils.getHash(absolutePackages)}`;

    // Check if the file already exists, if it does we do nothing, otherwise
    // we create it. This will trigger the AWS bundle function
    return maybeSaveData(
      `${hash}/.packages`,
      absolutePackages.join('+')
    ).then(data => {
      return {
        url: `${CLOUDFRONT_URL}/${hash}`,
        dependencies: absolutePackages,
      };
    });
  });
}
module.exports = generateUrl;
