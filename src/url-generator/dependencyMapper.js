const pacote = require('pacote');

const cache = {};

const MAX_TTL = 1000 * 60 * 10; // 10 minutes

function getManifest(depString) {
  if (cache[depString]) {
    // Only use it if it's not expired
    if (cache[depString].ttl + MAX_TTL > Date.now()) {
      return cache[depString].promise;
    }
  }

  const promise = pacote.manifest(depString);
  cache[depString] = promise;

  return promise;
}

function splitVersion(packageName) {
  const parts = packageName.split('@');
  if (packageName.startsWith('@')) {
    return [`${parts[0]}@${parts[1]}`, parts[2]];
  } else {
    return [parts[0], parts[1]];
  }
}

/**
 * Gets the absolute versions of all dependencies
 *
 * @param {IDependencies} dependencies
 * @returns
 */
function getAbsoluteVersions(dependencies) {
  // First build an array with name and absolute version, allows parallel
  // fetching of version numbers
  return Promise.all(
    dependencies.map(
      depString =>
        new Promise((resolve, reject) =>
          getManifest(depString)
            .then(manifest => {
              const [depName] = splitVersion(depString);
              const absoluteVersion = manifest.version;

              resolve(`${depName}@${absoluteVersion}`);
            })
            .catch(e => {
              e.message = `Could not fetch version for ${depString}: ${e.message}`;
              reject(e);
            })
        )
    )
  );
}

module.exports = getAbsoluteVersions;
