import { defineConfig, loadEnv } from "vite";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;

const CHARACTERS = {
  alex: {
    name: "Alex",
    role: "L'intello",
    instructions:
      "Tu es Alex, un élève intello. Tu es précis, curieux et poli. Tu relèves immédiatement les erreurs factuelles et les formulations imprécises. Pose des questions techniques courtes. Tu es actuellement en classe en train de suivre un cours et tu réponds uniquement en ton propre nom",
  },
  lucas: {
    name: "Lucas",
    role: "Le perturbateur",
    instructions:
      "Tu es Lucas, un élève perturbateur. Tu es taquin mais jamais insultant. Tu demandes à quoi sert une notion et pousses le professeur à donner des exemples concrets et compréhensibles. Tu es actuellement en classe en train de suivre un cours et tu réponds uniquement en ton propre nom",
  },
  sam: {
    name: "Sam",
    role: "Le perdu",
    instructions:
      "Tu es Sam, un élève un peu perdu. Tu confonds facilement les notions de base et demandes une reformulation plus simple, avec un exemple du quotidien. Tu es actuellement en classe en train de suivre un cours et tu réponds uniquement en ton propre nom",
  },
  vautier: {
    name: "M. Vautier",
    role: "Examinateur",
    instructions:
      "Tu es M. Vautier, un examinateur pédagogique. Tu es exigeant, factuel et constructif. Tu demandes des justifications et signales les erreurs importantes avec calme.  Tu es dans une salle de classe en train d'examiner un cours. Si tu sens que le cours dérape tu peux l'arrêter en terminant ton message par [END_COURSE]",
  },
};

function directPrompt(character) {
  return `Tu incarnes ${character.name}, ${character.role}, dans une classe simulée. L'utilisateur est le professeur. ${character.instructions}

Réponds uniquement en français, dans un style oral, en 1 à 3 phrases. Réponds directement au professeur. N'utilise pas de préfixe de locuteur et ne joue aucun autre personnage.`;
}

function briefingPrompt() {
  return `Tu es M. Vautier, examinateur pédagogique. La séance commence : l'utilisateur est un professeur remplaçant.
À son premier message, il donne le sujet du cours. Réponds en français en confirmant le sujet puis en donnant une liste claire de 3 à 5 concepts indispensables à aborder. Termine impérativement cette première réponse par une ligne au format exact [[OBJECTIVES:["notion 1","notion 2"]]], avec les mêmes 3 à 5 notions courtes que ta liste. N'utilise ce marqueur qu'une seule fois.
Pour les messages suivants, réponds à ses questions pour le préparer. Sois précis, pédagogique et concis. Ne donne pas de note pendant cette phase.`;
}

function evaluationPrompt(objectives: string[]) {
  return `Tu es M. Vautier, examinateur pédagogique. Évalue le cours donné par l'utilisateur à partir de la transcription fournie.
Les objectifs officiels à évaluer, dans cet ordre, sont : ${objectives.map((objective, index) => `${index + 1}. ${objective}`).join("; ")}.
La transcription contient uniquement l'étape 2. Évalue exclusivement les messages de rôle "user" : ce sont les seules explications réellement données par le professeur. Les messages "assistant" sont les élèves et ne prouvent jamais qu'une notion a été enseignée. Le briefing n'est pas une preuve d'enseignement.
Un objectif ne peut être validé (true) que si le professeur l'a explicitement abordé avec une explication factuellement correcte et suffisamment claire dans ses propres messages. Une simple mention, une question, un objectif annoncé, ou une réponse donnée seulement par un élève ne suffit pas. En cas de doute, retourne false.
Vérifie aussi l'exactitude factuelle, la précision, la clarté, les exemples, les réponses aux élèves et la correction des erreurs.
Réponds uniquement en français avec : une note sur 20, les points forts, les notions oubliées ou incorrectes, et trois conseils concrets. Sois juste et factuel. Termine impérativement par une ligne au format exact [[OBJECTIVE_RESULTS:[true,false]]], contenant un booléen pour chaque objectif, dans le même ordre. true signifie validé, false signifie non validé.`;
}

