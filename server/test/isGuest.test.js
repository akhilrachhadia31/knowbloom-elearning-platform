import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import dotenv from 'dotenv';
import isGuest from '../middlewares/isGuest.js';

dotenv.config();
process.env.SECRET_KEY = process.env.SECRET_KEY || 'testsecret';

// Dummy login handler used to verify that the request proceeds
const loginHandler = (_req, res) => {
  res.status(200).json({ success: true });
};

test('login succeeds when stale token cookie is present', async () => {
  const app = express();
  app.post('/login', isGuest, loginHandler);

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/login`, {
    method: 'POST',
    headers: { Cookie: 'token=staletoken' },
  });

  const body = await response.json();
  const setCookie = response.headers.get('set-cookie');
  server.close();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { success: true });
  assert.ok(setCookie.includes('token='));
  assert.ok(setCookie.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT'));
});
