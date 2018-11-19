const uuid = require('uuid/v4');
const multer = require('koa-multer');
const path = require('path');

const config = require('../../../config');
const { rootResolve } = require('../../../paths');
const TestStorage = require('./TestStorage');

const isTests = process.env.NODE_ENV === 'test';

const storageConfig = {
  destination: rootResolve(config.uploadPath),
  filename: (req, file, cb) =>
    cb(null, `${uuid()}${path.extname(file.originalname)}`)
};

const storage = isTests ?
  TestStorage.create(storageConfig) :
  multer.diskStorage(storageConfig);

const upload = multer({
  storage
});

module.exports = upload;
