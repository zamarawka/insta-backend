const path = require('path');
const supertest = require('supertest');
const app = require('../../app');

const { getUser } = require('../fixtures/seed');

let userModel = null;
let token = null;

describe('Users', () => {
  const request = supertest(app.listen());

  describe('POST /users', () => {
    it('<422> should throw validation error and return 422', async () => {
      const res = await request
        .post('/users')
        .expect('Content-Type', /json/)
        .expect(422);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
    });

    it('<200> should add user and return 200', async () => {
      const newUser = getUser();

      const res = await request
        .post('/users')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user).toHaveProperty('nickname', newUser.nickname);
      expect(data.user).toHaveProperty('name', newUser.name);
      expect(data.user).toHaveProperty('avatar', null);

      userModel = data.user;
      token = data.token;
    });

    it('<200> should add user via multipart return 200', async () => {
      const newUser = getUser({
        nickname: 'user_via_multipart'
      });

      const req = request
        .post('/users')
        .set('Content-Type', 'multipart/form-data');

      Object.keys(newUser).forEach((item) => {
        req.field(item, newUser[item]);
      });

      const res = await req
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user).toHaveProperty('nickname', newUser.nickname);
      expect(data.user).toHaveProperty('name', newUser.name);
      expect(data.user).toHaveProperty('avatar', null);
    });

    it('<200> should add user with avatar and return 200', async () => {
      const newUser = getUser({
        nickname: 'user_with_avatar'
      });

      const req = request
        .post('/users')
        .attach('avatar', path.resolve(__dirname, '../fixtures/post-image.png'))
        .set('Content-Type', 'multipart/form-data');

      Object.keys(newUser).forEach((item) => {
        req.field(item, newUser[item]);
      });

      const res = await req
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user).toHaveProperty('nickname', newUser.nickname);
      expect(data.user).toHaveProperty('name', newUser.name);
      expect(data.user).toHaveProperty('avatar');
      expect(data.user.avatar).toEqual(expect.stringContaining('.png'));
    });

    it('<422> should throw error for uniq and return 422', async () => {
      const newUser = getUser({
        nickname: 'uniq_user'
      });

      await request
        .post('/users')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(200);

      const res = await request
        .post('/users')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(422);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('name', 'DatabaseError');
      expect(data).toHaveProperty('errors');
    });
  });

  describe('POST /login', () => {
    it('<200> should login as user', async () => {
      const user = getUser();

      const res = await request
        .post('/login')
        .send({
          nickname: user.nickname,
          password: user.password
        })
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
    });

    it('<404> should get error then try login', async () => {
      const user = getUser();

      const res = await request
        .post('/login')
        .send({
          nickname: user.nickname,
          password: `${user.password}123`
        })
        .expect('Content-Type', /json/)
        .expect(404);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
    });

    it('<404> should get error then try login', async () => {
      const user = getUser();

      const res = await request
        .post('/login')
        .send({
          nickname: `3245${user.nickname}423`,
          password: `${user.password}123`
        })
        .expect('Content-Type', /json/)
        .expect(404);

      const { data, status } = res.body;

      expect(status).toBe('fail');
      expect(data).toHaveProperty('errors');
    });
  });

  describe('PUT /users/:id', () => {
    it('<200> should update user and return 200', async () => {
      const newUser = {
        nickname: 'angie'
      };

      const res = await request
        .put(`/users`)
        .set('Authorization', token)
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('_id', userModel['_id']);
      expect(data.user).toHaveProperty('nickname', newUser.nickname);
      expect(data.user).toHaveProperty('name', userModel.name);

      userModel.nickname = newUser.nickname;
    });

    it('<200> should update user avatar and return 200', async () => {
      const newUser = {
        nickname: 'angie'
      };

      const res = await request
        .put(`/users`)
        .set('Authorization', token)
        .set('Content-Type', 'multipart/form-data')
        .attach('avatar', path.resolve(__dirname, '../fixtures/post-image.png'))
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('_id', userModel['_id']);
      expect(data.user).toHaveProperty('nickname', newUser.nickname);
      expect(data.user).toHaveProperty('avatar');
      expect(data.user.avatar).toEqual(expect.stringContaining('.png'));

      userModel.nickname = newUser.nickname;
    });

    it('<200> should update user via multipart and return 200', async () => {
      const newUser = {
        nickname: 'angie',
        name: 'some-angie'
      };

      const res = await request
        .put(`/users`)
        .set('Authorization', token)
        .set('Content-Type', 'multipart/form-data')
        .field('name', newUser.name)
        .field('avatar', 'null')
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('_id', userModel['_id']);
      expect(data.user).toHaveProperty('nickname', newUser.nickname);
      expect(data.user).toHaveProperty('name', newUser.name);
      expect(data.user).toHaveProperty('avatar');
      expect(data.user.avatar).toEqual(null);

      userModel.nickname = newUser.nickname;
      userModel.name = newUser.name;
    });

    it('<200> should update user password and login by it', async () => {
      const newUser = {
        password: 'other_pass'
      };

      const res = await request
        .put(`/users`)
        .set('Authorization', token)
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(200);

      const { data, status } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('_id', userModel['_id']);
      expect(data.user).toHaveProperty('nickname', userModel.nickname);

      const logRes = await request
        .post('/login')
        .send({
          nickname: userModel.nickname,
          password: newUser.password
        })
        .expect(200);

      const { data: logData, status: logStatus } = logRes.body;

      expect(logStatus).toBe('success');
      expect(logData).toHaveProperty('token');
      expect(logData).toHaveProperty('user');
    });
  });

  describe('GET /users', () => {
    it('<200> should always return with the API users information', async () => {
      const res = await request
        .get('/users')
        .expect('Content-Type', /json/)
        .expect(200);

      const { status, data } = res.body;

      expect(status).toBe('success');
      expect(data).toContainEqual(
        expect.objectContaining({
          _id: expect.any(String),
          nickname: expect.any(String),
          name: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      );
    });

    it('<200> should always return empty array on 2nd page', async () => {
      const res = await request
        .get('/users')
        .query({ page: 2 })
        .expect('Content-Type', /json/)
        .expect(200);

      const { status, data } = res.body;

      expect(status).toBe('success');
      expect(data).toEqual([]);
    });

    it('<200> should always return one user model from 2nd page', async () => {
      const otherUser = getUser({
        nickname: 'other_user'
      });

      await request
        .post(`/users`)
        .send(otherUser)
        .expect(200);

      const res = await request
        .get('/users')
        .query({ page: 2, perPage: 1 })
        .expect('Content-Type', /json/)
        .expect(200);

      const { status, data } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(expect.objectContaining({
        _id: expect.any(String),
        nickname: expect.any(String),
        name: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }));
    });
  });

  describe('GET /users/:id', () => {
    it('<200> should always return with the API user information by id', async () => {
      const res = await request
        .get(`/users/${userModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status, data } = res.body;

      expect(status).toBe('success');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('nickname');
      expect(data.user).toHaveProperty('_id');
    });
  });

  describe('POST /users/:id/follow', () => {
    it('<200> should return true if seccusful follow', async () => {
      const newUser = getUser({
        nickname: 'follow_user'
      });

      const userRes = await request
        .post(`/users`)
        .send(newUser)
        .expect(200);

      const userFollowId = userRes.body.data.user['_id'];

      const res = await request
        .post(`/users/${userFollowId}/follow`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const curUser = await request
        .get(`/users/${userModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { user } = curUser.body.data;

      expect(user).toHaveProperty('following');
      expect(user.following).toContain(userFollowId);

      const otherUserRes = await request
        .get(`/users/${userFollowId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { user: otherUser } = otherUserRes.body.data;

      expect(otherUser).toHaveProperty('followers');
      expect(otherUser.followers).toContain(userModel['_id']);
    });
  });

  describe('POST /users/:id/unfollow', () => {
    it('<200> should return true if seccusful unfollow', async () => {
      const newUser = getUser({
        nickname: 'unfollow_user'
      });

      const userRes = await request
        .post(`/users`)
        .send(newUser)
        .expect(200);

      const userUnfollowId = userRes.body.data.user['_id'];

      await request
        .post(`/users/${userUnfollowId}/follow`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const res = await request
        .post(`/users/${userUnfollowId}/unfollow`)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const { status } = res.body;

      expect(status).toBe('success');

      const curUser = await request
        .get(`/users/${userModel['_id']}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { user } = curUser.body.data;

      expect(user).toHaveProperty('following');
      expect(user.following).not.toContain(userUnfollowId);

      const otherUserRes = await request
        .get(`/users/${userUnfollowId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const { user: otherUser } = otherUserRes.body.data;

      expect(otherUser).toHaveProperty('followers');
      expect(otherUser.followers).not.toContain(userModel['_id']);
    });
  });
});
