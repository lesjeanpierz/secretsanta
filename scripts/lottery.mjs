import { randomInt } from 'node:crypto';

export function validateParticipants(participants, bonusEnabled) {
  if (!Array.isArray(participants) || participants.length < (bonusEnabled ? 3 : 2)) {
    throw new Error(bonusEnabled ? 'Au moins 3 participants sont nécessaires avec le bonus.' : 'Au moins 2 participants sont nécessaires.');
  }
  const ids = new Set();
  for (const p of participants) {
    if (!p || typeof p.id !== 'string' || !p.id.trim() || typeof p.name !== 'string' || !p.name.trim() || ids.has(p.id)) {
      throw new Error('Chaque participant doit avoir un id unique et un nom non vide.');
    }
    ids.add(p.id);
  }
}

export function draw(participants, bonusEnabled = true) {
  validateParticipants(participants, bonusEnabled);
  const ids = participants.map(p => p.id);
  let recipients;
  // Uniform Fisher–Yates shuffle, rejecting permutations with a self-assignment.
  do {
    recipients = [...ids];
    for (let i = recipients.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
  } while (recipients.some((id, i) => id === ids[i]));
  const assignments = ids.map((giverId, i) => ({ giverId, recipientId: recipients[i] }));
  let bonus = null;
  if (bonusEnabled) {
    const giver = assignments[randomInt(assignments.length)];
    const eligible = ids.filter(id => id !== giver.giverId && id !== giver.recipientId);
    bonus = { giverId: giver.giverId, recipientId: eligible[randomInt(eligible.length)] };
  }
  return { version: 1, drawnAt: new Date().toISOString(), participants: participants.map(({id, name}) => ({id, name})), assignments, bonus };
}
