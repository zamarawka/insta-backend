const uuid = require('uuid/v4');
const path = require('path');
const supertest = require('supertest');

const app = require('../../app');

const { getPost, getToken } = require('../fixtures/seed');

let postModel = null;

describe('Posts', () => {
  const request = supertest(app.listen());

  describe('POST /posts', () => {
    it('<401> should throw auth error', async () => {
      const res = await request
        .post('/posts')
        .send(getPost())
        .expect('Content-Type', /json/)
        .expect(401);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<422> should throw validation error', async () => {
      const { token } = await getToken(request);

      const res = await request
        .post('/posts')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(422);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');

      const { errors } = data;

      expect(errors).toHaveProperty('file');
    });

    it('<200> should add new post and return post', async () => {
      const { token, user } = await getToken(request);
      const mockedPost = getPost();

      const res = await request
        .post('/posts')
        .set('Authorization', token)
        .set('Content-Type', 'multipart/form-data')
        .field('text', mockedPost.text)
        .attach('file', path.resolve(__dirname, '../fixtures/post-image.png'))
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('post');
      expect(data.post).toHaveProperty('userId', user['_id']);

      const resUser = await request
        .get(`/users/${user['_id']}`)
        .expect(200);

      const { data: userData } = resUser.body;

      expect(userData).toHaveProperty('user');
      expect(userData.user).toHaveProperty('counters');
      expect(userData.user.counters).toHaveProperty('posts', user.counters.posts + 1);

      const resComments = await request
        .get(`/posts/${data.post['_id']}/comments`)
        .expect(200);

      const { data: commentsData } = resComments.body;

      expect(commentsData).toMatchObject([{
        text: mockedPost.text
      }]);

      postModel = data.post;
    });
  });

  describe('GET /posts/:id', () => {
    it('<404> should throw error', async () => {
      const postId = uuid();

      const res = await request
        .get(`/posts/${postId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('name', 'DatabaseError');
    });

    it('<200> should return post by id', async () => {
      const postId = postModel['_id'];

      const res = await request
        .get(`/posts/${postId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('post');
      expect(data.post).toHaveProperty('_id', postId);
    });
  });

  describe('GET /users/:id/posts', () => {
    it('<404> should throw error if user not found', async () => {
      const userId = uuid();

      const res = await request
        .get(`/users/${userId}/posts`)
        .expect('Content-Type', /json/)
        .expect(404);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('name', 'DatabaseError');
    });

    it('<200> should return posts list by userId', async () => {
      const userId = postModel.userId;

      const res = await request
        .get(`/users/${userId}/posts`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toContainEqual(postModel);
    });
  });

  describe('POST /posts/:id/like', () => {
    it('<404> should throw not found', async () => {
      const { token } = await getToken(request);

      const res = await request
        .post(`/posts/${uuid()}/like`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(404);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<200> should return success on liked post', async () => {
      const { token, user } = await getToken(request);

      const res = await request
        .post(`/posts/${postModel['_id']}/like`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const resPost = await request
        .get(`/posts/${postModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status: postStatus, data: postData } = resPost.body;

      expect(postStatus).toBe('success');
      expect(postData.post).toHaveProperty('feedback');
      expect(postData.post.feedback).toHaveProperty('likes');
      expect(postData.post.feedback.likes).toContain(user['_id']);
    });
  });

  describe('POST /posts/:id/unlike', () => {
    it('<404> should throw not found', async () => {
      const { token } = await getToken(request);

      const res = await request
        .post(`/posts/${uuid()}/unlike`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(404);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<200> should return success on unliked post', async () => {
      const { token, user } = await getToken(request);

      const res = await request
        .post(`/posts/${postModel['_id']}/unlike`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const resPost = await request
        .get(`/posts/${postModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status: postStatus, data: postData } = resPost.body;

      expect(postStatus).toBe('success');
      expect(postData.post).toHaveProperty('feedback');
      expect(postData.post.feedback).toHaveProperty('likes');
      expect(postData.post.feedback.likes).not.toContain(user['_id']);
    });
  });

  describe('POST /posts/:id/save', () => {
    it('<404> should throw not found', async () => {
      const { token } = await getToken(request);

      const res = await request
        .post(`/posts/${uuid()}/save`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(404);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<200> should return success on saved post', async () => {
      const { token, user } = await getToken(request);

      const res = await request
        .post(`/posts/${postModel['_id']}/save`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const resPost = await request
        .get(`/posts/${postModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status: postStatus, data: postData } = resPost.body;

      expect(postStatus).toBe('success');
      expect(postData.post).toHaveProperty('feedback');
      expect(postData.post.feedback).toHaveProperty('saves');
      expect(postData.post.feedback.saves).toContain(user['_id']);
    });
  });

  describe('POST /posts/:id/unsave', () => {
    it('<404> should throw not found', async () => {
      const { token } = await getToken(request);

      const res = await request
        .post(`/posts/${uuid()}/unsave`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(404);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<200> should return success on unsaved post', async () => {
      const { token, user } = await getToken(request);

      const res = await request
        .post(`/posts/${postModel['_id']}/unsave`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const resPost = await request
        .get(`/posts/${postModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status: postStatus, data: postData } = resPost.body;

      expect(postStatus).toBe('success');
      expect(postData.post).toHaveProperty('feedback');
      expect(postData.post.feedback).toHaveProperty('saves');
      expect(postData.post.feedback.saves).not.toContain(user['_id']);
    });
  });
});
