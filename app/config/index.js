'use strict';

const dotenv = require('dotenv');


// Load environment variables from .env file
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const configs = {
  base: {
    env,
    name: process.env.APP_NAME || 'insta-backend',
    host: process.env.APP_HOST || '0.0.0.0',
    port: process.env.APP_PORT || 1337,
    appSecret: process.env.APP_SECRET,
    dbPath: process.env.DB_PATH,
    uploadPath: process.env.UPLOAD_PATH,
    staticUrlPrefix: process.env.STATIC_URL_PREFIX
  },
  production: {
    port: process.env.APP_PORT || 7071
  },
  development: {
  },
  test: {
    port: 7072,
  }
};
const config = Object.assign(configs.base, configs[env]);

module.exports = config;
