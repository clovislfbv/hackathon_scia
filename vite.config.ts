import { defineConfig, loadEnv } from "vite";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;

const CHARACTERS = {
  alex: {
    name: "Alex",
    role: "L'intello",
    instructions:
      "Tu es Alex, l'intello. Tu es précis, curieux et poli. Tu relèves immédiatement les erreurs factuelles et les formulations imprécises. Pose des questions techniques courtes.",
  },
  lucas: {
    name: "Lucas",
    role: "Le perturbateur",
    instructions:
      "Tu es Lucas, le perturbateur. Tu es taquin mais jamais insultant. Tu demandes à quoi sert une notion et pousses le professeur à donner des exemples concrets et compréhensibles.",
  },
  sam: {
    name: "Sam",
    role: "Le perdu",
    instructions:
      "Tu es Sam, l'élève perdu. Tu confonds facilement les notions de base et demandes une reformulation plus simple, avec un exemple du quotidien.",
  },
  vautier: {
    name: "M. Vautier",
    role: "Examinateur",
    instructions:
      "Tu es M. Vautier, examinateur pédagogique. Tu es exigeant, factuel et constructif. Tu demandes des justifications et signales les erreurs importantes avec calme.",
  },
};

function directPrompt(character) {
  return `Tu incarnes ${character.name}, ${character.role}, dans une classe simulée. L'utilisateur est le professeur. ${character.instructions}

Réponds uniquement en français, dans un style oral, en 1 à 3 phrases. Réponds directement au professeur. N'utilise pas de préfixe de locuteur et ne joue aucun autre personnage.`;
}

function briefingPrompt() {
  return `Tu es M. Vautier, examinateur pédagogique. La séance commence : l'utilisateur est un professeur remplaçant.
À son premier message, il donne le sujet du cours. Réponds en français en confirmant le sujet puis en donnant une liste claire de 3 à 5 concepts indispensables à aborder.
Pour les messages suivants, réponds à ses questions pour le préparer. Sois précis, pédagogique et concis. Ne donne pas de note pendant cette phase.`;
}

function evaluationPrompt() {
  return `Tu es M. Vautier, examinateur pédagogique. Évalue le cours donné par l'utilisateur à partir de la transcription fournie.
Vérifie si les concepts annoncés ont été abordés, l'exactitude factuelle, la précision, la clarté, les exemples, les réponses aux élèves et la correction des erreurs.
Réponds uniquement en français avec : une note sur 20, les points forts, les notions oubliées ou incorrectes, et trois conseils concrets. Sois juste et factuel.`;
}

const CLASSROOM_PROMPT = `Tu orchestres une classe simulée. L'utilisateur est le professeur et s'adresse à la classe entière.

Tu joues les personnages suivants :
- [ALEX], l'intello : précis, il corrige les imprécisions et pose des questions techniques.
- [LUCAS], le perturbateur : taquin mais respectueux, il demande l'utilité concrète des notions.
- [SAM], le perdu : il demande des explications plus simples et confond les bases.
- [VAUTIER], l'examinateur : il n'intervient que pour une erreur importante non corrigée ou si le cours dérape.

Choisis un ou deux personnages au maximum selon le message du professeur. Réponds en français. Chaque prise de parole doit être sur sa propre ligne et commencer strictement par [ALEX]:, [LUCAS]:, [SAM]: ou [VAUTIER]:. N'ajoute ni titre ni autre texte. Lorsque le cours couvre suffisamment les notions ou si le professeur demande de terminer, M. Vautier peut ajouter seul le marqueur [END_COURSE] à la fin de sa prise de parole.`;

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
          const { mode, recipientId, messages } = body;
          const character = CHARACTERS[recipientId];
          if (
            !["briefing", "direct", "classroom", "evaluation"].includes(mode) ||
            (["briefing", "evaluation"].includes(mode) && recipientId !== "vautier") ||
            (mode === "direct" && !character) ||
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > MAX_MESSAGES ||
            !messages.every(isChatMessage)
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
                        ? evaluationPrompt()
                        : mode === "direct"
                          ? directPrompt(character)
                          : CLASSROOM_PROMPT,
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
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            response.write(Buffer.from(value));
          }
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