const request = require('supertest');
const { app, createUser, uniqueEmail } = require('./helpers');

describe('Email OTP: signup verification', () => {
  test('registering returns a dev OTP and an unverified account', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Riya Sharma',
      email,
      password: 'Str0ng!Passw0rd',
    });
    expect(res.status).toBe(201);
    expect(res.body.devOtp).toMatch(/^\d{6}$/);
    expect(res.body.user.emailVerified).toBe(false);
  });

  test('rejects an incorrect verification code', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post('/api/auth/verify-email-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(400);
  });

  test('confirms email with the correct OTP', async () => {
    const email = uniqueEmail();
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Riya Sharma',
      email,
      password: 'Str0ng!Passw0rd',
    });
    const { token, devOtp } = registerRes.body;

    const res = await request(app)
      .post('/api/auth/verify-email-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: devOtp });
    expect(res.status).toBe(200);
    expect(res.body.user.emailVerified).toBe(true);
  });
});

describe('Email OTP: forgot password', () => {
  test('resets the password with the emailed code and allows login with it', async () => {
    const { email } = await createUser();

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.devOtp).toMatch(/^\d{6}$/);

    const resetRes = await request(app).post('/api/auth/reset-password-otp').send({
      email,
      code: forgotRes.body.devOtp,
      password: 'N3w!StrongPass',
    });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'N3w!StrongPass' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });

  test('rejects an incorrect reset code', async () => {
    const { email } = await createUser();
    await request(app).post('/api/auth/forgot-password').send({ email });

    const res = await request(app).post('/api/auth/reset-password-otp').send({
      email,
      code: '000000',
      password: 'N3w!StrongPass',
    });
    expect(res.status).toBe(400);
  });
});

describe('Email OTP: passwordless login', () => {
  test('logs in with a requested code, no password needed', async () => {
    const { email } = await createUser();

    const requestRes = await request(app).post('/api/auth/otp/request-login').send({ email });
    expect(requestRes.status).toBe(200);
    expect(requestRes.body.devOtp).toMatch(/^\d{6}$/);

    const loginRes = await request(app)
      .post('/api/auth/otp/login')
      .send({ email, code: requestRes.body.devOtp });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(email.toLowerCase());
  });

  test('does not leak whether an email is registered', async () => {
    const res = await request(app)
      .post('/api/auth/otp/request-login')
      .send({ email: uniqueEmail() });
    expect(res.status).toBe(200);
    expect(res.body.devOtp).toBeUndefined();
  });
});

describe('Email OTP: as a 2FA method', () => {
  test('enabling email 2FA requires the confirmation code, then gates login', async () => {
    const { token, email, password } = await createUser();

    const setupRes = await request(app)
      .post('/api/auth/2fa/email/enable')
      .set('Authorization', `Bearer ${token}`);
    expect(setupRes.status).toBe(200);
    expect(setupRes.body.devOtp).toMatch(/^\d{6}$/);

    const confirmRes = await request(app)
      .post('/api/auth/2fa/email/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: setupRes.body.devOtp });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.backupCodes.length).toBeGreaterThan(0);

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.requires2FA).toBe(true);
    expect(loginRes.body.method).toBe('email');
    expect(loginRes.body.devOtp).toMatch(/^\d{6}$/);

    const verifyRes = await request(app).post('/api/auth/2fa/verify-login').send({
      challengeToken: loginRes.body.challengeToken,
      code: loginRes.body.devOtp,
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeTruthy();
  });
});

describe('Google sign-in', () => {
  test('fails cleanly when GOOGLE_CLIENT_ID is not configured', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'fake-credential' });
    expect(res.status).toBe(501);
  });
});
