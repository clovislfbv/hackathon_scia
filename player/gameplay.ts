export function createGameplay({ conversation, students, objectives }) {
  const readyButton = document.querySelector<HTMLButtonElement>("#ready-button");
  const endButton = document.querySelector<HTMLButtonElement>("#end-class-button");
  const phaseStatus = document.querySelector<HTMLElement>("#phase-status");
  const transition = document.querySelector<HTMLElement>("#phase-transition");
  let phase = "briefing";

  for (const student of students) student.visible = false;
  readyButton.disabled = true;

  function startClass() {
    if (phase !== "briefing") return;
    phase = "transitioning";
    readyButton.disabled = true;
    readyButton.hidden = true;
    phaseStatus.textContent = "Entrée dans la salle de classe…";
    conversation.finishBriefing();
    transition.hidden = false;
    requestAnimationFrame(() => transition.classList.add("is-visible"));
    window.setTimeout(() => {
      for (const student of students) student.visible = true;
      endButton.hidden = false;
      phase = "classroom";
      phaseStatus.textContent = "Cours en cours";
      conversation.openClassroom();
      transition.classList.remove("is-visible");
      window.setTimeout(() => { transition.hidden = true; }, 450);
    }, 500);
  }

  function endClass() {
    if (phase !== "classroom") return;
    phase = "evaluation";
    endButton.hidden = true;
    phaseStatus.textContent = "Évaluation finale";
    conversation.requestEvaluation();
  }

  readyButton.addEventListener("click", startClass);
  endButton.addEventListener("click", endClass);

  return {
    briefingComplete: () => {
      if (phase !== "briefing") return;
      readyButton.disabled = false;
      phaseStatus.textContent = "Briefing terminé : tu peux commencer le cours";
    },
    objectivesReceived: (labels: string[]) => {
      if (phase !== "briefing" || !labels.length) return;
      objectives.setObjectives(labels);
      readyButton.disabled = false;
      phaseStatus.textContent = "Objectifs reçus : tu peux commencer le cours";
    },
    evaluationComplete: (results: boolean[]) => objectives.setResults(results),
    classroomResponse: (answer) => {
      if (phase === "classroom" && answer.includes("[END_COURSE]")) endClass();
    },
    start: () => conversation.openBriefing(),
  };
}