const uniq = require('lodash/uniq');
const User = require('../database/User');
const Post = require('../database/Post');
const Comment = require('../database/Comment');

/**
 * @swagger
 * /posts/{id}/comments:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get paginated list of comments of post.
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *       - $ref: "#/parameters/perPage"
 *       - $ref: "#/parameters/page"
 *     operationId: getIndex
 *     responses:
 *       200:
 *         description: Return paginated list of comments.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: array
 *               items:
 *                 $ref: "#/definitions/Comment"
 */
exports.getIndex = async ({ request, params, res }) => {
  const { perPage = 15, page = 1 } = request.query;
  const { id: postId } = params;

  try {
    await Post.find({ _id: postId });
  } catch(e) {
    return res.notFound({
      data: e
    });
  }

  const comments = await Comment.query({ postId })
    .paginate(page, perPage);

  const userIds = uniq(comments.map((comment) => comment.userId));

  const users = await User.query({ _id: { $in: userIds } }).all();

  const usersMap = new Map();

  users.forEach((user) => {
    usersMap.set(user['_id'], user);
  });

  comments.forEach((comment) => {
    comment.commiter = usersMap.get(comment.userId);
  });

  return res.ok({
    data: comments
  });
};

/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     tags:
 *       - Private
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *       - required: true
 *         in: body
 *         name: comment
 *         schema:
 *           $ref: "#/definitions/Comment"
 *     summary: Add new Comment.
 *     operationId: postCreate
 *     responses:
 *       422:
 *         $ref: "#/responses/ValidationError"
 *       200:
 *         description: Return new comment.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               $ref: "#/definitions/ResponseStatuses"
 *             data:
 *               type: object
 *               properties:
 *                 comment:
 *                   $ref: "#/definitions/Comment"
 */
exports.postCreate = async ({ request, params, res, currentUser }) => {
  const { body: newComment } = request;
  const { id: postId } = params;

  let post;

  try {
    post = await Post.find({ _id: postId });
  } catch(e) {
    return res.notFound({
      data: e
    });
  }

  try {
    newComment.userId = currentUser['_id'];
    newComment.postId = postId;

    const comment = await Comment.create(newComment);
    comment.commiter = currentUser;

    post.incrementComments();

    return res.ok({
      data: {
        comment
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
 * /comments/{id}:
 *   delete:
 *     tags:
 *       - Private
 *     parameters:
 *       - $ref: "#/parameters/ResourceUuid"
 *     summary: Remove comment.
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
  const { id: commentId } = params;

  try {
    const comment = await Comment.find({ _id: commentId });

    if (currentUser['_id'] !== comment.userId) {
      return res.unauthorized();
    }

    const post = await Post.find({ _id: comment.postId });

    post.decrementComments();

    comment.remove();

    return res.ok();
  } catch(e) {
    return res.notFound({
      data: e
    });
  }
};
