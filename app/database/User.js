const Validator = require('validatorjs');
const crypto = require('crypto');

const { db } = require('./index');
const Model = require('./Model');
const config = require('../config');
const { generateToken } = require('../auth/utils');
const DatabaseError = require('../exceptions/DatabaseError');

const getSecretHash = (text) => {
  const hash = crypto.createHash('sha256');

  return hash.update(`${text} ${config.appSecret}`).digest('hex');
};

module.exports = class User extends Model {
  static get db() {
    return db.users;
  }

  static get hidden() {
    return [
      'password'
    ];
  }

  static validate(model) {
    const validation = new Validator(model, {
      name: 'min:3|max:250|required',
      nickname: 'min:2|max:250|required',
      password: 'min:2|required',
      about: 'max:5000'
    });

    if (validation.passes()) {
      return Promise.resolve();
    } else {
      return Promise.reject(validation.errors.all());
    }
  }

  getAvatar(value) {
    return value ? `${config.staticUrlPrefix}/${value}` : null;
  }

  setPassword(value) {
    return getSecretHash(value);
  }

  checkPassword(password) {
    return this.password === getSecretHash(password);
  }

  createJwt() {
    return `Bearer ${generateToken(this.toObject())}`;
  }

  async follow(userId) {
    try {
      await this.constructor.db.update({ _id: userId }, {
        $addToSet: { followers: this['_id'] }
      });
    } catch(e) {
      throw new DatabaseError(e);
    }

    return this.constructor.db.update({ _id: this['_id'] }, {
      $addToSet: { following: userId }
    });
  }

  async unfollow(userId) {
    try {
      await this.constructor.db.update({ _id: userId }, {
        $pull: { followers: this['_id'] }
      });
    } catch(e) {
      throw new DatabaseError(e);
    }

    return this.constructor.db.update({ _id: this['_id'] }, {
      $pull: { following: userId }
    });
  }

  incrementCounter(name) {
    return this.constructor.db.update({ _id: this['_id'] }, {
      $inc: { [`counters.${name}`]: 1 }
    });
  }
};
