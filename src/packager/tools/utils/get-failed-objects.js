// This utility function will list all packages of which the bundling procedure has
// failed

const groupBy = function(arr, f) {
  return arr.reduce((out, val) => {
    let by = typeof f === 'function' ? '' + f(val) : val[f];
    (out[by] = out[by] || []).push(val);
    return out;
  }, {});
};

module.exports = function(objects) {
  const groupedPackages = groupBy(objects, p => {
    [hash] = p.Key.split('/');
    return hash;
  });

  return {
    total: groupedPackages,
    failed: Object.keys(groupedPackages).filter(
      hash => groupedPackages[hash].length !== 3
    ),
  };
};
