// Delete all failed packages so we can retry them in the future
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const getAllObjects = require('./utils/get-all-objects');
const getFailedObjects = require('./utils/get-failed-objects');

getAllObjects().then(objects => {
  const { total, failed } = getFailedObjects(objects);

  const Objects = failed.map(hash => ({
    Key: total[hash].find(f => f.Key.includes('.packages')).Key,
  })).filter(x => x.Key);

  if (Objects.length === 0) {
    return console.log('No objects to delete.');
  }

  s3.deleteObjects(
    {
      Bucket: 'prod.packager.bundles',
      Delete: {
        Objects,
      },
    },
    (err, data) => {
      if (err) {
        return console.error(err);
      }

      console.log(`Success, deleted ${Objects.length} objects.`);
    }
  );
});
