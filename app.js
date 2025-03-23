const express = require("express");
const session = require("express-session");
const GameState = require("./backend/GameState"); // GameState klasse som holder styr på spillet
const app = express();
const PORT = "8080";
let gameState = new GameState();

app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("assets"));

app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// Home page route (forside)
app.get("/", (req, res) => {
  if (gameState.finalScores) {
    gameState.removeGameFile();
    gameState = new GameState();
  }
  res.render("frontpage", {
    players: gameState.getPlayers(),
    gameStarted: gameState.gameInProgress,
  });
});

// Play route (spilsiden, når spillet er startet); burde måske være en put eller patch, da et nyt spil kan startes.
app.get("/play", (req, res) => {
  if (!gameState.gameInProgress) {
    if (!gameState.finalScores) {
      gameState.startGame();
    } else {
      //gameState = new GameState();
    }
  }
  res.render("gamepage", {
    currentUser: gameState.getCurrentPlayer(),
    dice: gameState.getDice(),
    rollsLeft: gameState.getRollsLeft(),
    round: gameState.getRoundCount(),
    scores: gameState.generateScoreData(),
    players: gameState.getPlayers(),
  });
});

app.get("/end", (req, res) => {
  if (gameState.gameInProgress) {
    return res.redirect("/play");
  }

  res.render("endpage", {
    finalScores: gameState.finalScores,
  });
});
//TODO: lav en metode, der returnerer alle de hersens data, så det ikke er copy-pasted over det hele. Kunne evt. være den der (.next() dims)
app.get("/roll", (request, response) => {
  if (gameState.getRollsLeft() > 0) {
    gameState.rollDice();
    response.status(200).json({
      success: true,
      currentUser: gameState.getCurrentPlayer(),
      dice: gameState.getDice(),
      rollsLeft: gameState.getRollsLeft(),
      round: gameState.getRoundCount(),
      scores: gameState.generateScoreData(),
      players: gameState.getPlayers(),
    });
  } else {
    response
      .status(420)
      .json({ success: false, message: "no more rolls, fuck off" });
  }
});

app.post("/add-player", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Player name is required" });
  }

  const existingPlayer = gameState.getPlayerByName(name);
  if (existingPlayer) {
    return res
      .status(400)
      .json({ success: false, message: "Player already exists" });
  }
  let newPlayer = gameState.addPlayer(name);
  req.session.player = newPlayer;
  //newPlayer.session = req.session;
  return res.status(200).json({
    success: true,
    message: "Yay!",
    players: gameState.getPlayers(),
  });
});

//TODO: opdel i frontpageRoutes og GameRoutes
app.put("/updatescore", (req, res) => {
  /*if (req.session.player !== gameState.getCurrentPlayer()) {
    return res
      .status(469)
      .json({ success: false, message: "You are not the current player!" });
  }*/
  const { category } = req.body;
  if (!category) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category." });
  }
  try {
    gameState.selectScore(category);
    gameState.nextTurn();
    if (!gameState.finalScores) {
      res.status(200).json({
        currentUser: gameState.getCurrentPlayer(),
        dice: gameState.getDice(),
        rollsLeft: gameState.getRollsLeft(),
        round: gameState.getRoundCount(),
        scores: gameState.generateScoreData(),
        players: gameState.getPlayers(),
      });
    } else {
      res.status(200).json({ redirectToEnd: true });
    }
  } catch (err) {
    console.error("Error updating score:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update score. Please try again.",
    });
  }
});

app.put("/hold/:diceID", (request, response) => {
  const id = request.params.diceID;
  let die = gameState.getDieById(id);
  die.toggleHold();
  response.status(200).json({ held: die.isHeld });
});

// Start serveren
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
