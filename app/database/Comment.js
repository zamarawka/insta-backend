const Validator = require('validatorjs');

const { db } = require('./index');
const Model = require('./Model');

module.exports = class Comment extends Model {
  static get db() {
    return db.comments;
  }

  static validate(model) {
    const validation = new Validator(model, {
      text: 'min:1|max:5000|required',
      postId: 'required',
      userId: 'required'
    });

    if (validation.passes()) {
      return Promise.resolve();
    } else {
      return Promise.reject(validation.errors.all());
    }
  }
};
