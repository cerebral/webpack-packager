const extractPackages = require('./middleware/extractPackages');
const generateUrl = require('./middleware/generateUrl');

function generateResponse(status, body) {
  return {
    statusCode: status,
    body,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
  };
}

module.exports.request = (event, context, callback) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!');
    return callback(null, 'Lambda is warm!');
  }

  const { packages } = event.pathParameters;

  const escapedPackages = decodeURIComponent(packages);

  const valid = extractPackages(escapedPackages);

  if (!valid) {
    callback(
      null,
      generateResponse(
        404,
        JSON.stringify({
          status: 'error',
          message: 'No packages specified',
        })
      )
    );

    return;
  }

  const splitPackages = escapedPackages.split('+');

  generateUrl(splitPackages)
    .then(({ url, dependencies }) => {
      const response = generateResponse(
        200,
        JSON.stringify({
          status: 'ok',
          url,
          dependencies,
        })
      );

      callback(null, response);
    })
    .catch(error => {
      console.error(error.message);

      const response = generateResponse(
        500,
        JSON.stringify({
          status: 'error',
          error: error.message,
        })
      );

      callback(null, response);
    });
};
