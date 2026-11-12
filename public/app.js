const $ = id => document.getElementById(id);
async function load(name) {
  const response = await fetch(`./data/${name}.json`, {cache:'no-store'});
  if (!response.ok) throw new Error(`Impossible de charger ${name}.json (${response.status}).`);
  return response.json();
}
function validateList(list) {
  if (!Array.isArray(list) || list.some(p => !p || typeof p.id !== 'string' || !p.id.trim() || typeof p.name !== 'string' || !p.name.trim()) || new Set(list.map(p => p.id)).size !== list.length) throw new Error('Liste de participants invalide. Vérifiez participants.json.');
}
function validateElection(election) {
  validateList(election.participants);
  const ids = new Set(election.participants.map(p => p.id));
  if (![1, 2].includes(election.version) || !Number.isFinite(Date.parse(election.drawnAt)) || !Array.isArray(election.assignments) || election.assignments.length !== ids.size || ids.size < 2) throw new Error('Format du tirage invalide.');
  const validPair = a => a && ids.has(a.giverId) && ids.has(a.recipientId) && a.giverId !== a.recipientId;
  if (election.assignments.some(a => !validPair(a)) || new Set(election.assignments.map(a => a.giverId)).size !== ids.size) throw new Error('Attributions invalides.');
  const recipients = new Map(election.assignments.map(a => [a.giverId, a.recipientId]));
  if (election.version === 1) {
    // Keep the previous published draw readable until the organizer reruns it.
    if (new Set(recipients.values()).size !== ids.size) throw new Error('Attributions invalides.');
    if (election.bonus !== null && (!validPair(election.bonus) || recipients.get(election.bonus.giverId) === election.bonus.recipientId)) throw new Error('Attribution bonus invalide.');
  } else {
    const odd = ids.size % 2 === 1;
    const lastId = election.participants.at(-1).id;
    if (odd ? (!validPair(election.bonus) || election.bonus.giverId !== lastId || recipients.get(lastId) !== election.bonus.recipientId) : election.bonus !== null) throw new Error('Attribution bonus invalide.');
    for (const a of election.assignments) {
      if (odd && a.giverId === lastId) continue;
      if ((odd && a.recipientId === lastId) || recipients.get(a.recipientId) !== a.giverId) throw new Error('Paires du tirage invalides.');
    }
  }
}

try {
  const [config, participants, election] = await Promise.all(['config', 'participants', 'election'].map(load));
  validateList(participants);
  if (!config || typeof config.showElectionButton !== 'boolean' || typeof config.participantsAreExamples !== 'boolean') throw new Error('Configuration invalide.');
  if (election !== null) validateElection(election);
  if (typeof config.title === 'string' && config.title.trim()) { $('title').textContent = config.title; document.title = `${config.title} · Secret Santa`; }
  if (typeof config.subtitle === 'string') $('subtitle').textContent = config.subtitle;
  // The snapshot preserves published assignments even if the next participant list is edited.
  const list = election ? election.participants : participants;
  $('count').textContent = `${list.length} participant${list.length > 1 ? 's' : ''}`;
  $('examples').hidden = !config.participantsAreExamples || election !== null;
  for (const person of list) {
    const li = document.createElement('li');
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.setAttribute('aria-hidden', 'true'); avatar.textContent = Array.from(person.name)[0].toLocaleUpperCase('fr');
    li.append(avatar, document.createTextNode(person.name)); $('participants').append(li);
  }
  const bonusEnabled = election ? election.bonus !== null : list.length % 2 === 1;
  if (!bonusEnabled) {
    $('bonus-description').textContent = 'La liste est paire : les participants forment des paires. Chacun offre et reçoit un cadeau, sans bonus.';
    $('bonus-label').textContent = 'UNE ATTENTION POUR CHACUN';
    document.querySelector('.bonus h2').textContent = 'À chacun son cadeau.';
    document.querySelector('.rule-strip span:last-child b').textContent = 'Des sourires à partager';
  }
  $('organizer').hidden = !config.showElectionButton || election !== null;
  if (election) {
    $('draw-status').textContent = 'Tirage terminé';
    $('exchange-description').textContent = 'Les cadeaux ont trouvé leur destinataire ! Retrouvez toutes les attributions ci-dessous.';
    const names = new Map(list.map(p => [p.id, p.name]));
    const addAssignment = (assignment, isBonus = false) => {
      const row = document.createElement('tr');
      if (isBonus) row.className = 'bonus-assignment';
      for (const text of [names.get(assignment.giverId), names.get(assignment.recipientId), isBonus ? 'Cadeau bonus' : 'Cadeau']) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
      }
      $('assignments').append(row);
    };
    election.assignments.forEach(assignment => addAssignment(assignment, election.version === 2 && election.bonus?.giverId === assignment.giverId));
    if (election.bonus) {
      if (election.version === 1) addAssignment(election.bonus, true);
      $('bonus-description').textContent = election.version === 2
        ? `${names.get(election.bonus.giverId)}, en dernier dans la liste, offre son unique cadeau à ${names.get(election.bonus.recipientId)}, qui reçoit donc deux cadeaux. ${names.get(election.bonus.giverId)} ne reçoit pas de cadeau selon cette règle.`
        : `${names.get(election.bonus.giverId)} offre un deuxième cadeau à ${names.get(election.bonus.recipientId)}. Ce résultat suit l’ancienne règle ; le prochain tirage utilisera la règle des paires.`;
    }
    $('assignments-summary').hidden = false;
    $('load-status').textContent = `Tirage du ${new Intl.DateTimeFormat('fr-FR', {dateStyle:'long', timeZone:'Europe/Paris'}).format(new Date(election.drawnAt))} · Les attributions sont enregistrées.`;
  } else {
    $('load-status').textContent = config.participantsAreExamples ? 'Édition en préparation · L’organisateur doit renseigner les participants avant le tirage.' : 'La liste est prête. Il ne manque plus qu’un peu de hasard.';
    if (!config.showElectionButton) $('load-status').textContent = 'Le tirage n’est pas encore ouvert. Revenez bientôt !';
  }
} catch (error) {
  $('load-status').textContent = `Le site ne peut pas afficher cette édition : ${error.message}`;
  $('load-status').setAttribute('role', 'alert');
  $('organizer').hidden = true;
  $('assignments-summary').hidden = true;
  $('draw-status').textContent = 'Indisponible';
}
