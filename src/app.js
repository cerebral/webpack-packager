var express = require('express');
var compression = require('compression');
var app = express();
var extractPackages = require('./middleware/extractPackages');
var extractAndBundle = require('./middleware/extractAndBundle');

app.use(compression());
app.get('/*', extractPackages, extractAndBundle);

module.exports = app;
