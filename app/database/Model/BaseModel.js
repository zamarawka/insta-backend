const each = require('lodash/each');
const transform = require('lodash/transform');
const includes = require('lodash/includes');
const pick = require('lodash/pick');
const isArray = require('lodash/isArray');
const omit = require('lodash/omit');

const proxyHandler = require('./proxyHandler');
const util = require('./util');

module.exports = class BaseModel {
  constructor() {
    this._instantiate();

    return new Proxy(this, proxyHandler);
  }

  static createModel(payload) {
    const instance = new this();
    instance.fill(payload);

    return instance;
  }

  static newUp(row) {
    const instance = new this();
    instance.newUp(row);

    return instance;
  }

  newUp(row) {
    this.$persisted = true;
    this.$attributes = row;
  }

  _instantiate() {
    this.$setters = [
      '$attributes',
      '$persisted',
      'primaryKeyValue',
      '$originalAttributes',
      '$relations',
      '$sideLoaded',
      '$parent',
      '$frozen',
      '$visible',
      '$hidden'
    ];

    this.$attributes = {};
    this.$persisted = false;
    this.$originalAttributes = {};
    this.$relations = {};
    this.$sideLoaded = {};
    this.$parent = null;
    this.$frozen = false;
    this.$visible = this.constructor.visible;
    this.$hidden = this.constructor.hidden;
  }

  fill(attributes) {
    this.$attributes = {};
    this.merge(attributes);
  }

  merge(attributes) {
    each(attributes, (value, key) => this.set(key, value));
  }

  _getGetterValue(key, value, passAttrs = null) {
    const getterName = util.getGetterName(key);

    return typeof (this[getterName]) === 'function' ? this[getterName](passAttrs || value) : value;
  }

  _getSetterValue(key, value) {
    const setterName = util.getSetterName(key);

    return typeof (this[setterName]) === 'function' ? this[setterName](value) : value;
  }

  set(name, value) {
    this.$attributes[name] = this._getSetterValue(name, value);
  }

  toObject() {
    let evaluatedAttrs = transform(this.$attributes, (result, value, key) => {
      const isMarkedAsDate = includes(this.constructor.dates, key);
      // NOTE: dates mutator
      // const transformedValue = isMarkedAsDate && value ? moment(value) : value
      const transformedValue = value;

      if (!isMarkedAsDate || typeof (this[util.getGetterName(key)]) === 'function' || !transformedValue) {
        result[key] = this._getGetterValue(key, transformedValue);
        return result;
      }

      result[key] = this.constructor.castDates(key, transformedValue);
      return result;
    }, {});

    each(this.constructor.computed || [], (key) => {
      evaluatedAttrs[key] = this._getGetterValue(key, null, evaluatedAttrs);
    });

    if (isArray(this.$visible)) {
      evaluatedAttrs = pick(evaluatedAttrs, this.$visible);
    } else if (isArray(this.$hidden)) {
      evaluatedAttrs = omit(evaluatedAttrs, this.$hidden);
    }

    return evaluatedAttrs;
  }

  toJSON() {
    return this.toObject();
  }
};
