import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../scripts/lottery.mjs';
const participants = n => Array.from({length:n}, (_, i) => ({id:String(i + 1), name:`Personne ${i + 1}`}));
function choices(values) {
  const queue = [...values];
  return maximum => {
    assert.ok(queue.length > 0);
    const value = queue.shift();
    assert.ok(value >= 0 && value < maximum);
    return value;
  };
}
test('Chaque personne offre et reçoit exactement un cadeau, pour toute parité', () => {
  for (const n of [2, 3, 4, 5, 6, 10, 11, 20, 21]) for (let trial = 0; trial < 250; trial++) {
    const result = draw(participants(n));
    assert.equal(result.version, 4);
    assert.equal(result.assignments.length, n);
    assert.deepEqual(result.assignments.map(a => a.giverId), participants(n).map(p => p.id));
    assert.deepEqual(new Set(result.assignments.map(a => a.recipientId)), new Set(participants(n).map(p => p.id)));
    for (const a of result.assignments) assert.notEqual(a.giverId, a.recipientId);
  }
});
test('Un dernier candidat égal à soi-même provoque un nouveau tirage complet', () => {
  const result = draw(participants(4), choices([0, 1, 0, 0, 1, 1, 0]));
  assert.deepEqual(result.assignments.map(a => a.recipientId), ['2','3','4','1']);
});
test('Un nombre impair conserve un destinataire unique, même au dernier choix', () => {
  const result = draw(participants(3), choices([0, 1, 0]));
  assert.deepEqual(result.assignments.map(a => a.recipientId), ['2','3','1']);
});
test('Les listes invalides sont rejetées', () => {
  for (const input of [null, [], participants(1), [{id:'x',name:'X'},{id:'x',name:'Y'},{id:'z',name:'Z'}], [{id:'a',name:''},...participants(3)]]) {
    assert.throws(() => draw(input));
  }
});
