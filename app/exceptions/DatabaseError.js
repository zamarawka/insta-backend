module.exports = class DatabaseError extends Error {
  constructor(error) {
    super(error);
    this.errors = error;
    this.name = 'DatabaseError';
  }

  toJSON() {
    return {
      name: this.name,
      errors: this.errors
    };
  }
};
