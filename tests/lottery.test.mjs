import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../scripts/lottery.mjs';
const participants = n => Array.from({length:n}, (_, i) => ({id:String(i), name:`Personne ${i}`}));
test('Nombre pair : des paires réciproques, un cadeau offert et reçu par personne', () => {
  for (const n of [2, 4, 6, 10, 20]) for (let trial = 0; trial < 250; trial++) {
    const result = draw(participants(n));
    assert.equal(result.assignments.length, n);
    assert.equal(new Set(result.assignments.map(a => a.giverId)).size, n);
    assert.equal(new Set(result.assignments.map(a => a.recipientId)).size, n);
    assert.equal(result.bonus, null);
    const recipients = new Map(result.assignments.map(a => [a.giverId, a.recipientId]));
    for (const a of result.assignments) {
      assert.notEqual(a.giverId, a.recipientId);
      assert.equal(recipients.get(a.recipientId), a.giverId);
    }
  }
});
test('Nombre impair : le dernier offre un seul cadeau, un destinataire en reçoit deux', () => {
  for (const n of [3, 5, 7, 11, 21]) for (let trial = 0; trial < 250; trial++) {
    const result = draw(participants(n));
    assert.equal(result.version, 2);
    assert.equal(result.assignments.length, n);
    assert.equal(new Set(result.assignments.map(a => a.giverId)).size, n);
    assert.deepEqual(result.bonus, result.assignments.at(-1));
    assert.equal(result.bonus.giverId, String(n - 1));
    assert.notEqual(result.bonus.recipientId, result.bonus.giverId);
    const received = new Map(result.participants.map(p => [p.id, 0]));
    const recipients = new Map(result.assignments.map(a => [a.giverId, a.recipientId]));
    for (const a of result.assignments) {
      assert.notEqual(a.giverId, a.recipientId);
      assert.ok(received.has(a.recipientId));
      received.set(a.recipientId, received.get(a.recipientId) + 1);
      if (a.giverId !== result.bonus.giverId) assert.equal(recipients.get(a.recipientId), a.giverId);
    }
    assert.equal(received.get(result.bonus.giverId), 0);
    assert.equal(received.get(result.bonus.recipientId), 2);
    assert.equal([...received.values()].filter(n => n === 1).length, n - 2);
  }
});
test('Les listes invalides sont rejetées', () => {
  for (const input of [null, [], participants(1), [{id:'x',name:'X'},{id:'x',name:'Y'},{id:'z',name:'Z'}], [{id:'a',name:''},...participants(3)]]) {
    assert.throws(() => draw(input));
  }
});
