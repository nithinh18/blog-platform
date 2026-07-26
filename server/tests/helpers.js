const request = require('supertest');
const createApp = require('../app');

const app = createApp();

let counter = 0;
// Accounts are Gmail-only (see server/validators/authValidators.js), so
// test fixtures need a real-looking gmail.com address to pass validation.
const uniqueEmail = () => {
  counter += 1;
  return `blogtestuser${Date.now()}${counter}@gmail.com`;
};

// Registers a fresh user and returns { token, user, email, password }.
const createUser = async (overrides = {}) => {
  const email = overrides.email || uniqueEmail();
  const password = overrides.password || 'Str0ng!Passw0rd';
  // "Test User" would be rejected by the placeholder-name filter — needs a
  // name that reads as a real one.
  const name = overrides.name || 'Riya Sharma';

  const res = await request(app).post('/api/auth/register').send({ name, email, password });
  return { token: res.body.token, user: res.body.user, email, password, res };
};

module.exports = { app, createUser, uniqueEmail };
