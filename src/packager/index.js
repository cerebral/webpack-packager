const AWS = require('aws-sdk');
const extractAndBundle = require('./extractAndBundle');

const s3 = new AWS.S3();

function handleError(e, hash, cb) {
  s3.deleteObject({
    Bucket: process.env.BUCKET_NAME,
    Key: `${hash}/.packages`,
  });
  cb(e);
}

console.log('starting function');
module.exports.bundle = function(e, ctx, cb) {
  if (e.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!');
    return cb(null, 'Lambda is warm!');
  }

  e.Records.forEach(record => {
    if (record.s3) {
      const file = record.s3.object.key;
      console.log('Got request for file ' + file);
      const [hash] = file.split('/');

      s3.getObject(
        {
          Bucket: process.env.BUCKET_NAME,
          Key: `${hash}/.packages`,
        },
        (err, packagesData) => {
          if (err) {
            console.error(err);
            cb(err);
            return;
          }

          if (packagesData.Body == null) {
            cb(null, 'No data');
            return;
          }

          s3.getObject(
            {
              Bucket: process.env.BUCKET_NAME,
              Key: `${hash}/dll.js`,
            },
            (err, data) => {
              if (!data) {
                const packages = packagesData.Body.toString().split('+');

                try {
                  extractAndBundle(packages, hash)
                    .then(a => {
                      cb(null, 'success');
                    })
                    .catch(e => {
                      handleError(e, hash, cb);
                    });
                } catch (e) {
                  handleError(e, hash, cb);
                }
              }
            }
          );
        }
      );
    }
  });
};
