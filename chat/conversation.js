const CHARACTERS = {
  alex: { name: "Alex", role: "L'intello", portrait: "/portraits/alex.svg" },
  lucas: { name: "Lucas", role: "Le perturbateur", portrait: "/portraits/lucas.svg" },
  sam: { name: "Sam", role: "Le perdu", portrait: "/portraits/sam.svg" },
  vautier: { name: "M. Vautier", role: "Examinateur", portrait: "/portraits/vautier.svg" },
};

const classroom = { name: "La classe", role: "Discussion générale" };

export function createConversation({ controls }) {
  const panel = document.querySelector("#chat-panel");
  const title = document.querySelector("#chat-title");
  const role = document.querySelector("#chat-role");
  const messagesElement = document.querySelector("#chat-messages");
  const form = document.querySelector("#chat-form");
  const input = document.querySelector("#chat-input");
  const closeButton = document.querySelector("#close-chat");
  const status = document.querySelector("#chat-status");
  const submitButton = form.querySelector("button[type=submit]");
  const histories = { alex: [], lucas: [], sam: [], vautier: [], classroom: [] };
  let current = null;
  let busy = false;

  function currentHistory() {
    return current ? histories[current.key] : [];
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
      text.textContent = content;
      body.append(identity, description, text);
      message.append(portrait, body);
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

  function open(mode, recipientId = null) {
    if (mode === "direct" && !CHARACTERS[recipientId]) return;
    if (busy) return;
    current = {
      mode,
      recipientId,
      key: mode === "direct" ? recipientId : "classroom",
      character: mode === "direct" ? CHARACTERS[recipientId] : classroom,
    };
    title.textContent = mode === "direct" ? `À ${current.character.name}` : "À la classe";
    role.textContent = current.character.role;
    status.textContent = "";
    renderHistory();
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    controls.unlock();
    input.focus();
  }

  function close() {
    if (!current) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    input.value = "";
    status.textContent = "";
    current = null;
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
        const textElement = responseMessage.querySelector(".message-text");
        if (textElement) textElement.textContent = answer;
        else responseMessage.textContent = answer;
        messagesElement.scrollTop = messagesElement.scrollHeight;
      }
      if (!answer.trim()) throw new Error("L'IA a renvoyé une réponse vide.");
      if (session.mode === "classroom") {
        responseMessage.remove();
        appendAgentMessage(answer, session);
      }
      histories[session.key] = [...next, { role: "assistant", content: answer }];
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
  closeButton.addEventListener("click", close);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && current) {
      event.preventDefault();
      close();
    } else if (event.key.toLowerCase() === "t" && !current && !event.repeat) {
      event.preventDefault();
      open("classroom");
    }
  });

  return { openDirect: (recipientId) => open("direct", recipientId), openClassroom: () => open("classroom"), isOpen: () => current !== null };
}