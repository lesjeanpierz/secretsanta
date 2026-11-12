import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../scripts/lottery.mjs';
const participants = n => Array.from({length:n}, (_, i) => ({id:String(i + 1), name:`Personne ${i + 1}`}));
function choices(values) {
  const queue = [...values];
  return maximum => {
    assert.ok(queue.length > 0, 'Le tirage ne doit pas demander de choix supplémentaire.');
    const value = queue.shift();
    assert.ok(value >= 0 && value < maximum);
    return value;
  };
}
test('Exemple fourni : 1 → 3, 2 → 9, 3 → 11 et 11 → 3', () => {
  const result = draw(participants(11), choices([1, 6, 8, 0, 0, 0, 0, 0, 0, 0, 2]));
  assert.deepEqual(result.assignments.map(a => a.recipientId), ['3','9','11','1','2','4','5','6','7','8','3']);
  assert.deepEqual(result.bonus, {giverId:'11',recipientId:'3'});
  assert.equal(result.assignments.filter(a => a.recipientId === '3').length, 2);
  assert.equal(result.assignments.find(a => a.giverId === '3').recipientId, '11');
});
test('Nombre pair : un cadeau offert et reçu, sans obligation de réciprocité', () => {
  for (const n of [2, 4, 6, 10, 20]) for (let trial = 0; trial < 250; trial++) {
    const result = draw(participants(n));
    assert.equal(result.assignments.length, n);
    assert.deepEqual(result.assignments.map(a => a.giverId), participants(n).map(p => p.id));
    assert.equal(new Set(result.assignments.map(a => a.recipientId)).size, n);
    assert.equal(result.bonus, null);
    for (const a of result.assignments) assert.notEqual(a.giverId, a.recipientId);
  }
});
test('Un dernier candidat égal à soi-même provoque un nouveau tirage complet', () => {
  const result = draw(participants(4), choices([0, 1, 0, 0, 1, 1, 0]));
  assert.deepEqual(result.assignments.map(a => a.recipientId), ['2','3','4','1']);
  assert.equal(result.bonus, null);
});
test('Nombre impair : seul le dernier peut sélectionner un destinataire déjà choisi', () => {
  for (const n of [3, 5, 7, 11, 21]) for (let trial = 0; trial < 250; trial++) {
    const result = draw(participants(n));
    assert.equal(result.version, 3);
    assert.equal(result.assignments.length, n);
    assert.deepEqual(result.assignments.map(a => a.giverId), participants(n).map(p => p.id));
    const selected = new Set();
    const received = new Map(result.participants.map(p => [p.id, 0]));
    result.assignments.forEach((a, index) => {
      assert.notEqual(a.giverId, a.recipientId);
      assert.ok(received.has(a.recipientId));
      if (index < n - 1) assert.ok(!selected.has(a.recipientId));
      else assert.deepEqual(result.bonus, selected.has(a.recipientId) ? a : null);
      selected.add(a.recipientId);
      received.set(a.recipientId, received.get(a.recipientId) + 1);
    });
    const counts = [...received.values()];
    assert.equal(counts.filter(count => count === 2).length, result.bonus ? 1 : 0);
    assert.equal(counts.filter(count => count === 0).length, result.bonus ? 1 : 0);
  }
});
test('Le dernier impair choisit parmi tous les autres, même le destinataire encore disponible', () => {
  const unique = draw(participants(3), choices([0, 1, 0]));
  assert.deepEqual(unique.assignments.map(a => a.recipientId), ['2','3','1']);
  assert.equal(unique.bonus, null);
  const duplicate = draw(participants(3), choices([0, 1, 1]));
  assert.deepEqual(duplicate.assignments.map(a => a.recipientId), ['2','3','2']);
  assert.deepEqual(duplicate.bonus, {giverId:'3',recipientId:'2'});
});
test('Les listes invalides sont rejetées', () => {
  for (const input of [null, [], participants(1), [{id:'x',name:'X'},{id:'x',name:'Y'},{id:'z',name:'Z'}], [{id:'a',name:''},...participants(3)]]) {
    assert.throws(() => draw(input));
  }
});
