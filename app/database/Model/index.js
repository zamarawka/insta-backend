const uuid = require('uuid/v4');
const omit = require('lodash/omit');

const ValidationError = require('../../exceptions/ValidationError');
const DatabaseError = require('../../exceptions/DatabaseError');

const BaseModel = require('./BaseModel');
const Query = require('./Query');

const clearPayload = (payload) => omit(payload, [
  '_id',
  'createdAt',
  'updatedAt'
]);

module.exports = class Model extends BaseModel {
  static get db() {
    throw new Error('Model: db must be defined');
  }

  static getSkip(perPage, page) {
    return (page - 1) * perPage;
  }

  static validate() {
    return Promise.resolve();
  }

  static all(params = {}) {
    return this.query()
      .find(params)
      .all();
  }

  static query(params) {
    const query = new Query(this, this.db);

    return query.find(params);
  }

  static async find(params = {}) {
    const resModel = await this.db.findOne(params);

    if (resModel === null) {
      throw new DatabaseError(`Model: model not found`);
    }

    return this.newUp(resModel);
  }

  static findById(_id) {
    return this.find({ _id });
  }

  static async create(unsanizePayload) {
    const payload = clearPayload(unsanizePayload);

    try {
      await this.validate(payload);
    } catch(e) {
      throw new ValidationError(e);
    }

    const model = this.createModel(payload);

    let resModel;

    try {
      resModel = await this.db.insert({
        _id: uuid(),
        ...model.$attributes
      });
    } catch (e) {
      throw new DatabaseError(e);
    }


    model.newUp(resModel);

    return model;
  }

  static async update(finder, unsanizePayload) {
    const payload = clearPayload(unsanizePayload);
    const model = this.createModel(payload);

    const updated = await this.db.update(finder, { $set: model.$attributes });

    if (updated) {
      return this.find(finder);
    } else {
      throw new Error(`Model: couldn't found model in ${this.db}`);
    }
  }

  static async destroy(finder) {
    const removed = await this.db.remove(finder);

    if (removed) {
      return true;
    } else {
      throw new Error(`Model: couldn't found model in ${this.db}`);
    }
  }

  remove() {
    return this.constructor.destroy({ _id: this['_id'] });
  }
};
