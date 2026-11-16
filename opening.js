const openingControls = document.querySelector(".opening-controls");
const openingButtons = [...openingControls.querySelectorAll("button")];
const openingScenes = [...document.querySelectorAll(".opening-shot")];

function showScene(selected) {
  for (const button of openingButtons) {
    button.setAttribute("aria-pressed", String(button === selected));
  }
  for (const scene of openingScenes) {
    const active = scene.dataset.scene === selected.dataset.shot;
    scene.classList.toggle("current", active);
    scene.inert = !active;
    scene.setAttribute("aria-hidden", String(!active));
  }
}

for (const button of openingButtons) {
  button.addEventListener("click", () => showScene(button));
}
openingControls.hidden = false;
