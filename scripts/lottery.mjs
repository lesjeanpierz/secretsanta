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
  let assignments;
  // Restart if the only remaining recipient is the final giver.
  do {
    const selected = new Set();
    assignments = [];
    for (let i = 0; i < ids.length; i++) {
      const giverId = ids[i];
      const eligible = ids.filter(id => id !== giverId && !selected.has(id));
      if (eligible.length === 0) break;
      const recipientId = eligible[chooseIndex(eligible.length)];
      const assignment = {giverId, recipientId};
      assignments.push(assignment);
      selected.add(recipientId);
    }
  } while (assignments.length !== ids.length);
  return {
    version: 4,
    drawnAt: new Date().toISOString(),
    participants: participants.map(({id, name}) => ({id, name})),
    assignments
  };
}
