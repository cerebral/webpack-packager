var utils = require('../utils');

function extractPackages(packages) {
  return utils.isValidPackages(packages);
}

module.exports = extractPackages;
