import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import purchaseRouter from '../routes/purchaseCourse.route.js';

dotenv.config();
process.env.SECRET_KEY = process.env.SECRET_KEY || 'testsecret';

// Helper to start an express app with purchaseRouter mounted
const startServer = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/', purchaseRouter);
  const server = app.listen(0);
  const { port } = server.address();
  return { server, port };
};

test('POST /checkout/create-checkout-session returns 401 when no auth token', async () => {
  const { server, port } = startServer();

  const response = await fetch(`http://127.0.0.1:${port}/checkout/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId: 'test-course' })
  });

  const body = await response.json();
  server.close();

  assert.strictEqual(response.status, 401);
  assert.ok(body.message);
});

test('POST /checkout/create-checkout-session responds 400 when courseId missing', async () => {
  const token = jwt.sign({ id: 'user123' }, process.env.SECRET_KEY);
  const { server, port } = startServer();

  const response = await fetch(`http://127.0.0.1:${port}/checkout/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${token}`
    },
    body: JSON.stringify({})
  });

  const body = await response.json();
  server.close();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.message, 'courseId is required');
});
