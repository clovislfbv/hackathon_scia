export function createGameplay({ conversation, students }) {
  const readyButton = document.querySelector<HTMLButtonElement>("#ready-button");
  const endButton = document.querySelector<HTMLButtonElement>("#end-class-button");
  const phaseStatus = document.querySelector<HTMLElement>("#phase-status");
  let phase = "briefing";

  for (const student of students) student.visible = false;
  readyButton.disabled = true;

  function startClass() {
    if (phase !== "briefing") return;
    phase = "classroom";
    for (const student of students) student.visible = true;
    readyButton.hidden = true;
    endButton.hidden = false;
    phaseStatus.textContent = "Cours en cours";
    conversation.close();
    conversation.openClassroom();
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
    classroomResponse: (answer) => {
      if (phase === "classroom" && answer.includes("[END_COURSE]")) endClass();
    },
    start: () => conversation.openBriefing(),
  };
}