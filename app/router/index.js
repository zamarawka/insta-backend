const Router = require('koa-router');

const docsController = require('../controllers/docs');
const usersController = require('../controllers/users');
const loginController = require('../controllers/login');
const postsController = require('../controllers/posts');
const commentsController = require('../controllers/comments');

const id = require('./params/id');
const auth = require('./guards/auth');
const multipart = require('./guards/multipart');

const router = new Router();

router.get('/', docsController.getApiInfo);

router.post('/login', loginController.postLogin);

router.get('/users', usersController.getIndex);
router.get(`/users/${id.wildcard}`, usersController.getShow);
router.get(`/users/:nickname`, usersController.getShow);
router.put('/users/', auth, multipart.single('avatar'), usersController.putUpdate);
router.post('/users', multipart.single('avatar'), usersController.postCreate);
router.post(`/users/${id.wildcard}/follow`, auth, usersController.postFollow);
router.post(`/users/${id.wildcard}/unfollow`, auth, usersController.postUnfollow);

router.get(`/users/${id.wildcard}/posts`, postsController.getIndex);

router.post('/posts', auth, multipart.single('file'), postsController.postCreate);
router.get(`/posts/${id.wildcard}`, postsController.getShow);
router.put(`/posts/${id.wildcard}`, auth, postsController.putUpdate);
router.post(`/posts/${id.wildcard}/like`, auth, postsController.postLike);
router.post(`/posts/${id.wildcard}/unlike`, auth, postsController.postUnlike);
router.post(`/posts/${id.wildcard}/save`, auth, postsController.postSave);
router.post(`/posts/${id.wildcard}/unsave`, auth, postsController.postUnsave);

router.get(`/posts/${id.wildcard}/comments`, commentsController.getIndex);
router.post(`/posts/${id.wildcard}/comments`, auth, commentsController.postCreate);
router.delete(`/comments/${id.wildcard}`, auth, commentsController.deleteRemove);

router.get('/spec', docsController.getSwaggerSpec);

module.exports = router;
