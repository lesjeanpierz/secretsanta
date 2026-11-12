import { randomInt } from 'node:crypto';

export function validateParticipants(participants) {
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('Au moins 2 participants sont nécessaires.');
  }
  const ids = new Set();
  for (const p of participants) {
    if (!p || typeof p.id !== 'string' || !p.id.trim() || typeof p.name !== 'string' || !p.name.trim() || ids.has(p.id)) {
      throw new Error('Chaque participant doit avoir un id unique et un nom non vide.');
    }
    ids.add(p.id);
  }
}

export function draw(participants) {
  validateParticipants(participants);
  const ids = participants.map(p => p.id);
  const odd = ids.length % 2 === 1;
  // With an odd count, the final JSON participant remains outside the pairs.
  const paired = odd ? ids.slice(0, -1) : [...ids];
  for (let i = paired.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [paired[i], paired[j]] = [paired[j], paired[i]];
  }
  const recipients = new Map();
  for (let i = 0; i < paired.length; i += 2) {
    recipients.set(paired[i], paired[i + 1]);
    recipients.set(paired[i + 1], paired[i]);
  }
  let bonus = null;
  if (odd) {
    const giverId = ids.at(-1);
    const eligible = ids.slice(0, -1);
    bonus = {giverId, recipientId: eligible[randomInt(eligible.length)]};
    recipients.set(giverId, bonus.recipientId);
  }
  // The bonus is metadata about the final assignment, not an extra gift.
  return {
    version: 2,
    drawnAt: new Date().toISOString(),
    participants: participants.map(({id, name}) => ({id, name})),
    assignments: ids.map(giverId => ({giverId, recipientId: recipients.get(giverId)})),
    bonus
  };
}
