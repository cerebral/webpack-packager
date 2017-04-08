var webpack = require('webpack');
var path = require('path');
var utils = require('./utils');
var getVendors = require('./getVendors');

module.exports = function (entries) {
  return getVendors(entries)
    .then(function (vendors) {
      var webpackConfig = {
        context: '/',
        entry: { vendors: vendors },
        output: {
          path: path.resolve(),
          filename: 'dll.js',
          library: 'dll_bundle'
        },
        plugins: [
          new webpack.DllPlugin({
           path: path.resolve('manifest.json'),
           name: 'dll_bundle'
         }),
         new webpack.optimize.UglifyJsPlugin({minimize: true, mangle: false})
       ],
       module: {
         loaders: [{
           test: /\.json$/,
           loader: 'json'
         }]
       }
      };

      var vendorsCompiler = webpack(webpackConfig);

      return new Promise(function (resolve, reject) {
        vendorsCompiler.run(function (err) {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      })
        .then(function () {
          return utils.readFile(path.resolve('manifest.json'));
        })
        .then(function (manifestJson) {
          var manifest = JSON.parse(manifestJson);

          manifest.content = utils.cleanManifestContent(manifest, entries);
          manifest.externals = utils.createExternals(manifest);

          return utils.writeFile(path.resolve('manifest.json'), JSON.stringify(manifest, null, 2));
        });
    });
}
