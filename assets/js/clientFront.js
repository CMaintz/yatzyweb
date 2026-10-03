const form = document.querySelector("#addPlayerForm");
const startButton = document.querySelector("#startButton");
const playerNameInput = document.querySelector("#playername");
const playersList = document.querySelector("#userList");
const noPlayersMessage = document.querySelector("#noPlayersMessage");
const statusLine = document.querySelector("#status");

function say(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle("error", isError);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) return say("Enter a player name.", true);

  const response = await fetch("/add-player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return say(data.message || "Could not add player.", true);

  updatePlayersList(data.players);
  say(`${name} joined.`);
});

startButton?.addEventListener("click", async () => {
  const response = await fetch("/play");
  if (response.ok) {
    window.location.href = "/play";
  } else {
    const data = await response.json().catch(() => ({}));
    say(data.message || "Could not start the game.", true);
  }
});

function updatePlayersList(players) {
  playerNameInput.value = "";
  playerNameInput.focus();
  noPlayersMessage.hidden = players.length > 0;
  startButton.disabled = players.length < 2;
  playersList.replaceChildren(
    ...players.map((player) => {
      const item = document.createElement("li");
      item.classList.add("player");
      item.textContent = player.name;
      return item;
    })
  );
}
