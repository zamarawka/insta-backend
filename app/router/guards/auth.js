const auth = require('../../auth');

module.exports = async (ctx, next) => {
  await auth.authenticate('jwt', async function (err, user) {
    if (user) {
      ctx.currentUser = user;

      await next();
    } else {
      ctx.res.unauthorized();
    }
  })(ctx, next);
};
