const uuid = require('uuid/v4');

const supertest = require('supertest');
const app = require('../../app');

const { getComment, createPost, getToken, createComment } = require('../fixtures/seed');

describe('Comments', () => {
  const request = supertest(app.listen());

  describe('POST /posts/:postId/comments', () => {
    it('<404> should throw not found error', async () => {
      const postId = uuid();

      const { token } = await getToken(request);

      const res = await request
        .post(`/posts/${postId}/comments`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(404);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('name', 'DatabaseError');
    });

    it('<422> should throw validation error and return 422', async () => {
      const { token } = await getToken(request);
      const { post } = await createPost(request, token);

      const res = await request
        .post(`/posts/${post['_id']}/comments`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(422);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('name', 'ValidationError');
    });

    it('<200> should add user and return 200', async () => {
      const { token, user } = await getToken(request);
      const { post } = await createPost(request, token);

      const newComment = getComment();

      const res = await request
        .post(`/posts/${post['_id']}/comments`)
        .set('Authorization', token)
        .send(newComment)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('comment');
      expect(data.comment).toHaveProperty('text', newComment.text);
      expect(data.comment).toHaveProperty('postId', post['_id']);
      expect(data.comment).toHaveProperty('userId', user['_id']);

      const resPost = await request
        .get(`/posts/${post['_id']}`)
        .expect(200);

      const { data: postData } = resPost.body;

      expect(postData.post).toHaveProperty('feedback');
      expect(postData.post.feedback).toHaveProperty('comments', post.feedback.comments + 1);
    });
  });

  describe('GET /posts/:postId/comments', () => {
    it('<404> shold throw not found error', async () => {
      const res = await request
        .get(`/posts/${uuid()}/comments`)
        .expect('Content-Type', /json/)
        .expect(404);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('name', 'DatabaseError');
    });

    it('<200> shold return array of comments by post id', async () => {
      const { token } = await getToken(request);
      const { post } = await createPost(request, token);
      const comments = await Promise.all([
        createComment(request, token, post['_id']).then(({ comment }) => comment),
        createComment(request, token, post['_id']).then(({ comment }) => comment),
        createComment(request, token, post['_id']).then(({ comment }) => comment)
      ]);

      const res = await request
        .get(`/posts/${post['_id']}/comments`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toContainEqual(comments[0]);
      expect(data).toContainEqual(comments[1]);
      expect(data).toContainEqual(comments[2]);
    });
  });

  describe('DELETE /comments/:commentId', () => {
    it('<404> should throw not found error', async () => {
      const { token } = await getToken(request);

      const res = await request
        .delete(`/comments/${uuid()}`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(404);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<401> should throw unauthorized error', async () => {
      const { token } = await getToken(request);
      const { post } = await createPost(request, token);
      const { comment } = await createComment(request, token, post['_id']);

      const { token: otherToken } = await getToken(request);

      const res = await request
        .delete(`/comments/${comment['_id']}`)
        .set('Authorization', otherToken)
        .expect('Content-Type', /json/)
        .expect(401);

      const { status } = res.body;

      expect(status).toBe('fail');
    });

    it('<200> should return 200 if success', async () => {
      const { token } = await getToken(request);
      const { post } = await createPost(request, token);
      const { comment } = await createComment(request, token, post['_id']);

      const res = await request
        .delete(`/comments/${comment['_id']}`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const resPost = await request
        .get(`/posts/${post['_id']}`)
        .expect(200);

      const { data: postData } = resPost.body;

      expect(postData.post).toHaveProperty('feedback');
      expect(postData.post.feedback).toHaveProperty('comments', post.feedback.comments);
    });
  });
});
