module.exports = class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.errors = message;
    this.name = 'ValidationError';
  }

  toJSON() {
    return {
      name: this.name,
      errors: this.errors
    };
  }
};
