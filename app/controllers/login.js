const auth = require('../auth');

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Public
 *     summary: Login to app.
 *     parameters:
 *       - required: true
 *         in: query
 *         name: nickname
 *         type: string
 *       - required: true
 *         in: query
 *         name: password
 *         type: string
 *     operationId: postLogin
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return logged user and token.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: "#/definitions/User"
 *                 token:
 *                   $ref: "#/definitions/Token"
 */
exports.postLogin = async (ctx) => {
  const {
    res
  } = ctx;

  try {
    await auth.authenticate('local', function (err, user) {
      if (err !== null || user === false) {
        res.notFound({
          data: {
            errors: {
              type: 'UserNotFound'
            }
          }
        });
      } else {
        const token = user.createJwt();

        res.ok({
          data: {
            token,
            user
          }
        });
      }
    })(ctx);
  } catch (e) {
    res.notFound({
      data: e
    });
  }
};
