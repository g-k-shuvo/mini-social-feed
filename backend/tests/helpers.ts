import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';

export const app: Express = createApp();

export interface Account {
  id: string;
  username: string;
  token: string;
  refreshToken: string;
}

let counter = 0;

export async function signUp(username?: string): Promise<Account> {
  counter += 1;
  const name = username ?? `user${counter}${Date.now().toString(36).slice(-4)}`;
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({ username: name, email: `${name}@example.com`, password: 'correcthorse9' })
    .expect(201);

  return {
    id: res.body.data.user.id,
    username: res.body.data.user.username,
    token: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}

export const auth = (a: Account) => ({ Authorization: `Bearer ${a.token}` });

export async function createPost(a: Account, content = 'A post.'): Promise<string> {
  const res = await request(app)
    .post('/api/v1/posts')
    .set(auth(a))
    .send({ content })
    .expect(201);
  return res.body.data.id;
}
