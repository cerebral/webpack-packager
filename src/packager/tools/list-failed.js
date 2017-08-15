const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const groupBy = function(arr, f) {
  return arr.reduce((out, val) => {
    let by = typeof f === 'function' ? '' + f(val) : val[f];
    (out[by] = out[by] || []).push(val);
    return out;
  }, {});
};

// Get ALL objects
function getAllObjects(data = [], offset) {
  return new Promise((resolve, reject) => {
    const options = {
      Bucket: 'prod.packager.bundles',
    };

    if (offset) {
      options.ContinuationToken = offset;
    }

    s3.listObjectsV2(options, (err, newData) => {
      if (err) return reject(err);

      if (newData.IsTruncated) {
        resolve(getAllObjects(
          [...data, ...newData.Contents],
          newData.NextContinuationToken
        ));
      } else {
        resolve([...data, ...newData.Contents]);
      }
    });
  });
}

// This utility function will list all packages of which the bundling procedure has
// failed

getAllObjects().then(objects => {
  const groupedPackages = groupBy(objects, p => {
    [hash] = p.Key.split('/');
    return hash;
  });


  const wrongHashes = Object.keys(groupedPackages)
  .filter(hash => groupedPackages[hash].length !== 3)
  .map(hash => ({
    hash,
    files: groupedPackages[hash].map(f => f.Key),
  }));
  console.log(`Checked ${Object.keys(groupedPackages).length} packages`);
  console.log(`Found ${wrongHashes.length} failed packages`);

  console.log(JSON.stringify(wrongHashes, null, 2));
});
