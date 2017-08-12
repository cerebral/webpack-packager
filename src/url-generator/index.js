const extractPackages = require('./middleware/extractPackages');
const generateUrl = require('./middleware/generateUrl');

module.exports.request = (event, context, callback) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!');
    return callback(null, 'Lambda is warm!');
  }

  const { packages } = event.pathParameters;

  const valid = extractPackages(packages);

  if (!valid) {
    callback(new Error('Invalid packages'), {
      statusCode: 404,
      body: JSON.stringify({
        status: 'error',
        message: 'No packages specified',
      }),
    });

    return;
  }

  const splitPackages = packages.split('+');

  generateUrl(splitPackages)
    .then(({ url, dependencies }) => {
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          status: 'ok',
          url,
          dependencies,
        }),
      };

      callback(null, response);
    })
    .catch(error => {
      console.error(error.message);

      const response = {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          error: error.message,
        }),
      };

      callback(error, response);
    });
};
