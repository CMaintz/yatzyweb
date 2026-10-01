const express = require("express");
const session = require("express-session");
const GameState = require("./backend/GameState"); // GameState klasse som holder styr på spillet
const app = express();
const PORT = process.env.PORT || 8080;
const MAX_NAME_LENGTH = 30;
const DIE_ID = /^d[0-4]$/;
const IDLE_LIMIT_MS = 24 * 60 * 60 * 1000;

// Ét spil pr. session, så to browsere ikke spiller det samme spil
const games = new Map();

setInterval(() => {
  const cutoff = Date.now() - IDLE_LIMIT_MS;
  for (const [id, entry] of games) {
    if (entry.lastSeen < cutoff) games.delete(id);
  }
}, 60 * 60 * 1000).unref();

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(`${__dirname}/assets`));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: IDLE_LIMIT_MS },
  })
);

app.use((req, res, next) => {
  let entry = games.get(req.sessionID);
  if (!entry) {
    entry = { game: new GameState() };
    games.set(req.sessionID, entry);
  }
  entry.lastSeen = Date.now();
  req.game = entry.game;
  next();
});

function turnData(game) {
  return {
    currentUser: game.getCurrentPlayer(),
    dice: game.getDice(),
    rollsLeft: game.getRollsLeft(),
    round: game.getRoundCount(),
    scores: game.generateScoreData(),
    players: game.getPlayers(),
  };
}

function requireGameInProgress(req, res, next) {
  if (!req.game.gameInProgress) {
    return res
      .status(409)
      .json({ success: false, message: "No game in progress." });
  }
  next();
}

// Home page route (forside)
app.get("/", (req, res) => {
  if (req.game.finalScores) {
    req.game = new GameState();
    games.get(req.sessionID).game = req.game;
  }
  res.render("frontpage", {
    players: req.game.getPlayers(),
    gameStarted: req.game.gameInProgress,
  });
});

// Play route (spilsiden, når spillet er startet)
app.get("/play", (req, res) => {
  const game = req.game;
  if (game.finalScores) {
    return res.redirect("/end");
  }
  if (!game.gameInProgress) {
    try {
      game.startGame();
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
  res.render("gamepage", turnData(game));
});

app.get("/end", (req, res) => {
  if (!req.game.finalScores) {
    return res.redirect(req.game.gameInProgress ? "/play" : "/");
  }

  res.render("endpage", {
    finalScores: req.game.finalScores,
  });
});

app.get("/roll", requireGameInProgress, (req, res) => {
  const game = req.game;
  if (game.getRollsLeft() === 0) {
    return res
      .status(409)
      .json({ success: false, message: "No rolls left this turn." });
  }
  game.rollDice();
  res.status(200).json({ success: true, ...turnData(game) });
});

app.post("/add-player", (req, res) => {
  const game = req.game;
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Player name is required" });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Player name can be at most ${MAX_NAME_LENGTH} characters`,
    });
  }
  if (game.gameInProgress || game.finalScores) {
    return res
      .status(409)
      .json({ success: false, message: "The game has already started" });
  }
  if (game.getPlayerByName(name)) {
    return res
      .status(400)
      .json({ success: false, message: "Player already exists" });
  }

  game.addPlayer(name);
  return res.status(200).json({
    success: true,
    players: game.getPlayers(),
  });
});

app.put("/updatescore", requireGameInProgress, (req, res) => {
  const game = req.game;
  const { category } = req.body;
  if (typeof category !== "string" || !category) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category." });
  }
  if (game.getRollsLeft() === 3) {
    return res
      .status(409)
      .json({ success: false, message: "Roll the dice before scoring." });
  }
  try {
    game.selectScore(category);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  game.nextTurn();
  if (game.finalScores) {
    return res.status(200).json({ redirectToEnd: true });
  }
  res.status(200).json(turnData(game));
});

app.put("/hold/:diceID", requireGameInProgress, (req, res) => {
  const id = req.params.diceID;
  if (!DIE_ID.test(id)) {
    return res.status(400).json({ success: false, message: "Invalid die id." });
  }
  if (req.game.getRollsLeft() === 3) {
    return res
      .status(409)
      .json({ success: false, message: "Roll the dice before holding." });
  }
  const die = req.game.getDieById(id);
  die.toggleHold();
  res.status(200).json({ held: die.isHeld });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
