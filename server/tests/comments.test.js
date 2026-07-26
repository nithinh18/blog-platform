const request = require('supertest');
const { app, createUser } = require('./helpers');

const authed = (token) => (req) => req.set('Authorization', `Bearer ${token}`);

const createPost = async (token) => {
  const res = await authed(token)(request(app).post('/api/posts')).send({
    title: 'Post for comments',
    content: 'This post exists so we can comment on it.',
    category: 'General',
  });
  return res.body.post._id;
};

describe('Comments: CRUD + threading', () => {
  test('adds a comment and it shows up threaded (as a root)', async () => {
    const { token } = await createUser();
    const postId = await createPost(token);

    const addRes = await authed(token)(request(app).post(`/api/comments/${postId}`)).send({
      comment: 'Nice post!',
    });
    expect(addRes.status).toBe(201);

    const listRes = await authed(token)(request(app).get(`/api/comments/${postId}`));
    expect(listRes.status).toBe(200);
    expect(listRes.body.comments.length).toBe(1);
    expect(listRes.body.comments[0].comment).toBe('Nice post!');
    expect(listRes.body.comments[0].replies).toEqual([]);
  });

  test('a reply is nested under its parent comment', async () => {
    const { token: authorToken } = await createUser();
    const { token: replierToken } = await createUser();
    const postId = await createPost(authorToken);

    const rootRes = await authed(authorToken)(request(app).post(`/api/comments/${postId}`)).send({
      comment: 'Root comment',
    });
    const parentId = rootRes.body.comment._id;

    const replyRes = await authed(replierToken)(
      request(app).post(`/api/comments/${postId}`)
    ).send({ comment: 'A reply', parentId });
    expect(replyRes.status).toBe(201);

    const listRes = await authed(authorToken)(request(app).get(`/api/comments/${postId}`));
    expect(listRes.body.comments.length).toBe(1);
    expect(listRes.body.comments[0].replies.length).toBe(1);
    expect(listRes.body.comments[0].replies[0].comment).toBe('A reply');
  });

  test('only the comment author can edit or delete it', async () => {
    const { token: authorToken } = await createUser();
    const { token: otherToken } = await createUser();
    const postId = await createPost(authorToken);

    const addRes = await authed(authorToken)(request(app).post(`/api/comments/${postId}`)).send({
      comment: 'Original comment',
    });
    const commentId = addRes.body.comment._id;

    const editRes = await authed(otherToken)(request(app).put(`/api/comments/${commentId}`)).send({
      comment: 'Hijacked',
    });
    expect(editRes.status).toBe(403);

    const deleteRes = await authed(otherToken)(request(app).delete(`/api/comments/${commentId}`));
    expect(deleteRes.status).toBe(403);
  });

  test('liking a comment toggles the like count', async () => {
    const { token } = await createUser();
    const postId = await createPost(token);

    const addRes = await authed(token)(request(app).post(`/api/comments/${postId}`)).send({
      comment: 'Like me',
    });
    const commentId = addRes.body.comment._id;

    const likeRes = await authed(token)(request(app).post(`/api/comments/${commentId}/like`));
    expect(likeRes.status).toBe(200);
    expect(likeRes.body.likeCount).toBe(1);
  });
});

describe('Reports', () => {
  test('a user can report a post, and cannot report the same post twice while open', async () => {
    const { token: authorToken } = await createUser();
    const { token: reporterToken } = await createUser();
    const postId = await createPost(authorToken);

    const firstReport = await authed(reporterToken)(
      request(app).post(`/api/reports/post/${postId}`)
    ).send({ reason: 'This is spam' });
    expect(firstReport.status).toBe(201);

    const secondReport = await authed(reporterToken)(
      request(app).post(`/api/reports/post/${postId}`)
    ).send({ reason: 'Still spam' });
    expect(secondReport.status).toBe(400);
  });

  test('rejects a report with no reason', async () => {
    const { token: authorToken } = await createUser();
    const { token: reporterToken } = await createUser();
    const postId = await createPost(authorToken);

    const res = await authed(reporterToken)(request(app).post(`/api/reports/post/${postId}`)).send({});
    expect(res.status).toBe(400);
  });
});
