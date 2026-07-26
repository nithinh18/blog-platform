const request = require('supertest');
const { app, createUser } = require('./helpers');

const authed = (token) => (req) => req.set('Authorization', `Bearer ${token}`);

describe('Posts: CRUD', () => {
  test('creates a post and can read it back', async () => {
    const { token } = await createUser();

    const createRes = await authed(token)(request(app).post('/api/posts')).send({
      title: 'My First Post',
      content: 'Hello world, this is a test post with enough content.',
      category: 'Technology',
      tags: JSON.stringify(['test', 'first']),
    });
    expect(createRes.status).toBe(201);
    const postId = createRes.body.post._id;
    expect(createRes.body.post.slug).toBeTruthy();
    expect(createRes.body.post.readingTime).toBeGreaterThanOrEqual(1);

    const getRes = await authed(token)(request(app).get(`/api/posts/${postId}`));
    expect(getRes.status).toBe(200);
    expect(getRes.body.post.title).toBe('My First Post');
  });

  test('rejects creating a post without a title', async () => {
    const { token } = await createUser();
    const res = await authed(token)(request(app).post('/api/posts')).send({
      content: 'Missing a title',
      category: 'General',
    });
    expect(res.status).toBe(400);
  });

  test('only the owner (or admin) can update a post', async () => {
    const { token } = await createUser();
    const { token: otherToken } = await createUser();

    const createRes = await authed(token)(request(app).post('/api/posts')).send({
      title: 'Owned Post',
      content: 'Content that belongs to the first user.',
      category: 'General',
    });
    const postId = createRes.body.post._id;

    const updateRes = await authed(otherToken)(request(app).put(`/api/posts/${postId}`)).send({
      title: 'Hijacked title',
    });
    expect(updateRes.status).toBe(403);
  });

  test('records a revision when editing content', async () => {
    const { token } = await createUser();

    const createRes = await authed(token)(request(app).post('/api/posts')).send({
      title: 'Original Title',
      content: 'Original content.',
      category: 'General',
    });
    const postId = createRes.body.post._id;

    const updateRes = await authed(token)(request(app).put(`/api/posts/${postId}`)).send({
      title: 'Updated Title',
    });
    expect(updateRes.status).toBe(200);

    const revisionsRes = await authed(token)(request(app).get(`/api/posts/${postId}/revisions`));
    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.revisions.length).toBe(1);
    expect(revisionsRes.body.revisions[0].title).toBe('Original Title');
  });

  test('deletes a post (owner only)', async () => {
    const { token } = await createUser();
    const createRes = await authed(token)(request(app).post('/api/posts')).send({
      title: 'To Be Deleted',
      content: 'This post will be deleted.',
      category: 'General',
    });
    const postId = createRes.body.post._id;

    const deleteRes = await authed(token)(request(app).delete(`/api/posts/${postId}`));
    expect(deleteRes.status).toBe(200);

    const getRes = await authed(token)(request(app).get(`/api/posts/${postId}`));
    expect(getRes.status).toBe(404);
  });
});

describe('Posts: scheduled publishing', () => {
  test('a future-scheduled post is hidden from the public list but visible to its owner', async () => {
    const { token } = await createUser();
    const { token: otherToken } = await createUser();

    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const createRes = await authed(token)(request(app).post('/api/posts')).send({
      title: 'Scheduled Post',
      content: 'This should not be publicly visible yet.',
      category: 'General',
      scheduledFor: future,
    });
    expect(createRes.status).toBe(201);
    const postId = createRes.body.post._id;

    const otherGetRes = await authed(otherToken)(request(app).get(`/api/posts/${postId}`));
    expect(otherGetRes.status).toBe(404);

    const ownerGetRes = await authed(token)(request(app).get(`/api/posts/${postId}`));
    expect(ownerGetRes.status).toBe(200);

    const listRes = await authed(otherToken)(request(app).get('/api/posts'));
    const found = listRes.body.posts.find((p) => p._id === postId);
    expect(found).toBeUndefined();
  });
});

describe('Posts: likes, bookmarks, polls', () => {
  test('toggling a like increments and decrements the count', async () => {
    const { token: authorToken } = await createUser();
    const { token: readerToken } = await createUser();

    const createRes = await authed(authorToken)(request(app).post('/api/posts')).send({
      title: 'Likeable Post',
      content: 'Please like this post.',
      category: 'General',
    });
    const postId = createRes.body.post._id;

    const likeRes = await authed(readerToken)(request(app).post(`/api/posts/${postId}/like`));
    expect(likeRes.status).toBe(200);
    expect(likeRes.body.likeCount).toBe(1);
    expect(likeRes.body.isLiked).toBe(true);

    const unlikeRes = await authed(readerToken)(request(app).post(`/api/posts/${postId}/like`));
    expect(unlikeRes.body.likeCount).toBe(0);
    expect(unlikeRes.body.isLiked).toBe(false);
  });

  test('bookmarking a post shows up in the bookmarks list', async () => {
    const { token: authorToken } = await createUser();
    const { token: readerToken } = await createUser();

    const createRes = await authed(authorToken)(request(app).post('/api/posts')).send({
      title: 'Bookmarkable Post',
      content: 'Please bookmark this post.',
      category: 'General',
    });
    const postId = createRes.body.post._id;

    await authed(readerToken)(request(app).post(`/api/posts/${postId}/bookmark`));

    const bookmarksRes = await authed(readerToken)(request(app).get('/api/posts/bookmarks/mine'));
    expect(bookmarksRes.status).toBe(200);
    expect(bookmarksRes.body.posts.some((p) => p._id === postId)).toBe(true);
  });

  test('voting on a poll records the vote and switching votes replaces it', async () => {
    const { token } = await createUser();

    const createRes = await authed(token)(request(app).post('/api/posts')).send({
      title: 'Poll Post',
      content: 'Vote on this poll.',
      category: 'General',
      poll: JSON.stringify({ question: 'Best language?', options: ['JS', 'Python'] }),
    });
    const postId = createRes.body.post._id;

    const voteRes = await authed(token)(request(app).post(`/api/posts/${postId}/poll/vote`)).send({
      optionIndex: 0,
    });
    expect(voteRes.status).toBe(200);
    expect(voteRes.body.poll.options[0].voteCount).toBe(1);
    expect(voteRes.body.poll.totalVotes).toBe(1);

    const switchRes = await authed(token)(request(app).post(`/api/posts/${postId}/poll/vote`)).send({
      optionIndex: 1,
    });
    expect(switchRes.body.poll.options[0].voteCount).toBe(0);
    expect(switchRes.body.poll.options[1].voteCount).toBe(1);
    expect(switchRes.body.poll.totalVotes).toBe(1);
  });
});
