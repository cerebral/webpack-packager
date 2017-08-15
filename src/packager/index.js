const AWS = require('aws-sdk');
const extractAndBundle = require('./extractAndBundle');
const Raven = require('raven');
const exec = require('child_process').exec;

// Installs git for git repos
require('lambda-git')();

const s3 = new AWS.S3();

Raven.config(
  'https://2b44251ab1c642fa8188b70b947d9eb0:9901826e22974a2b8b5397513e83cc53@sentry.io/203440'
).install();

function handleError(e, hash, packages, cb) {
  Raven.captureException(
    e,
    {
      tags: {
        hash,
        packages,
      },
    },
    function() {
      cb(e);
      // console.log(`Deleting ${hash}/.packages`)
      // s3.deleteObject({
      //   Bucket: process.env.BUCKET_NAME,
      //   Key: `${hash}/.packages`,
      // }, (err, data) => {
      //   if (err) {
      //     console.error(`FAILED TO DELETE ${hash}/.packages!`)
      //     cb(err);
      //   } else {
      //     console.log(`Deleted ${hash}/.packages`)
      //     cb(e);
      //   }
      // });
    }
  );
}

console.log('starting function');
module.exports.bundle = function(e, ctx, cb) {
  if (e.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!');
    return cb(null, 'Lambda is warm!');
  }

  exec(`rm -rf /tmp/*`, function(err, stdout, stderr) {
    if (err) {
      return cb(err);
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
                        handleError(e, hash, packages, cb);
                      });
                  } catch (e) {
                    handleError(e, hash, packages, cb);
                  }
                }
              }
            );
          }
        );
      }
    });
  });
};
