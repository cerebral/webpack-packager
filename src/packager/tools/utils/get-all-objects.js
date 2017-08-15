const AWS = require('aws-sdk');

const s3 = new AWS.S3();

// Get ALL objects
module.exports = function getAllObjects(data = [], offset) {
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
