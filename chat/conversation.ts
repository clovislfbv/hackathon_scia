import katex from "katex";
import "katex/dist/katex.min.css";

const CHARACTERS = {
  alex: { name: "Alex", role: "L'intello", portrait: "/portraits/alex.svg" },
  lucas: { name: "Lucas", role: "Le perturbateur", portrait: "/portraits/lucas.svg" },
  sam: { name: "Sam", role: "Le perdu", portrait: "/portraits/sam.svg" },
  vautier: { name: "M. Vautier", role: "Examinateur", portrait: "/portraits/vautier.svg" },
};

const classroom = { name: "La classe", role: "Discussion générale" };

type ConversationOptions = {
  controls: { unlock: () => void };
  onBriefingComplete?: () => void;
  onClassroomResponse?: (answer: string) => void;
  onObjectivesReceived?: (labels: string[]) => void;
  onEvaluationComplete?: (results: boolean[]) => void;
  objectives?: () => string[];
};

export function createConversation({
  controls,
  onBriefingComplete = () => {},
  onClassroomResponse = (_answer: string) => {},
  onObjectivesReceived = (_labels: string[]) => {},
  onEvaluationComplete = (_results: boolean[]) => {},
  objectives = () => [],
}: ConversationOptions) {
  const panel = document.querySelector<HTMLElement>("#chat-panel");
  const title = document.querySelector<HTMLElement>("#chat-title");
  const role = document.querySelector<HTMLElement>("#chat-role");
  const messagesElement = document.querySelector<HTMLElement>("#chat-messages");
  const form = document.querySelector<HTMLFormElement>("#chat-form");
  const input = document.querySelector<HTMLInputElement>("#chat-input");
  const closeButton = document.querySelector<HTMLButtonElement>("#close-chat");
  const status = document.querySelector<HTMLElement>("#chat-status");
  const submitButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const restartButton = document.querySelector<HTMLButtonElement>("#restart-game-button");
  const histories = { alex: [], lucas: [], sam: [], vautier: [], briefing: [], classroom: [], evaluation: [] };
  let current = null;
  let busy = false;
  let briefingLocked = false;
  let evaluationLocked = false;

  function extractMetadata(answer: string, marker: string) {
    const expression = new RegExp(`\\s*\\[\\[${marker}:(\\[[\\s\\S]*?\\])\\]\\]\\s*$`);
    const match = answer.match(expression);
    if (!match) return { content: answer.trim(), value: null };
    try {
      return { content: answer.replace(expression, "").trim(), value: JSON.parse(match[1]) };
    } catch {
      return { content: answer.trim(), value: null };
    }
  }

  function currentHistory() {
    return current ? histories[current.key] : [];
  }

  function setChatInputVisible(visible: boolean) {
    form.hidden = !visible;
    input.hidden = !visible;
    submitButton.hidden = !visible;
    input.disabled = !visible;
    submitButton.disabled = !visible;
  }

  function appendMath(parent: HTMLElement, formula: string, displayMode: boolean, fallback: string) {
    const math = document.createElement(displayMode ? "div" : "span");
    math.className = displayMode ? "math-display" : "math-inline";
    try {
      katex.render(formula, math, { displayMode, throwOnError: true, trust: false });
      parent.append(math);
    } catch {
      parent.append(document.createTextNode(fallback));
    }
  }

  function appendInlineMarkdown(parent: HTMLElement, content: string) {
    const tokens = /(`[^`]+`|\$[^$\n]+\$|\\\([^\n]+?\\\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
    let cursor = 0;
    for (const match of content.matchAll(tokens)) {
      parent.append(document.createTextNode(content.slice(cursor, match.index)));
      const value = match[0];
      if (value.startsWith("`")) {
        const code = document.createElement("code");
        code.textContent = value.slice(1, -1);
        parent.append(code);
      } else if (value.startsWith("$")) {
        appendMath(parent, value.slice(1, -1), false, value);
      } else if (value.startsWith("\\(")) {
        appendMath(parent, value.slice(2, -2), false, value);
      } else if (value.startsWith("**") || value.startsWith("__")) {
        const strong = document.createElement("strong");
        strong.textContent = value.slice(2, -2);
        parent.append(strong);
      } else if (value.startsWith("*") || value.startsWith("_")) {
        const emphasis = document.createElement("em");
        emphasis.textContent = value.slice(1, -1);
        parent.append(emphasis);
      } else {
        const link = document.createElement("a");
        const [, label, href] = value.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/) ?? [];
        link.textContent = label;
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        parent.append(link);
      }
      cursor = (match.index ?? 0) + value.length;
    }
    parent.append(document.createTextNode(content.slice(cursor)));
  }

  function renderMarkdown(element: HTMLElement, content: string) {
    element.replaceChildren();
    const lines = content.split("\n");
    let list: HTMLUListElement | HTMLOListElement | null = null;
    let quote: HTMLQuoteElement | null = null;
    let code: HTMLPreElement | null = null;
    let math: string[] | null = null;
    for (const line of lines) {
      if (line.startsWith("```")) {
        if (code) {
          element.append(code);
          code = null;
        } else code = document.createElement("pre");
        list = null;
        quote = null;
        continue;
      }
      if (code) {
        code.textContent += `${line}\n`;
        continue;
      }
      if (line.trim() === "$$" || line.trim() === "\\[") {
        math = [];
        list = null;
        quote = null;
        continue;
      }
      if (math) {
        if (line.trim() === "$$" || line.trim() === "\\]") {
          appendMath(element, math.join("\n"), true, `$$${math.join("\n")}$$`);
          math = null;
        } else math.push(line);
        continue;
      }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const unordered = line.match(/^[-*+]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (heading) {
        const title = document.createElement(`h${heading[1].length}`);
        appendInlineMarkdown(title, heading[2]);
        element.append(title);
      } else if (unordered || ordered) {
        const isOrdered = Boolean(ordered);
        if (!list || (isOrdered && list.tagName !== "OL") || (!isOrdered && list.tagName !== "UL")) {
          list = document.createElement(isOrdered ? "ol" : "ul");
          element.append(list);
        }
        const item = document.createElement("li");
        appendInlineMarkdown(item, (unordered ?? ordered)[1]);
        list.append(item);
      } else if (line.startsWith("> ")) {
        if (!quote) {
          quote = document.createElement("blockquote");
          element.append(quote);
        }
        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, line.slice(2));
        quote.append(paragraph);
      } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        element.append(document.createElement("hr"));
      } else if (line.trim()) {
        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, line);
        element.append(paragraph);
      }
      if (!unordered && !ordered) list = null;
      if (!line.startsWith("> ")) quote = null;
    }
    if (code) element.append(code);
    if (math) element.append(document.createTextNode(`$$${math.join("\n")}$$`));
  }

  function renderMessageContent(message: HTMLElement, content: string, markdown = false) {
    const text = message.querySelector<HTMLElement>(".message-text");
    if (text) {
      if (markdown) renderMarkdown(text, content);
      else text.textContent = content;
    } else message.textContent = content;
  }

  function appendMessage(kind, content, character = null) {
    const message = document.createElement("div");
    message.className = `message ${kind}`;
    if (character) {
      const portrait = document.createElement("img");
      portrait.className = "message-portrait";
      portrait.src = character.portrait;
      portrait.alt = `Portrait de ${character.name}`;
      const body = document.createElement("div");
      body.className = "message-body";
      const identity = document.createElement("div");
      identity.className = "message-identity";
      identity.textContent = character.name;
      const description = document.createElement("span");
      description.textContent = character.role;
      const text = document.createElement("div");
      text.className = "message-text";
      body.append(identity, description, text);
      message.append(portrait, body);
      renderMessageContent(message, content, kind === "agent");
    } else {
      message.append(document.createTextNode(content));
    }
    messagesElement.append(message);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    return message;
  }

  function characterFromSpeaker(speaker) {
    return Object.entries(CHARACTERS).find(([, character]) => character.name.toUpperCase() === speaker)?.[1] ?? null;
  }

  function appendAgentMessage(content, session) {
    const turns = [...content.matchAll(/^\s*\[?(ALEX|LUCAS|SAM|VAUTIER)\]?\s*:\s*(.*)$/gim)];
    if (session.mode === "classroom" && turns.length) {
      return turns.map((turn) => appendMessage("agent", turn[2], characterFromSpeaker(turn[1])));
    }
    return [appendMessage("agent", content, session.character)];
  }

  function renderHistory() {
    messagesElement.replaceChildren();
    for (const message of currentHistory()) {
      if (message.role === "user") appendMessage("user", message.content);
      else appendAgentMessage(message.content, current);
    }
  }

  function open(mode, recipientId = null, initialMessage = "") {
    if (mode === "direct" && !CHARACTERS[recipientId]) return;
    if (busy) return;
    if (evaluationLocked) return;
    if (briefingLocked && mode !== "briefing") return;
    current = {
      mode,
      recipientId,
      key: mode === "direct" ? recipientId : mode,
      character: mode === "direct" || mode === "briefing" ? CHARACTERS[recipientId] : classroom,
    };
    if (initialMessage && histories[current.key].length === 0) {
      histories[current.key].push({ role: "assistant", content: initialMessage });
    }
    title.textContent = mode === "classroom" ? "À la classe" : `À ${current.character.name}`;
    role.textContent = current.character.role;
    status.textContent = "";
    setChatInputVisible(mode !== "evaluation");
    restartButton.hidden = true;
    closeButton.hidden = mode === "briefing" || mode === "evaluation";
    renderHistory();
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    controls.unlock();
    input.focus();
  }

  async function requestEvaluation() {
    const transcript = [...histories.briefing, ...histories.classroom];
    if (!transcript.length || busy) return;
    evaluationLocked = true;
    current = {
      mode: "evaluation",
      recipientId: "vautier",
      key: "evaluation",
      character: CHARACTERS.vautier,
    };
    title.textContent = "Bilan de M. Vautier";
    role.textContent = "Évaluation du cours";
    status.textContent = "L'examinateur analyse le cours…";
    setChatInputVisible(false);
    restartButton.hidden = true;
    renderHistory();
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    controls.unlock();
    busy = true;
    const responseMessage = appendMessage("agent", "", current.character);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluation",
          recipientId: "vautier",
          messages: transcript,
          objectives: objectives(),
        }),
      });
      if (!response.ok || !response.body) throw new Error((await response.text()) || "Évaluation impossible.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        renderMessageContent(responseMessage, answer);
        messagesElement.scrollTop = messagesElement.scrollHeight;
      }
      const parsed = extractMetadata(answer, "OBJECTIVE_RESULTS");
      renderMessageContent(responseMessage, parsed.content, true);
      histories.evaluation = [{ role: "assistant", content: parsed.content }];
      if (Array.isArray(parsed.value)) onEvaluationComplete(parsed.value.map((result) => result === true));
      setChatInputVisible(false);
      restartButton.hidden = false;
      status.textContent = "";
    } catch (error) {
      responseMessage.remove();
      status.textContent = error instanceof Error ? error.message : "Erreur d'évaluation.";
    } finally {
      busy = false;
    }
  }

  function close(force = false) {
    if (!current) return;
    if (evaluationLocked && !force) return;
    if (briefingLocked && !force) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    input.value = "";
    status.textContent = "";
    current = null;
  }

  function finishBriefing() {
    briefingLocked = false;
    close(true);
  }

  async function send(text) {
    const session = current;
    const history = currentHistory();
    const next = [...history, { role: "user", content: text }];
    histories[session.key] = next;
    appendMessage("user", text);
    busy = true;
    submitButton.disabled = true;
    input.disabled = true;
    status.textContent = `${session.character.name} réfléchit…`;
    const responseMessage =
      session.mode === "classroom"
        ? appendMessage("agent", "")
        : appendMessage("agent", "", session.character);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: session.mode,
          recipientId: session.recipientId,
          messages: next,
          objectives: objectives(),
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error((await response.text()) || "L'IA n'a pas répondu.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        renderMessageContent(responseMessage, answer);
        messagesElement.scrollTop = messagesElement.scrollHeight;
      }
      if (!answer.trim()) throw new Error("L'IA a renvoyé une réponse vide.");
      const parsed = session.mode === "briefing"
        ? extractMetadata(answer, "OBJECTIVES")
        : { content: answer, value: null };
      answer = parsed.content;
      renderMessageContent(responseMessage, answer, session.mode !== "classroom");
      if (session.mode === "classroom") {
        responseMessage.remove();
        appendAgentMessage(answer, session);
      }
      histories[session.key] = [...next, { role: "assistant", content: answer }];
      if (session.mode === "briefing") onBriefingComplete();
      if (session.mode === "briefing" && Array.isArray(parsed.value)) {
        const labels = parsed.value.filter((label) => typeof label === "string" && label.trim()).map((label) => label.trim()).slice(0, 5);
        if (labels.length) onObjectivesReceived(labels);
      }
      if (session.mode === "classroom") onClassroomResponse(answer);
      status.textContent = "";
    } catch (error) {
      responseMessage.remove();
      histories[session.key] = next;
      status.textContent = error instanceof Error ? error.message : "Erreur de discussion.";
    } finally {
      busy = false;
      submitButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || !current || busy) return;
    input.value = "";
    send(text);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  closeButton.addEventListener("click", () => close());
  restartButton.addEventListener("click", () => window.location.reload());
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && current) {
      event.preventDefault();
      close();
    } else if (event.key.toLowerCase() === "t" && !current && !event.repeat) {
      event.preventDefault();
      open("classroom");
    }
  });

  return {
    openDirect: (recipientId) => open("direct", recipientId),
    openBriefing: () => {
      briefingLocked = true;
      open("briefing", "vautier", "Quel est le sujet du cours d'aujourd'hui ?");
    },
    openClassroom: () => open("classroom"),
    requestEvaluation,
    close,
    finishBriefing,
    isOpen: () => current !== null,
  };
}