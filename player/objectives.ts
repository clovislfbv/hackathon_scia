export type Objective = {
  label: string;
  validated?: boolean;
};

export function createObjectivesPanel() {
  const panel = document.querySelector<HTMLElement>("#objectives-panel");
  const list = document.querySelector<HTMLElement>("#objectives-list");
  const empty = document.querySelector<HTMLElement>("#objectives-empty");
  let objectives: Objective[] = [];

  function render() {
    list.replaceChildren();
    empty.hidden = objectives.length > 0;
    for (const objective of objectives) {
      const item = document.createElement("li");
      item.className = objective.validated === undefined
        ? "objective"
        : `objective ${objective.validated ? "is-validated" : "is-not-validated"}`;
      const checkbox = document.createElement("input");
      checkbox.className = "objective-checkbox";
      checkbox.type = "checkbox";
      checkbox.checked = objective.validated === true;
      checkbox.disabled = true;
      checkbox.setAttribute(
        "aria-label",
        `${objective.label} : ${objective.validated === undefined ? "en attente d'évaluation" : objective.validated ? "validé" : "non validé"}`,
      );
      const label = document.createElement("span");
      label.textContent = objective.label;
      item.append(checkbox, label);
      list.append(item);
    }
  }

  return {
    setObjectives: (labels: string[]) => {
      objectives = labels.map((label) => ({ label }));
      panel.hidden = objectives.length === 0;
      render();
    },
    setResults: (results: boolean[]) => {
      objectives = objectives.map((objective, index) => ({ ...objective, validated: results[index] ?? false }));
      panel.hidden = objectives.length === 0;
      render();
    },
    labels: () => objectives.map((objective) => objective.label),
  };
}