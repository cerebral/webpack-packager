var express = require('express');
var compression = require('compression');
var app = express();
var path = require('path');
var extract = require('./extract');
var resolveEntries = require('./resolveEntries');
var bundle = require('./bundle');
var utils = require('./utils');
var exec = require('child_process').exec;

app.use(compression());

var isAvailable = true;

function verifyAvailability(req, res, next) {
  if (isAvailable) {
    next();
  } else {
    res.sendStatus(503);
  }
}

function extractPackages (req, res, next) {
  req.params.packages = req.params['0'];
  if (!utils.isValidPackages(req.params.packages)) {
    res.sendStatus(404);
  } else {
    next();
  }
}

function extractAndBundle (req, res) {
  var packages = req.params.packages.split('+');
  var packagePath = `packages/${utils.getHash(packages)}`;
  var currentTime = Date.now()

  isAvailable = false;
  console.log('Started - ' + packages.join(', ') + ' - ' + new Date(currentTime))
  extract(packages, packagePath)
    .then(resolveEntries(packages, packagePath))
    .then(bundle(packagePath))
    .then(function respond () {
      return Promise.all([
        utils.readFile(path.resolve(packagePath, 'manifest.json')),
        utils.readFile(path.resolve(packagePath, 'dll.js'))
      ]);
    })
    .then(function (files) {
      console.log('Success - ' + utils.getDuration(currentTime)  + 's')
      currentTime = Date.now()

      res.send({
        manifest: files[0],
        dll: files[1]
      });
      isAvailable = true;
      exec(`rm -rf ${packagePath}`, function (err, stdout, stderr) {
        if (err) {
          console.log(err);
        }
        console.log('Cleaned - ' + utils.getDuration(currentTime)  + 's')
      })
    })
    .catch(function (error) {
      console.log('Error - ' + error.message + ' - ' + utils.getDuration(currentTime) + 's')
      currentTime = Date.now()

      isAvailable = true;
      res.status(500).send({
        error: error.message
      });
      exec(`rm -rf ${packagePath}`, function (err, stdout, stderr) {
        if (err) {
          console.log(err);
        }
        console.log('Cleaned - ' + utils.getDuration(currentTime)  + 's')
      })
    });
}

app.get('/*', verifyAvailability, extractPackages, extractAndBundle);

module.exports = app;
