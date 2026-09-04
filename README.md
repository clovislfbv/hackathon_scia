# TeachToLearn

TeachToLearn est une salle de classe 3D interactive basée sur Three.js et TypeScript. Le joueur incarne un professeur qui prépare puis donne un cours à des élèves contrôlés par une IA.

Le projet utilise une approche inspirée de la méthode de Feynman : comprendre une notion en la préparant, puis la consolider en l'expliquant.

## Fonctionnalités

- Salle de classe low-poly en 3D.
- Déplacement à la première personne avec les touches `ZQSD`.
- Collisions avec les murs, bureaux, chaises et tableau.
- Porte animée avec la touche `E` lorsque le joueur est proche.
- Briefing initial avec M. Vautier.
- Génération de 3 à 5 objectifs de cours par l'IA.
- Conversations privées avec les personnages.
- Conversations de classe avec un contexte individuel pour chaque élève.
- Élèves capables de rester silencieux avec la réponse `[SILENCE]`.
- Évaluation finale avec une note sur 20.
- Rendu du Markdown et des formules mathématiques avec KaTeX.

## Prérequis

- Node.js récent.
- Une clé API OpenAI si les conversations IA sont utilisées.

## Installation

```bash
npm install
```

Créer ensuite un fichier `.env` à la racine du projet :

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Ne commitez jamais votre clé API. Le fichier `.env` est ignoré par Git lorsqu'il est correctement configuré dans `.gitignore`.

## Lancement en développement

```bash
npm run dev
```

Vite affiche ensuite l'URL locale, généralement :

```text
http://localhost:5173
```

L'API `/api/chat` est fournie par le plugin serveur défini dans `vite.config.ts`. Elle fonctionne avec le serveur de développement Vite.

## Commandes disponibles

```bash
npm run dev       # Lance le serveur de développement
npm run build     # Vérifie et construit l'application pour la production
npm run preview   # Sert le build de production localement
npx tsc --noEmit  # Vérifie les types TypeScript
```

## Utilisation

1. Cliquez dans la scène pour capturer la souris.
2. Utilisez `ZQSD` pour vous déplacer.
3. Déplacez la souris pour regarder autour de vous.
4. Au début, discutez avec M. Vautier et indiquez le sujet du cours.
5. Posez vos questions de préparation dans le chat.
6. Cliquez sur **Prêt à donner le cours**.
7. Enseignez la matière à la classe dans le chat.
8. Cliquez sur **Terminer le cours**, ou laissez M. Vautier mettre fin au cours.
9. Consultez l'évaluation finale et la note sur 20.

Interactions supplémentaires :

- `E` : ouvrir ou fermer la porte à proximité.
- `T` : ouvrir la discussion avec la classe lorsqu'aucun chat n'est ouvert.
- `Échap` : fermer une conversation lorsque la phase le permet.
- Cliquez sur un élève visé par le réticule pour ouvrir une conversation privée.

## Phases du gameplay

### 1. Briefing

Seul M. Vautier est présent. Il demande le sujet du cours, puis propose les objectifs à couvrir. Le joueur peut lui poser des questions pour se préparer.

### 2. Cours

Le bouton de préparation fait apparaître les élèves. Chaque élève reçoit son propre prompt et son propre contexte privé, tout en ayant accès aux échanges déjà prononcés par les autres élèves en classe. Un élève peut répondre ou retourner `[SILENCE]` si aucune intervention n'est pertinente.

### 3. Évaluation

La fin du cours peut être déclenchée par le bouton du joueur ou par M. Vautier. Le chat devient alors inaccessible et M. Vautier analyse les explications du professeur, les objectifs abordés, la précision et la clarté du cours avant de donner une note sur 20.

## Architecture

```text
main.ts                 Initialisation Three.js et assemblage de la scène
scene/                  Matériaux, éclairage et pièce
objects/                Constructeurs des bureaux, chaises, élèves, porte, tableau et fenêtre
player/                 Contrôles, déplacement, collisions et gameplay
chat/conversation.ts    Interface du chat et historique des conversations
vite.config.ts          Plugin serveur Vite et proxy logique vers OpenAI
public/portraits/       Portraits des personnages
```

## Modes de conversation

L'API `/api/chat` distingue plusieurs modes :

- `briefing` : préparation avec M. Vautier.
- `direct` : conversation privée avec un personnage.
- `classroom` : réponse d'un élève dans le contexte de la classe.
- `evaluation` : analyse finale du cours.

Les conversations de classe sont envoyées séparément à Alex, Lucas, Sam et M. Vautier afin que chacun conserve sa personnalité et son contexte propre.

## Limites actuelles

- Les objectifs de cours sont générés à partir des échanges avec l'IA, sans ingestion de PDF pour le moment.
- L'API utilise directement OpenAI depuis le plugin serveur Vite.
- Le bundle Three.js et KaTeX peut être volumineux en production.
- La qualité des interventions dépend du modèle configuré et de son respect du marqueur `[SILENCE]`.
