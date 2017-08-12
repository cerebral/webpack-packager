var webpack = require('webpack');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var path = require('path');
var utils = require('./utils');
var getVendors = require('./getVendors');
var extractPackageJsonPaths = require('./extractPackageJsonPaths');

module.exports = function(packagePath) {
  return function(entries) {
    return getVendors(entries, packagePath)
      .then(extractPackageJsonPaths(entries, packagePath))
      .then(function(results) {
        // Grab all extra entries related to browser mappings
        var mapEntries = Object.keys(entries).reduce(function(
          currentMapEntries,
          entryKey
        ) {
          return currentMapEntries.concat(
            Object.keys(entries[entryKey].map || {})
          );
        }, []);
        var emptyAliases = Object.keys(entries).reduce(function(
          currentAliases,
          entryKey
        ) {
          return currentAliases.concat(entries[entryKey].emptyModulesAliases);
        }, []);

        var alias = emptyAliases.reduce(
          function(result, emptyModule) {
            return Object.assign(result, {
              [emptyModule]: 'empty-module',
            });
          },
          {
            'custom-css-loader': require.resolve('./customCssLoader'),
          }
        );

        var webpackConfig = {
          context: '/',
          entry: { vendors: results.vendors.concat(mapEntries) },
          output: {
            path: path.resolve(packagePath),
            filename: 'dll.js',
            library: 'dll_bundle',
          },
          plugins: [
            new webpack.DllPlugin({
              path: path.resolve(packagePath, 'manifest.json'),
              name: 'dll_bundle',
            }),
            new webpack.optimize.ModuleConcatenationPlugin(),
            // new UglifyJSPlugin({
            //   parallel: true,
            //   uglifyOptions: {
            //     ie8: false,
            //     ecma: 8,
            //   },
            // }),
          ],
          resolve: {
            modules: [
              path.resolve(packagePath, 'node_modules'),
              path.resolve('node_modules'),
            ],
          },
          resolveLoader: {
            alias: alias,
          },
          node: { fs: 'empty' },
          module: {
            loaders: [
              {
                test: /\.css$/,
                use: 'custom-css-loader',
              },
            ],
          },
        };

        var vendorsCompiler = webpack(webpackConfig);

        return new Promise(function(resolve, reject) {
          vendorsCompiler.run(function(err) {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        })
          .then(function() {
            return utils.readFile(path.resolve(packagePath, 'manifest.json'));
          })
          .then(function(manifestJson) {
            var manifest = JSON.parse(manifestJson);

            manifest.content = utils.cleanManifestContent(
              manifest,
              entries,
              packagePath
            );
            manifest.externals = utils.createExternals(
              manifest,
              results.packageJsons,
              entries
            );

            return utils.writeFile(
              path.resolve(packagePath, 'manifest.json'),
              JSON.stringify(manifest, null, 2)
            );
          });
      });
  };
};
