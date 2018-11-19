const { regex: uuidRegexp } = require('uuid-v4-regex');

module.exports.regExp = uuidRegexp;

module.exports.wildcard = `:id(${uuidRegexp.source})`;
