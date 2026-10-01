const rollButton = document.querySelector("#roll-button");
const diceElements = document.querySelectorAll(".die");
const fields = document.querySelectorAll(".score-display");
const rollCountElement = document.querySelector(".roll-count");
const roundCountElement = document.querySelector(".round-count");

//Event listeners...
diceElements.forEach((die) => {
  die.addEventListener("click", diceHold);
});

rollButton.addEventListener("click", rollDice);

fields.forEach((field) => {
  field.addEventListener("click", scorePicked);
});

//Funktionerne der er tilføjet til diverse events

async function scorePicked(event) {
  const field = event.currentTarget;

  const response = await fetch("/updatescore", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: field.id }),
  });

  if (response.ok) {
    const data = await response.json();
    if (data.redirectToEnd) {
      window.location.href = "/end";
    } else {
      updateGUI(data);
      alert(`It's now ${data.currentUser.name}'s turn!`);
    }
  } else {
    const error = await response.json().catch(() => ({}));
    alert(error.message || "An error occurred.");
  }
}

async function diceHold(event) {
  let selectedDie = event.currentTarget;
  const response = await fetch(`/hold/${selectedDie.id}`, {
    method: "PUT",
  });
  if (response.status === 200) {
    const data = await response.json();
    const container = selectedDie.closest(".individual-dice-container");
    if (container) {
      container.classList.toggle("held", data.held);
    }
  }
}

async function rollDice() {
  const response = await fetch("/roll", {
    method: "GET",
  });

  if (response.status === 200) {
    const data = await response.json();
    animateDiceRoll(data.dice, () => {
      //et bette callback
      updateGUI(data);
    });
  } else {
    const error = await response.json().catch(() => ({}));
    alert(error.message || "Could not roll the dice.");
  }
}

//Funktioner til opdatering af GUI
function updateGUI(data) {
  const scores = data.scores;
  const players = data.players;
  const dice = data.dice;

  dice.forEach((die) => {
   
    const dieElement = document.querySelector(`#${die.id}`);
    dieElement.src = `images/dice_${die.value}.png`;
    const container = dieElement.closest(".individual-dice-container");
    container.classList.toggle("held", die.isHeld);
  });

  fields.forEach((field) => {
    field.value = scores[field.id].score;
    field.classList.toggle("saved", scores[field.id].saved);
  });

  rollCountElement.textContent = `Rolls left: ${data.rollsLeft}`;
  roundCountElement.textContent = `Round ${data.round}`;
  rollButton.disabled = data.rollsLeft === 0;

  const playerName = document.querySelector(".currentPlayerName");
  playerName.textContent = `Current Player: ${data.currentUser.name}`;

  updateScoreboard(players);
}

function updateScoreboard(players) {
  const scoreboardList = document.querySelector(".scoreboard ul");
  scoreboardList.innerHTML = "";

  const maxScore = Math.max(...players.map((p) => p.totalScore)); // Find den højeste score

  players.forEach((player) => {
    const listItem = document.createElement("li");

    if (player.totalScore === maxScore) {
      listItem.classList.add("leader");
    }

    const playerName = document.createElement("span");
    playerName.classList.add("player-name");
    playerName.textContent = `${player.name}: `;

    const playerScore = document.createElement("span");
    playerScore.classList.add("player-score");
    playerScore.textContent = player.totalScore;

    listItem.appendChild(playerName);
    listItem.appendChild(playerScore);
    scoreboardList.appendChild(listItem);
  });
}

function animateDiceRoll(dice, callback) {
  let completedRolls = 0; 

  dice.forEach((die) => {
    if (die.isHeld) {
      completedRolls++;
      return;
    }

    let currentStep = 0;
    const totalSteps = 18 + Math.floor(Math.random() * 3);
    const dieElement = document.querySelector(`#${die.id}`);
    if (!dieElement) return;

    function animate() {
      const faceIndex = (currentStep % 6) + 1; 
      dieElement.src = `images/dice_${faceIndex}.png`;

      currentStep++;
      if (currentStep <= totalSteps) {
        setTimeout(animate, 100); 
      } else {
        
        dieElement.src = `images/dice_${die.value}.png`;
        completedRolls++;

        if (completedRolls === dice.length) {
          callback();
        }
      }
    }

    animate();
  });
}
