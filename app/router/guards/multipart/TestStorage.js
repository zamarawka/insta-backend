const uuid = require('uuid/v4');
const concat = require('concat-stream');

// NOTE: used in e2e test
class TestStorage {
  constructor({ filename = () => uuid() } = {}) {
    this.getFileName = filename;
  }

  _handleFile(req, file, cb) {
    file.stream.pipe(concat(() => {
      this.getFileName(req, file, (err, filename) => {
        if (err) {
          return cb(err);
        }

        cb(null, {
          filename,
          destination: '/tmp/e2e-tests',
          path: `/tmp/e2e-tests/${filename}`,
          size: 1337
        });
      });
    }));
  }

  _removeFile(req, file, cb) {
    cb();
  }

  static create(opts) {
    return new this(opts);
  }
}

module.exports = TestStorage;
