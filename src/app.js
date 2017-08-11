var express = require('express');
var compression = require('compression');
var app = express();
var extractPackages = require('./middleware/extractPackages');
var generateUrl = require('./middleware/generateUrl');

app.use(compression());
app.get('/*', extractPackages, generateUrl);

module.exports = app;
