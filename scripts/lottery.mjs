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

export function draw(participants, chooseIndex = randomInt) {
  validateParticipants(participants);
  const ids = participants.map(p => p.id);
  const odd = ids.length % 2 === 1;
  let assignments;
  let bonus;
  // A full restart handles the even case where only the last giver remains.
  do {
    const selected = new Set();
    assignments = [];
    bonus = null;
    for (let i = 0; i < ids.length; i++) {
      const giverId = ids[i];
      const finalOdd = odd && i === ids.length - 1;
      const eligible = ids.filter(id => id !== giverId && (finalOdd || !selected.has(id)));
      if (eligible.length === 0) break;
      const recipientId = eligible[chooseIndex(eligible.length)];
      const assignment = {giverId, recipientId};
      if (finalOdd && selected.has(recipientId)) bonus = {...assignment};
      assignments.push(assignment);
      selected.add(recipientId);
    }
  } while (assignments.length !== ids.length);
  // bonus describes a duplicate recipient in the last assignment, not an extra gift.
  return {
    version: 3,
    drawnAt: new Date().toISOString(),
    participants: participants.map(({id, name}) => ({id, name})),
    assignments,
    bonus
  };
}
