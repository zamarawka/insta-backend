const User = require('../database/User');

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get users list.
 *     parameters:
 *       - $ref: "#/parameters/perPage"
 *       - $ref: "#/parameters/page"
 *     operationId: getIndex
 *     responses:
 *       200:
 *         description: Return paginaged users list.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: array
 *               items:
 *                 $ref: "#/definitions/User"
 */
exports.getIndex = async ({ request, res }) => {
  const { perPage = 15, page = 1 } = request.query;

  const users = await User.query()
    .paginate(page, perPage);

  return res.ok({
    data: users
  });
};

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     tags:
 *       - Public
 *     parameters:
 *       - $ref: "#/parameters/UserId"
 *     summary: Show user.
 *     operationId: getShow
 *     content:
 *       id: ResourceUuid
 *     responses:
 *       400:
 *         $ref: "#/responses/BadRequest"
 *       200:
 *         description: Return user model by id or nickname.
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
 */
exports.getShow = async ({ res, params }) => {
  let findParams = {};

  if (params.id) {
    findParams['_id'] = params.id;
  } else{
    findParams = params;
  }

  const user = await User.find(findParams);

  return res.ok({
    data: {
      user
    }
  });
};

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Public
 *     parameters:
 *       - required: true
 *         in: formData
 *         name: name
 *         type: string
 *       - required: true
 *         in: formData
 *         name: nickname
 *         type: string
 *       - required: true
 *         in: formData
 *         name: password
 *         type: string
 *       - in: formData
 *         name: about
 *         type: string
 *       - in: formData
 *         name: avatar
 *         type: file
 *     summary: Add new user.
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     operationId: postCreate
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return new user.
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
 */
exports.postCreate = async ({ request, res, req }) => {
  let newUser;
  const { file } = req;

  if (req.headers['content-type'] !== 'application/json') {
    newUser = { ...req.body };
  } else {
    newUser = request.body;
  }

  try {
    newUser.avatar = file ? file.filename : null;
    newUser.following = [];
    newUser.followers = [];
    newUser.counters = {
      posts: 0
    };

    const user = await User.create(newUser);

    return res.ok({
      data: {
        user,
        token: user.createJwt()
      }
    });
  } catch(e) {
    return res.unprocessableEntity({
      data: e
    });
  }
};

/**
 * @swagger
 * /users/{userId}/follow:
 *   post:
 *     tags:
 *       - Private
 *     parameters:
 *       - $ref: "#/parameters/UserId"
 *     summary: Follow user.
 *     operationId: postCreate
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return true if ready.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.postFollow = async ({ res, params, currentUser }) => {
  const { id: userId } = params;

  try {
    await currentUser.follow(userId);

    return res.ok();
  } catch(e) {
    return res.unprocessableEntity({
      data: e
    });
  }
};

/**
 * @swagger
 * /users/{userId}/unfollow:
 *   post:
 *     tags:
 *       - Private
 *     parameters:
 *       - $ref: "#/parameters/UserId"
 *     summary: Unfollow user.
 *     operationId: postCreate
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return true if ready.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.postUnfollow = async ({ currentUser, params, res }) => {
  const { id: userId } = params;

  try {
    await currentUser.unfollow(userId);

    return res.ok();
  } catch(e) {
    return res.unprocessableEntity({
      data: e
    });
  }
};

/**
 * @swagger
 * /users:
 *   put:
 *     tags:
 *       - Private
 *     summary: Update current user info.
 *     parameters:
 *       - required: true
 *         in: formData
 *         name: name
 *         type: string
 *       - required: true
 *         in: formData
 *         name: nickname
 *         type: string
 *       - required: true
 *         in: formData
 *         name: password
 *         type: string
 *       - in: formData
 *         name: about
 *         type: string
 *       - in: formData
 *         name: avatar
 *         type: file
 *     operationId: putUpdate
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return updated user.
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
 */
exports.putUpdate = async ({ res, req, request, currentUser }) => {
  let updateUser;
  const { file } = req;

  if (req.headers['content-type'] !== 'application/json') {
    updateUser = { ...req.body };

    if (file) {
      updateUser.avatar = file.filename;
    }
  } else {
    updateUser = request.body;
  }

  if (updateUser.avatar === 'null') {
    updateUser.avatar = null;
  } else if (!file) {
    delete updateUser.avatar;
  }

  try {
    const user = await User.update({ ['_id']: currentUser['_id'] }, updateUser);

    return res.ok({
      data: {
        user
      }
    });
  } catch (e) {
    return res.unprocessableEntity({
      data: e
    });
  }
};
