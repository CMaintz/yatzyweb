const rollButton = document.querySelector("#roll-button");
const diceButtons = document.querySelectorAll(".die");
const categories = document.querySelectorAll(".category");
const derived = document.querySelectorAll("[data-derived]");
const rollCount = document.querySelector(".roll-count");
const roundCount = document.querySelector(".round-count");
const playerName = document.querySelector(".currentPlayerName");
const statusLine = document.querySelector("#status");

let rollsLeft = Number(document.querySelector(".game").dataset.rollsLeft);
let busy = false;

for (let face = 1; face <= 6; face++) new Image().src = `/images/dice_${face}.png`;

diceButtons.forEach((die) => die.addEventListener("click", toggleHold));
rollButton.addEventListener("click", rollDice);
categories.forEach((field) => field.addEventListener("click", pickScore));
setControls();
hint();

function say(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle("error", isError);
}

function hint() {
  if (rollsLeft === 3) say(`Roll to start ${playerName.textContent}'s turn.`);
  else if (rollsLeft === 0) say("No rolls left. Pick a score.");
  else say("Click dice to hold them, roll again or pick a score.");
}

async function send(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

async function withBusy(action) {
  if (busy) return;
  busy = true;
  setControls();
  try {
    await action();
  } catch (err) {
    say(err.message, true);
  } finally {
    busy = false;
    setControls();
  }
}

function setControls() {
  rollButton.disabled = busy || rollsLeft === 0;
  diceButtons.forEach((die) => {
    die.disabled = busy || rollsLeft === 3 || rollsLeft === 0;
  });
  categories.forEach((field) => {
    field.disabled = busy || rollsLeft === 3 || field.classList.contains("saved");
  });
}

function pickScore(event) {
  const category = event.currentTarget.id;
  withBusy(async () => {
    const data = await send("/updatescore", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (data.redirectToEnd) {
      window.location.href = "/end";
      return;
    }
    updateGUI(data);
    playerName.classList.remove("flash");
    void playerName.offsetWidth;
    playerName.classList.add("flash");
  });
}

function toggleHold(event) {
  const die = event.currentTarget;
  withBusy(async () => {
    const data = await send(`/hold/${die.id}`, { method: "PUT" });
    die.classList.toggle("held", data.held);
    die.setAttribute("aria-pressed", String(data.held));
  });
}

function rollDice() {
  withBusy(async () => {
    const data = await send("/roll");
    await animateRoll(data.dice);
    updateGUI(data);
  });
}

function updateGUI(data) {
  rollsLeft = data.rollsLeft;

  data.dice.forEach((die) => {
    const button = document.querySelector(`#${die.id}`);
    button.querySelector("img").src = `/images/dice_${die.value}.png`;
    button.querySelector("img").alt = die.value ? `Die showing ${die.value}` : "Unrolled die";
    button.classList.toggle("held", die.isHeld);
    button.classList.toggle("blank", die.value === 0);
    button.setAttribute("aria-pressed", String(die.isHeld));
  });

  categories.forEach((field) => {
    const { score, saved } = data.scores[field.id];
    field.querySelector(".value").textContent = saved || rollsLeft < 3 ? score : "";
    field.classList.toggle("saved", saved);
    field.classList.toggle("zero", !saved && rollsLeft < 3 && score === 0);
  });
  derived.forEach((el) => {
    el.textContent = data.scores[el.dataset.derived].score;
  });

  rollCount.textContent = `Rolls left: ${rollsLeft}`;
  roundCount.textContent = `Round ${data.round} of 15`;
  playerName.textContent = data.currentUser.name;
  updateScoreboard(data.players, data.currentUser.name);
  setControls();
  hint();
}

function updateScoreboard(players, current) {
  const best = Math.max(...players.map((p) => p.totalScore));
  const list = document.querySelector(".scoreboard ol");
  list.replaceChildren(
    ...players.map((player) => {
      const item = document.createElement("li");
      item.classList.toggle("current", player.name === current);
      item.classList.toggle("leader", best > 0 && player.totalScore === best);
      const name = document.createElement("span");
      name.className = "player-name";
      name.textContent = player.name;
      const score = document.createElement("span");
      score.className = "player-score";
      score.textContent = player.totalScore;
      item.append(name, score);
      return item;
    })
  );
}

// Flicks through random faces before landing on the rolled value. Held dice stay put.
function animateRoll(dice) {
  const rolling = dice
    .filter((die) => !die.isHeld)
    .map((die) => {
      const button = document.querySelector(`#${die.id}`);
      const img = button.querySelector("img");
      button.classList.remove("blank");
      button.classList.add("rolling");
      const steps = 8 + Math.floor(Math.random() * 4);
      return new Promise((resolve) => {
        let step = 0;
        const tick = () => {
          if (step++ < steps) {
            img.src = `/images/dice_${1 + Math.floor(Math.random() * 6)}.png`;
            setTimeout(tick, 70);
          } else {
            img.src = `/images/dice_${die.value}.png`;
            button.classList.remove("rolling");
            resolve();
          }
        };
        tick();
      });
    });
  return Promise.all(rolling);
}
