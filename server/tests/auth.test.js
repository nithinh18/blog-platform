const request = require('supertest');
const { app, createUser, uniqueEmail } = require('./helpers');

describe('Auth: registration validation', () => {
  test('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: uniqueEmail(),
      password: 'weak',
    });
    expect(res.status).toBe(400);
  });

  test('rejects a password missing a special character', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: uniqueEmail(),
      password: 'Password123',
    });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'not-an-email',
      password: 'Str0ng!Passw0rd',
    });
    expect(res.status).toBe(400);
  });

  test('rejects a password that contains the email local-part', async () => {
    const email = uniqueEmail();
    const localPart = email.split('@')[0];
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email,
      password: `${localPart}Aa1!aaaa`,
    });
    expect(res.status).toBe(400);
  });

  test('accepts a strong password and valid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: uniqueEmail(),
      password: 'Str0ng!Passw0rd',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBeTruthy();
  });

  test('rejects registering the same email twice', async () => {
    const email = uniqueEmail();
    const payload = { name: 'Jane Doe', email, password: 'Str0ng!Passw0rd' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
  });
});

describe('Auth: login', () => {
  test('logs in with correct credentials', async () => {
    const { email, password } = await createUser();
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('rejects an incorrect password', async () => {
    const { email } = await createUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'Wr0ng!Password' });
    expect(res.status).toBe(401);
  });

  test('rejects a nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail(), password: 'Str0ng!Passw0rd' });
    expect(res.status).toBe(401);
  });
});

describe('Auth: strict site-wide login gate', () => {
  test('rejects GET /api/posts with no token', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(401);
  });

  test('rejects GET /api/posts/:id with no token', async () => {
    const res = await request(app).get('/api/posts/000000000000000000000000');
    expect(res.status).toBe(401);
  });

  test('rejects GET /api/comments/:postId with no token', async () => {
    const res = await request(app).get('/api/comments/000000000000000000000000');
    expect(res.status).toBe(401);
  });

  test('allows GET /api/posts with a valid token', async () => {
    const { token } = await createUser();
    const res = await request(app).get('/api/posts').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('rejects a garbage token', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('Auth: profile + account', () => {
  test('GET /api/auth/me returns the logged-in user', async () => {
    const { token, email } = await createUser();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email.toLowerCase());
  });

  test('DELETE /api/auth/account requires the correct password', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('DELETE /api/auth/account deletes the account with the correct password', async () => {
    const { token, password } = await createUser();
    const res = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password });
    expect(res.status).toBe(200);

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(401);
  });
});