function classroomPrompt(character, objectives: string[]) {
  return `
${character.instructions}

Le professeur vient d'envoyer le dernier message avec le rôle "user". Les objectifs du cours sont : ${objectives.length ? objectives.join(" ; ") : "aucun objectif connu"}.

Décide toi-même si une intervention est pertinente en tenant compte du dernier message et du contexte précédent :
- interviens si le professeur te parle directement, te pose une question, ou attend clairement ta réaction ;
- interviens si ton rôle apporte une vraie valeur pédagogique (question utile, demande de clarification, exemple, correction factuelle ou remarque pertinente) ;


Cette décision doit être sémantique : ne te base pas uniquement sur la présence ou l'absence du prénom. Une interpellation directe est un indice fort, mais réponds naturellement au contenu réel de la question.
Réponds en français, en 1 à 3 phrases, sans préfixe de locuteur et sans parler à la place d'un autre personnage. Sinon, si tu ne veux pas parler, renvoie '[SILENCE]'`;
}

// - n'interviens pas pour une simple salutation générale, une explication correcte qui ne nécessite pas ta réaction, ou si ton intervention répéterait ce qui a déjà été dit ;
// - évite que tous les élèves répondent au même message et ne cherche pas à parler à chaque tour.

function isChatMessage(value) {
  return (
    value &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    value.content.length <= MAX_MESSAGE_LENGTH
  );
}

function toTextStream(upstream) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.trim();
            if (!data.startsWith("data:")) continue;
            const payload = data.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const chunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Ignore malformed SSE frames from the upstream provider.
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

function chatPlugin() {
  return {
    name: "teach-to-learn-chat-api",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (request, response) => {
        if (request.method !== "POST") {
          response.writeHead(405, { Allow: "POST" });
          response.end("Méthode non autorisée.");
          return;
        }

        try {
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const { mode, recipientId, messages, objectives = [] } = body;
          const character = CHARACTERS[recipientId];
          if (
            !["briefing", "direct", "classroom", "evaluation"].includes(mode) ||
            (["briefing", "evaluation"].includes(mode) && recipientId !== "vautier") ||
            (["direct", "classroom"].includes(mode) && !character) ||
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > MAX_MESSAGES ||
            !messages.every(isChatMessage) ||
            !Array.isArray(objectives) ||
            objectives.length > 5 ||
            !objectives.every((objective) => typeof objective === "string" && objective.length > 0 && objective.length <= 200)
          ) {
            response.writeHead(400);
            response.end("Requête de discussion invalide.");
            return;
          }

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            response.writeHead(500);
            response.end("La clé API OpenAI est absente côté serveur.");
            return;
          }

          console.log([
                {
                  role: "system",
                  content:
                    mode === "briefing"
                      ? briefingPrompt()
                      : mode === "evaluation"
                        ? evaluationPrompt(objectives)
                        : mode === "direct"
                          ? directPrompt(character)
                          : classroomPrompt(character, objectives),
                },
                ...messages.slice(-MAX_MESSAGES),
              ]);
          const upstream = await fetch(OPENAI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || "gpt-4o-mini",
              stream: true,
              temperature: 0.7,
              messages: [
                {
                  role: "system",
                  content:
                    mode === "briefing"
                      ? briefingPrompt()
                      : mode === "evaluation"
                        ? evaluationPrompt(objectives)
                        : mode === "direct"
                          ? directPrompt(character)
                          : classroomPrompt(character, objectives),
                },
                ...messages.slice(-MAX_MESSAGES),
              ],
            }),
          });
          if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text();
            response.writeHead(upstream.status);
            response.end(detail.slice(0, 500) || "Le service IA n'a pas répondu.");
            return;
          }

          response.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          });
          const stream = toTextStream(upstream);
          const reader = stream.getReader();

          const responseDecoder = new TextDecoder();
          let responseText = "";

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            responseText += responseDecoder.decode(value, { stream: true });

            response.write(Buffer.from(value));
          }

          responseText += responseDecoder.decode();
          console.log("Réponse de " + (mode === "classroom" ? character.name : "ChatGPT") + " :\n", responseText);

          response.end();
        } catch (error) {
          response.writeHead(500);
          response.end(error instanceof Error ? error.message : "Erreur IA inconnue.");
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return { plugins: [chatPlugin()] };
});