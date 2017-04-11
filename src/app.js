var express = require('express');
var compression = require('compression');
var app = express();
var path = require('path');
var extract = require('./extract');
var resolveEntries = require('./resolveEntries');
var bundle = require('./bundle');
var utils = require('./utils');


app.use(compression());

var isAvailable = true

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
  isAvailable = false

  extract(packages)
    .then(resolveEntries(packages))
    .then(bundle)
    .then(function respond () {
      return Promise.all([
        utils.readFile(path.resolve('manifest.json')),
        utils.readFile(path.resolve('dll.js'))
      ]);
    })
    .then(function (files) {
      res.send({
        manifest: files[0],
        dll: files[1]
      });
      isAvailable = true;
    })
    .catch(function (error) {
      console.log(error);
      isAvailable = true;
      res.status(500).send({
        error: error.message
      });
    });
}

app.get('/*', verifyAvailability, extractPackages, extractAndBundle);

module.exports = app;
