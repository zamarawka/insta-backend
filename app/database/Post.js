const Validator = require('validatorjs');

const config = require('../config');
const { db } = require('./index');
const Model = require('./Model');

module.exports = class Post extends Model {
  static get db() {
    return db.posts;
  }

  static validate(model) {
    const validation = new Validator(model, {
      file: 'required',
      userId: 'required'
    });

    if (validation.passes()) {
      return Promise.resolve();
    } else {
      return Promise.reject(validation.errors.all());
    }
  }

  getFile(value) {
    return `${config.staticUrlPrefix}/${value}`;
  }

  like({ userId }) {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $addToSet: { 'feedback.likes': userId }
    });
  }

  unlike({ userId }) {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $pull: { 'feedback.likes': userId }
    });
  }

  save({ userId }) {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $addToSet: { 'feedback.saves': userId }
    });
  }

  unsave({ userId }) {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $pull: { 'feedback.saves': userId }
    });
  }

  incrementComments() {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $inc: { [`feedback.comments`]: 1 }
    });
  }

  decrementComments() {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $inc: { [`feedback.comments`]: -1 }
    });
  }
};
