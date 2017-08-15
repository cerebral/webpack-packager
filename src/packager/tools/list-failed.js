// This utility function will list all packages of which the bundling procedure has
// failed

const getAllObjects = require('./utils/get-all-objects');
const getFailedObjects = require('./utils/get-failed-objects');

getAllObjects().then(objects => {
  const { total, failed } = getFailedObjects(objects);

  console.log(`Checked ${Object.keys(total).length} packages`);
  console.log(`Found ${failed.length} failed packages`);

  const wrongHashes = failed.map(hash => ({
    hash,
    files: total[hash].map(f => f.Key),
  }));

  console.log(JSON.stringify(wrongHashes, null, 2));
});
