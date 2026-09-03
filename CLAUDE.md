# 🎓 TeachToLearn (Professeur d'un Jour) - Spécifications Agent IA

## 📌 Présentation du Projet
**TeachToLearn** est une application basée sur des **agents IA multi-rôles** utilisant la technique de Feynman : *la meilleure façon d'apprendre est d'enseigner*. 

L'expérience d'apprentissage est scénarisée sous la forme d'un **jeu de rôle interactif en 2 étapes**.

---

## 🏗️ Architecture & Déroulement en 2 Phases

```
   [ Upload PDF du cours ]
              │
              ▼
   [ Étape 0 : Analyse & Extraction de notions clés ]
              │
              ▼
   ┌──────────────────────────────────────────────┐
   │ ÉTAPE 1 : La Salle des Profs (Briefing)      │
   │ - Rôle : L'IA est le Tuteur / Mentor         │
   │ - Contexte : L'utilisateur est remplaçant    │
   │ - Objectif : Crash course express & Q&A      │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │ ÉTAPE 2 : La Salle de Classe (Mise en pratique)│
   │ - Rôle utilisateur : Le Professeur devant classe│
   │ - Agents : Élèves (Intello, Perturbateur...) │
   │ - Superviseur : Inspecteur / Prof examinateur│
   │ - Objectif : Enseigner, vulgariser, corriger │
   └──────────────────────────────────────────────┘
```

---

## 📑 1. Ingestion & Analyse du Document (PDF Ingestion)

- Extraction du texte et concepts clés du document PDF téléversé.
- Découpage sémantique et génération d'une base de connaissances :
  - Notions fondamentales & définitions.
  - Pièges fréquents et erreurs courantes.
  - Analogies et exemples types.

---

## 🎭 2. Étape 1 : Le Réveil en Salle des Profs (Le Crash-Course)

### 🎬 Scénario :
> *L'utilisateur ouvre les yeux dans une salle des profs. Un collègue expérimenté (Agent Tuteur) s'approche en panique :*  
> « Ah, te voilà ! Le titulaire est absent, tu dois donner le cours dans 10 minutes ! Pose-moi toutes tes questions, je te briefe en express. »

### 🤖 Rôle de l'Agent Mentor :
- **Personnalité** : Pédagogue, direct, bienveillant mais pressé par le temps.
- **Objectifs** :
  - Résumer les 3 à 5 notions clés issues du PDF.
  - Répondre aux questions de l'utilisateur pour combler ses lacunes en express.
  - Tester rapidement l'utilisateur avant de l'envoyer en classe.

---

## 🏫 3. Étape 2 : La Salle de Classe (Le Jeu de Rôle)

### 🎬 Scénario :
> *L'utilisateur entre en classe. Des élèves l'attendent. Au fond, un professeur examinateur / inspecteur prend des notes.*

### 👥 Profils des Agents Élèves & Superviseurs :

| Personnage | Rôle / Comportement | Impact Pédagogique |
|---|---|---|
| 🤓 **Alex (L'Intello)** | Pose des questions précises, repère les erreurs. Si le prof fait une faute, il le corrige immédiatement. | Maintient la rigueur technique. |
| 🤡 **Lucas (Le Perturbateur)** | Pose des questions décalées ou provoque (« Ça sert à quoi ? »). | Force la vulgarisation et la gestion de classe. |
| 😶 **Sam (Le Perdu)** | A du mal à comprendre, s'embrouille dans les notions de base. | Force l'utilisateur à réexpliquer simplement. |
| 🧐 **M. Vautier (L'Examinateur)** | Inspecteur au fond de la classe. Intervient en cas d'erreur non corrigée par l'intello. | Évalue et donne le bilan final. |

---

## 🔄 Mécaniques de Correction & Gameplay

1. **Correction dynamique** : Si l'utilisateur commet une erreur factuelle ou conceptuelle, l'élève intello intervient d'abord. Si l'erreur persiste, l'examinateur intervient.
2. **Orchestration Multi-Agents** : L'agent maître choisit quel élève prend la parole selon ce que dit l'utilisateur (simplification -> Sam, imprécision -> Alex, digression -> Lucas).
3. **Bilan Final** : Évaluation à la fin du cours par l'examinateur (points forts, notions mal maîtrisées).

---

## 🛠️ Stack Technique & Roadmap

- **Backend** : Python / FastAPI + Framework Multi-Agents (LangChain / LangGraph / CrewAI).
- **RAG** : Vectorstore (ChromaDB / FAISS) + PDF Loader.
- **LLM** : Claude 3.5 Sonnet / GPT-4o.
- **Roadmap** :
  1. Parser PDF & Ingestion RAG.
  2. Agent Tuteur (Salle des profs).
  3. Agents Élèves + Examinateur (Salle de classe).
  4. Moteur d'orchestration & de correction d'erreurs.

