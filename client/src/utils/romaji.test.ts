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

test('kana spelling variants match their Hepburn readings', () => {
  // し / シ -> ['shi', 'si']
  assert.equal(areRomajiAnswersEqual('si', 'shi'), true);
  // つ / ツ -> ['tsu', 'tu']
  assert.equal(areRomajiAnswersEqual('tu', 'tsu'), true);
  // ち / チ -> ['chi', 'ti']
  assert.equal(areRomajiAnswersEqual('ti', 'chi'), true);
  // ふ / フ -> ['fu', 'hu']
  assert.equal(areRomajiAnswersEqual('hu', 'fu'), true);
  // じ / ジ -> ['ji', 'zi']
  assert.equal(areRomajiAnswersEqual('zi', 'ji'), true);
  // ぢ / ヂ -> ['ji', 'di', 'dji']
  assert.equal(areRomajiAnswersEqual('di', 'ji'), true);
  assert.equal(areRomajiAnswersEqual('dji', 'ji'), true);
  // づ / ヅ -> ['zu', 'du', 'dzu']
  assert.equal(areRomajiAnswersEqual('du', 'zu'), true);
  assert.equal(areRomajiAnswersEqual('dzu', 'zu'), true);
});

test('yoon nihon-shiki variants match their Hepburn readings', () => {
  // しゃ -> sha / sya
  assert.equal(areRomajiAnswersEqual('sya', 'sha'), true);
  assert.equal(areRomajiAnswersEqual('syu', 'shu'), true);
  assert.equal(areRomajiAnswersEqual('syo', 'sho'), true);
  // じゃ -> ja / zya
  assert.equal(areRomajiAnswersEqual('zya', 'ja'), true);
  assert.equal(areRomajiAnswersEqual('zyu', 'ju'), true);
  assert.equal(areRomajiAnswersEqual('zyo', 'jo'), true);
  // ちゃ -> cha / tya
  assert.equal(areRomajiAnswersEqual('tya', 'cha'), true);
});

test('aliases still reject genuinely wrong readings', () => {
  assert.equal(areRomajiAnswersEqual('sa', 'shi'), false);
  assert.equal(areRomajiAnswersEqual('ki', 'chi'), false);
  assert.equal(areRomajiAnswersEqual('shya', 'sha'), false);
});
