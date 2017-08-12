var UglifyJS = require('uglify-js');
var AWS = require('aws-sdk');

const s3 = new AWS.S3();

module.exports.uglify = (event, context, callback) => {
  event.Records.forEach(record => {
    if (record.s3) {
      const file = record.s3.object.key;
      console.log('Got request for file ' + file);

      s3.getObject(
        {
          Bucket: process.env.BUCKET_NAME,
          Key: file,
        },
        (err, bundle) => {
          if (err) {
            console.error(err);
            callback(err);
            return;
          }

          if (bundle.Body == null) {
            console.error(file + ' not found');
            callback(new Error('No file at ' + file));
            return;
          }

          const code = bundle.Body.toString();
          const result = UglifyJS.minify(code);

          if (result.error) {
            callback(result.error);
            return;
          } else {
            s3.putObject({
              Bucket: process.env.BUCKET_NAME,
              Key: file.replace('.js', '.min.js'),
              ACL: 'public-read',
              Body: result.code,
            }, (err) => {
              callback(err);
            });
          }
        }
      );
    }
  });
};
