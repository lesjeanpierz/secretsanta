# Secret Santa des Jeanpierz

Site statique en français, hébergé sur **GitHub Pages** : https://lesjeanpierz.github.io/secretsanta/

## Préparer votre édition

1. Modifier `public/data/participants.json` : un objet par personne avec un `id` unique et stable et un `name` non vide. Les six prénoms livrés sont des **exemples**.
2. Dans `public/data/config.json`, mettre `participantsAreExamples` à `false` une fois les vrais participants renseignés. Personnaliser `title` et `subtitle`.
3. `bonusEnabled: true` active le cadeau supplémentaire (au moins 3 participants). Sans bonus, 2 participants suffisent.
4. `showElectionButton: true` affiche le bouton organisateur et autorise le tirage. `false` masque le bouton et bloque le script de tirage.
5. Conserver `public/data/election.json` à `null` tant que le tirage n’a pas eu lieu.
6. Enregistrer les modifications sur `main` et attendre la publication du site.

## Lancer le tirage

Cliquer sur **Lancer le tirage** sur le site, ou ouvrir l’onglet **Actions → Tirage Secret Santa → Run workflow**, sélectionner `main` et confirmer **Run workflow**. Une connexion GitHub avec les droits d’exécution sur ce dépôt est nécessaire ; aucun jeton n’est placé dans le navigateur.

L’action utilise le générateur cryptographique de Node.js pour mélanger uniformément les participants, en rejetant les permutations où quelqu’un se tire lui-même. Chacun offre et reçoit exactement un cadeau. Avec le bonus, un donneur est choisi uniformément, puis un destinataire est choisi uniformément parmi les personnes autres que lui-même et son premier destinataire. Ce dernier reçoit donc deux cadeaux au total.

Le résultat, sa date et la liste des participants au moment du tirage sont consignés dans `public/data/election.json`. Le bouton est automatiquement désactivé dans `config.json`. Un tirage existant ne peut pas être écrasé par une deuxième exécution. L’action de publication est relancée après un tirage réussi, y compris quand le commit est créé par `GITHUB_TOKEN`.

Après publication, sélectionner son prénom sur le site pour découvrir son destinataire et, le cas échéant, sa mission bonus. Il n’y a pas de nouveau tirage à chaque visite.

**Confidentialité :** le dépôt et les JSON publiés sont publics. Tous les noms et toutes les attributions sont accessibles. La sélection d’un prénom ne protège pas les résultats. Pour de vrais résultats confidentiels, prévoir une architecture avec authentification et stockage privé, en dehors d’un site GitHub Pages entièrement statique. Ne pas ajouter de coordonnées ou d’autres informations personnelles aux JSON.

## Nouvelle édition

Mettre `election.json` à `null`, actualiser les participants, mettre `participantsAreExamples` à `false` et `showElectionButton` à `true`, puis enregistrer sur `main`. Cette opération annule le résultat affiché ; l’historique Git conserve les anciennes éditions.

## Développement et déploiement

Aucune dépendance à installer. Node.js 22 ou plus récent :

```sh
npm test
# Attention : cette commande écrit le tirage dans les fichiers locaux :
npm run draw
# Prévisualisation facultative :
python3 -m http.server 8000 --directory public
```

Les polices Google sont facultatives ; des polices système sont utilisées si elles ne sont pas disponibles. Les illustrations sont en CSS et le favicon en SVG local.

Dans **Settings → Pages → Build and deployment**, choisir **GitHub Actions**. Le workflow `Publier le site` teste puis publie uniquement `public/`. Il s’exécute à chaque push sur `main`, après un tirage réussi et manuellement. Le workflow de tirage a besoin de `contents: write`, celui de publication de `pages: write` et `id-token: write` (déclarés dans leurs fichiers). Des règles de branche qui interdisent le push du bot nécessiteront une adaptation.

Fichiers clés :

- `public/index.html`, `styles.css`, `app.js` : interface responsive et accessible.
- `public/data/participants.json`, `config.json`, `election.json` : données de l’édition.
- `scripts/lottery.mjs` : algorithme ; `scripts/draw.mjs` : validation et enregistrement.
- `.github/workflows/draw.yml`, `pages.yml` : tirage et hébergement.
