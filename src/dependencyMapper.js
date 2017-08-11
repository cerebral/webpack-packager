const pacote = require('pacote');

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
          pacote.manifest(depString)
            .then(manifest => {
              const [depName] = depString.split('@');
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
