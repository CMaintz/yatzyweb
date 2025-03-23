const opretButton = document.querySelector("#opretButton");
const startButton = document.querySelector("#startButton");
const playerNameInput = document.querySelector("#playername");
const playersList = document.querySelector("#userList");
const noPlayersMessage = document.querySelector("#noPlayersMessage"); // Elementet med meddelelsen "Ingen spillere tilmeldt endnu."

if (opretButton) {
  opretButton.addEventListener("click", addPlayer);
}

// Start spillet og / eller gå til spil-siden
startButton.addEventListener("click", async () => {
  const response = await fetch("/play", {
    method: "GET",
  });

  if (response.status !== 200) {
    const data = await response.json();
    alert(data.message);
  } else {
    window.location.href = "/play";
  }
});

async function addPlayer() {
  const playerName = playerNameInput.value.trim();
  if (playerName === "") {
    alert("Please enter a player name!");
    return;
  }

  const response = await fetch("/add-player", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: playerName }),
  });

  if (response.status === 200) {
    const data = await response.json();
    updatePlayersList(data.players);
  } else {
    const errorData = await response.json();
    alert(errorData.message || "You suck");
  }
}

// Opdaterer spiller liste i GUI
function updatePlayersList(players) {
  playerNameInput.value = "";
  noPlayersMessage.style.display = "none";
  playersList.innerHTML = "";
  players.forEach((player) => {
    const playerItem = document.createElement("li");
    playerItem.classList.add("player");
    playerItem.textContent = player.name;
    playersList.appendChild(playerItem);
  });
}
