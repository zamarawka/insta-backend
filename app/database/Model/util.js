const upperFirst = require('lodash/upperFirst');
const camelCase = require('lodash/camelCase');

const util = {};

util.getSetterName = (fieldName) => `set${upperFirst(camelCase(fieldName))}`;

util.getGetterName = (fieldName) => `get${upperFirst(camelCase(fieldName))}`;

module.exports = util;
