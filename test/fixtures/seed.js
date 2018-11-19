const path = require('path');

const getPost = (model) => ({
  text: 'some post text',
  ...model
});

const getUser = (model = {}) => ({
  name: 'Some user',
  nickname: 'some_user',
  password: 'some_pass',
  ...model
});

const getComment = (model = {}) => ({
  text: 'Some text',
  ...model
});

const getToken = async (request) => {
  const res = await request
    .post('/users')
    .send(getUser({
      name: `${Math.random()}`,
      nickname: `${Math.random()}`,
      password: '123',
    }))
    .expect(200);

  return res.body.data;
};

const createPost = async (request, token) => {
  const res = await request
    .post('/posts')
    .set('Authorization', token)
    .set('Content-Type', 'multipart/form-data')
    .field('text', getPost().text)
    .attach('file', path.resolve(__dirname, '../fixtures/post-image.png'))
    .expect(200);

  return res.body.data;
};

const createComment = async (request, token, postId) => {
  const res = await request
    .post(`/posts/${postId}/comments`)
    .set('Authorization', token)
    .send(getComment())
    .expect('Content-Type', /json/)
    .expect(200);

  return res.body.data;
};

module.exports = {
  getPost,
  getUser,
  getComment,
  getToken,
  createPost,
  createComment
};
