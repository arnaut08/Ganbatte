import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth } from './auth.js';
import friendRoutes from '../routes/friend-routes.js';
import gameRoutes from '../routes/game-routes.js';
import assessmentRoutes from '../routes/assessment-routes.js';

test('requireAuth rejects unauthenticated requests', () => {
  let statusCode;
  let body;
  const req = { user: null };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };
  const next = () => {
    throw new Error('next should not be called');
  };

  requireAuth(req, res, next);

  assert.equal(statusCode, 401);
  assert.deepEqual(body, { error: 'Authentication required.' });
});

test('requireAuth continues when the user is present', () => {
  let called = false;
  const req = { user: { id: 'user-1' } };
  const res = {
    status() {
      throw new Error('status should not be called');
    },
    json() {
      throw new Error('json should not be called');
    },
  };

  requireAuth(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
});

test('protected routers enforce auth before controllers', () => {
  assert.equal(friendRoutes.stack[0].handle, requireAuth);
  assert.equal(gameRoutes.stack[0].handle, requireAuth);
  assert.equal(assessmentRoutes.stack[0].handle, requireAuth);
});
