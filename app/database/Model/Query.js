module.exports = class Query {
  constructor(Model, db) {
    this.Model = Model;
    this.db = db;

    this.query = this.db;
  }

  find(params) {
    this.query = this.query.cfind(params);

    return this;
  }

  getSkip(page, limit) {
    return (page - 1) * limit;
  }

  mapRowsToModel(rows) {
    return rows.map(row => this.Model.newUp(row));
  }

  async all() {
    const res = await this.query.exec();

    return this.mapRowsToModel(res);
  }

  async paginate(page, limit) {
    const skip = this.getSkip(page, limit);

    const res = await this.query
      .skip(skip)
      .limit(limit)
      .exec();

    return this.mapRowsToModel(res);
  }
};
