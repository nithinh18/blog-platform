require('dotenv').config();
const mongoose = require('mongoose');

// The dev email stub logs every "sent" email — expected noise in tests.
jest.spyOn(console, 'log').mockImplementation(() => {});

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
