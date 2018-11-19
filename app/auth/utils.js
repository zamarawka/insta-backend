const jwt = require('jsonwebtoken');

const config = require('../config');

module.exports.generateToken = (payload) =>
  jwt.sign(payload, config.appSecret);
