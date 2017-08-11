var path = require('path');
var extract = require('../extract');
var resolveEntries = require('../resolveEntries');
var bundle = require('../bundle');
var utils = require('../utils');
var exec = require('child_process').exec;
var fs = require('fs');
var AWS = require('aws-sdk');
var dependencyMapper = require('../dependencyMapper');

var CLOUDFRONT_URL = 'https://packager.bundles.s3.amazonaws.com';

var s3 = new AWS.S3();

var defaultCallback = function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
};

function saveFile(fileName, data, callback = defaultCallback) {
  return s3.putObject(
    {
      Body: data,
      Bucket: 'packager.bundles',
      Key: fileName,
      ACL: 'public-read',
    },
    callback
  );
}

function extractAndBundle(req, res) {
  var packages = req.params.packages.split('+');

  dependencyMapper(packages)
    .then(absolutePackages => {
      var hash = `${utils.getHash(absolutePackages)}`;
      var packagePath = `/tmp/packages/${hash}`;

      res.send(
        JSON.stringify({ status: 'ok', url: `${CLOUDFRONT_URL}/${hash}` })
      );

      s3.getObject(
        {
          Bucket: 'packager.bundles',
          Key: `${hash}/.packages`,
        },
        function(err, data) {
          if (data) return;

          saveFile(`${hash}/.packages`, absolutePackages.join('+'));

          var currentTime = Date.now();

          console.log(
            'Started - ' +
              absolutePackages.join(', ') +
              ' - ' +
              new Date(currentTime)
          );
          return extract(absolutePackages, packagePath)
            .then(resolveEntries(absolutePackages, packagePath))
            .then(bundle(packagePath))
            .then(function respond() {
              return Promise.all([
                utils.readFile(path.resolve(packagePath, 'manifest.json')),
                utils.readFile(path.resolve(packagePath, 'dll.js')),
              ]);
            })
            .then(function(files) {
              console.log('Success - ' + utils.getDuration(currentTime) + 's');
              saveFile(`${hash}/manifest.json`, JSON.stringify(files[0]));
              saveFile(`${hash}/dll.js`, JSON.stringify(files[1]));
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
      );
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
module.exports = extractAndBundle;
