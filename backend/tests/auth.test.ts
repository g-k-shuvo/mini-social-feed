import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, signUp, auth } from './helpers';

describe('auth', () => {
  it('signs up and returns a usable session', async () => {
    const a = await signUp('priyatest');
    expect(a.token).toBeTruthy();
    const me = await request(app).get('/api/v1/auth/me').set(auth(a)).expect(200);
    expect(me.body.data.username).toBe('priyatest');
  });

  it('rejects a duplicate username with USERNAME_TAKEN', async () => {
    await signUp('takenname');
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'takenname', email: 'other@example.com', password: 'correcthorse9' })
      .expect(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  it('rejects a duplicate email with EMAIL_TAKEN', async () => {
    await signUp('firstuser');
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'seconduser', email: 'firstuser@example.com', password: 'correcthorse9' })
      .expect(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('gives the same answer for a wrong password and a missing account', async () => {
    await signUp('realuser');
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'realuser', password: 'notthepassword1' })
      .expect(401);
    const noSuchUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'ghostuser', password: 'notthepassword1' })
      .expect(401);

    // Identical code and message: the response must not reveal which accounts exist.
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(noSuchUser.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.body.error.message).toBe(noSuchUser.body.error.message);
  });

  it('logs in with either username or email', async () => {
    await signUp('eitherway');
    for (const identifier of ['eitherway', 'eitherway@example.com']) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier, password: 'correcthorse9' })
        .expect(200);
    }
  });

  /** Case 4 of the PRD's named list. */
  it('revokes the whole family when a rotated refresh token is replayed', async () => {
    const a = await signUp();

    const first = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: a.refreshToken })
      .expect(200);
    const rotated = first.body.data.refreshToken as string;

    // Replaying the spent token is the signature of a stolen token.
    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: a.refreshToken })
      .expect(401);
    expect(replay.body.error.code).toBe('REFRESH_TOKEN_INVALID');

    // ...and it takes the legitimate rotated token down with it.
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: rotated }).expect(401);
  });

  it('rejects weak passwords with the message the user will read', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'weakpass', email: 'weak@example.com', password: 'short' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('at least 8 characters');
  });

  it('logout always succeeds, even with nothing to revoke', async () => {
    const a = await signUp();
    await request(app).post('/api/v1/auth/logout').set(auth(a)).send({}).expect(204);
  });

  it('refuses a request with no token', async () => {
    const res = await request(app).get('/api/v1/posts').expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
