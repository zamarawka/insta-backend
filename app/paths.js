const { resolve } = require('path');

const rootResolve = (path) => resolve(__dirname, '../', path);

const appResolve = (path) => resolve(__dirname, path);

module.exports = {
  appResolve,
  rootResolve
};
