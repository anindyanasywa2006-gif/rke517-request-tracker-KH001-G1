import { test } from 'node:test';
import assert from 'node:assert/strict';

import { requests } from './src/fixtures.js';
import {
  filterRequests,
  transitionRequest
} from './src/tracker.js';

test('VER-04: search is case-insensitive and trims spaces', () => {
  const result = filterRequests(requests, {
    query: '  req-101  '
  });

  assert.deepEqual(
    result.map(item => item.id),
    ['REQ-101']
  );
});

test('VER-04: status filter and search work together', () => {
  const result = filterRequests(requests, {
    status: 'Processing',
    query: 'REQ-103'
  });

  assert.deepEqual(
    result.map(item => item.id),
    ['REQ-103']
  );
});

test('VER-04: a 9-character cancellation reason is rejected', () => {
  const original = structuredClone(requests);

  const result = transitionRequest(
    original,
    'REQ-101',
    'Cancelled',
    'staff01',
    { reason: 'Too short' }
  );

  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    'Cancellation reason must be at least 10 characters.'
  );
  assert.deepEqual(original, requests);
});

test('VER-04: a 10-character cancellation reason is accepted', () => {
  const result = transitionRequest(
    structuredClone(requests),
    'REQ-101',
    'Cancelled',
    'staff01',
    { reason: 'Valid 1234' }
  );

  assert.equal(result.ok, true);
  assert.equal(result.changed.status, 'Cancelled');
  assert.equal(result.event.reason, 'Valid 1234');
});

test('VER-04: invalid cancellation does not mutate requests', () => {
  const original = structuredClone(requests);
  const before = structuredClone(original);

  const result = transitionRequest(
    original,
    'REQ-101',
    'Cancelled',
    'staff01',
    { reason: 'No' }
  );

  assert.equal(result.ok, false);
  assert.deepEqual(original, before);
});
