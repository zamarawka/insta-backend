const Post = require('../database/Post');
const Comment = require('../database/Comment');
const User = require('../database/User');

/**
 * @swagger
 * /users/{userId}/posts:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get paginated list of posts of user.
 *     parameters:
 *       - $ref: "#/parameters/UserId"
 *       - $ref: "#/parameters/perPage"
 *       - $ref: "#/parameters/page"
 *     operationId: getIndex
 *     responses:
 *       200:
 *         description: Return paginated list of posts.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: array
 *               items:
 *                 $ref: "#/definitions/Post"
 */
exports.getIndex = async ({ request, params, res }) => {
  const { perPage = 15, page = 1 } = request.query;
  const { id: userId } = params;

  try {
    await User.find({ _id: userId });
  } catch (e) {
    return res.notFound({
      data: e
    });
  }

  const posts = await Post.query({ userId })
    .paginate(page, perPage);

  return res.ok({
    data: posts
  });
};

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     tags:
 *       - Public
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     summary: Show post.
 *     operationId: getShow
 *     content:
 *       id: ResourceUuid
 *     responses:
 *       400:
 *         $ref: "#/responses/BadRequest"
 *       200:
 *         description: Return post model by id.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: "#/definitions/Post"
 */
exports.getShow = async ({ res, params }) => {
  try {
    const post = await Post.find({
      ['_id']: params.id
    });

    return res.ok({
      data: {
        post
      }
    });
  } catch (e) {
    return res.notFound({
      data: e
    });
  }
};

/**
 * @swagger
 * /posts:
 *   post:
 *     tags:
 *       - Private
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         required: true
 *         name: file
 *         type: file
 *         description: Post image.
 *       - in: formData
 *         name: text
 *         type: string
 *         description: First comment
 *     summary: Add new post.
 *     operationId: postCreate
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return new post.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: "#/definitions/Post"
 */
exports.postCreate = async ({ res, req, currentUser }) => {
  const { body, file } = req;
  const newPost = {};

  newPost.file = file ? file.filename : null;
  newPost.userId = currentUser['_id'];
  newPost.feedback = {
    likes: [],
    saves: [],
    comments: body && body.text ? 1 : 0
  };

  try {
    const post = await Post.create(newPost);

    if (body && body.text) {
      await Comment.create({
        text: body.text,
        userId: currentUser['_id'],
        postId: post['_id']
      });
    }

    await currentUser.incrementCounter('posts');

    return res.ok({
      data: {
        post
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
 * /posts/{id}:
 *   put:
 *     tags:
 *       - Private
 *     summary: Update post info.
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *       - required: true
 *         in: body
 *         name: post
 *         schema:
 *           $ref: "#/definitions/Post"
 *     operationId: putUpdate
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return updated post.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: "#/definitions/Post"
 */
exports.putUpdate = async ({ params, res, request }) => {
  const { body: updatePost } = request;

  let post = null;

  try {
    post = await Post.update({ ['_id']: params.id }, updatePost);
  } catch (e) {
    return res.unprocessableEntity({
      data: e
    });
  }

  return res.ok({
    data: {
      post
    }
  });
};

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     tags:
 *       - Private
 *     summary: Like post.
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     operationId: postLike
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return succes.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.postLike = async ({ params, res, currentUser }) => {
  const { id: postId } = params;

  try {
    const post = await Post.find({ ['_id']: postId });

    post.like({ userId: currentUser['_id'] });

    return res.ok();
  } catch (e) {
    return res.notFound({
      data: e
    });
  }
};

/**
 * @swagger
 * /posts/{id}/unlike:
 *   post:
 *     tags:
 *       - Private
 *     summary: Unlike post.
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     operationId: postUnlike
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return succes.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.postUnlike = async ({ params, res, currentUser }) => {
  const { id: postId } = params;

  try {
    const post = await Post.find({ ['_id']: postId });

    post.unlike({ userId: currentUser['_id'] });

    return res.ok();
  } catch (e) {
    return res.notFound({
      data: e
    });
  }
};

/**
 * @swagger
 * /posts/{id}/save:
 *   post:
 *     tags:
 *       - Private
 *     summary: Save post.
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     operationId: postSave
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return succes.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.postSave = async ({ params, res, currentUser }) => {
  const { id: postId } = params;

  try {
    const post = await Post.find({ ['_id']: postId });

    post.save({ userId: currentUser['_id'] });

    return res.ok();
  } catch (e) {
    return res.notFound({
      data: e
    });
  }
};

/**
 * @swagger
 * /posts/{id}/unsave:
 *   post:
 *     tags:
 *       - Private
 *     summary: Unsave post.
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     operationId: postUnsave
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return succes.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.postUnsave = async ({ params, res, currentUser }) => {
  const { id: postId } = params;

  try {
    const post = await Post.find({ ['_id']: postId });

    post.unsave({ userId: currentUser['_id'] });

    return res.ok();
  } catch (e) {
    return res.notFound({
      data: e
    });
  }
};

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     tags:
 *       - Private
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     summary: Remove post.
 *     operationId: deleteRemove
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return success if ready.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 */
exports.deleteRemove = async ({ params, res, currentUser }) => {
  const { id: postId } = params;

  try {
    const post = await Post.find({ _id: postId });

    if (currentUser['_id'] !== post.userId) {
      return res.unauthorized();
    }

    currentUser.decrementCounter('posts');

    post.remove();

    return res.ok();
  } catch(e) {
    return res.notFound({
      data: e
    });
  }
};
