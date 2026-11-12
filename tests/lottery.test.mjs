import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../scripts/lottery.mjs';
const participants = n => Array.from({length:n}, (_, i) => ({id:String(i), name:`Personne ${i}`}));
test('Chaque personne offre et reçoit exactement une fois, sans auto-attribution', () => {
  for (const n of [3, 4, 6, 20]) for (let trial = 0; trial < 250; trial++) {
    const result = draw(participants(n));
    assert.equal(new Set(result.assignments.map(a => a.giverId)).size, n);
    assert.equal(new Set(result.assignments.map(a => a.recipientId)).size, n);
    for (const a of result.assignments) assert.notEqual(a.giverId, a.recipientId);
    const normal = result.assignments.find(a => a.giverId === result.bonus.giverId);
    assert.notEqual(result.bonus.recipientId, normal.giverId);
    assert.notEqual(result.bonus.recipientId, normal.recipientId);
    assert.ok(result.participants.some(p => p.id === result.bonus.recipientId));
  }
});
test('Deux personnes sans bonus et bonus désactivé', () => {
  assert.deepEqual(draw(participants(2), false).assignments, [{giverId:'0',recipientId:'1'},{giverId:'1',recipientId:'0'}]);
  assert.equal(draw(participants(6), false).bonus, null);
});
test('Les listes invalides sont rejetées', () => {
  for (const input of [null, [], participants(1), participants(2), [{id:'x',name:'X'},{id:'x',name:'Y'},{id:'z',name:'Z'}], [{id:'a',name:''},...participants(3)]]) {
    assert.throws(() => draw(input));
  }
});
