import test from 'node:test';
import assert from 'node:assert/strict';

import {
  areRomajiAnswersEqual,
  buildDirectRomajiDiff,
} from './romaji';

test('whole-answer comparison tolerates spaces without token matching', () => {
  assert.equal(areRomajiAnswersEqual('  ohayou   gozaimasu ', 'ohayougozaimasu'), true);
  assert.equal(areRomajiAnswersEqual('ohayou gozaimasu', 'ohayou gozaimasu'), true);
  assert.equal(areRomajiAnswersEqual('ohayou', 'ohayougozaimasu'), false);
});

test('direct romaji diff marks each complete answer as a single difference', () => {
  assert.deepEqual(buildDirectRomajiDiff('ohayou gozaimasu', 'ohayou'), {
    given: [{ type: 'diff', text: 'ohayou gozaimasu' }],
    expected: [{ type: 'diff', text: 'ohayou' }],
  });
});

test('direct romaji diff leaves space-tolerant matches plain', () => {
  assert.deepEqual(buildDirectRomajiDiff('ohayou gozaimasu', 'ohayougozaimasu'), {
    given: [{ type: 'plain', text: 'ohayou gozaimasu' }],
    expected: [{ type: 'plain', text: 'ohayougozaimasu' }],
  });
});
