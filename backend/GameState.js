const fs = require("fs");
const Player = require("./Player");
const Dice = require("./Dice");
const YahtzeeBrain = require("./YahtzeeBrain");

class GameState {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.dice = [
      new Dice("d0"),
      new Dice("d1"),
      new Dice("d2"),
      new Dice("d3"),
      new Dice("d4"),
    ];
    this.rollsLeft = 3;
    this.roundNumber = 1;
    this.gameInProgress = false;

    if (fs.existsSync("./saves/gameState.json")) {
      this.loadGame();
    }
  }

  addPlayer(playername) {
    let player = new Player(playername);
    this.players.push(player);
    this.saveGame();
    return player;
  }

  startGame() {
      if (this.players.length < 2) {
      throw new Error("Need at least 2 players to start the game.");
    }
    this.gameInProgress = true;
    this.saveGame();
  }
  
//TODO: skal også gemme players, som skal loades ind i GameState. :C
  async rollDice() {
    if (this.rollsLeft === 0) {
      throw new Error("No rolls left for this turn.");
    }
    this.dice.forEach((die) => {
      if (!die.isHeld) {
        die.roll();
      }
    });
    this.rollsLeft -= 1;
    this.saveGame();
  }

  selectScore(category) {
    let currentPlayer = this.players[this.currentPlayerIndex];
    currentPlayer.updateScore(
      category,
      YahtzeeBrain.calculateScore(this.dice, category)
    );
    this.saveGame();
  }

  nextTurn() {
    this.rollsLeft = 3;
    this.dice.forEach((die) => {
      die.isHeld = false;
      die.value = 0;
    });

    this.currentPlayerIndex++;
    if (this.currentPlayerIndex >= this.players.length) {
      this.currentPlayerIndex = 0;
      this.roundNumber++;
    }

    if (this.isGameOver()) {
      this.gameInProgress = false;
      this.generateFinalScores();
    }
    this.saveGame();
  }

  // rangliste baseret på score
  generateFinalScores() {
    this.finalScores = this.players
      .map((player) => ({
        name: player.name,
        totalScore: player.totalScore,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  isGameOver() {
    return this.players.every(
      (player) => Object.keys(player.scores).length === 15
    );
  }

  isGameInProgress() {
    return this.gameInProgress;
  }

  saveGame() {
    const data = JSON.stringify(this);
    fs.writeFileSync("./saves/gameState.json", data);
  }

  loadGame() {
    const data = fs.readFileSync("./saves/gameState.json");
    Object.assign(this, JSON.parse(data));
  }

  removeGameFile() {
    if (fs.existsSync("./saves/gameState.json")) {
      try {
        fs.unlinkSync("./saves/gameState.json"); // Sletter filen synkront
        return true;
      } catch (error) {
        console.error(`Kunne ikke fjerne fil:`, error);
        return false;
      }
    } else {
      console.warn(`Filen eksisterer ikke`);
      return false;
    }
  }

  getRoundCount() {
    return this.roundNumber;
  }

  generateScoreData() {
    let currentPlayer = this.players[this.currentPlayerIndex];
    let scoreData = {};
    const cat = Object.keys(YahtzeeBrain); //Kan erstattes med det array fra APP
    console.log(cat);
    const categories = [
      "1-s",
      "2-s",
      "3-s",
      "4-s",
      "5-s",
      "6-s",
      "one-pair",
      "two-pairs",
      "three-same",
      "four-same",
      "full-house",
      "small-straight",
      "large-straight",
      "chance",
      "yatzy",
    ];

    categories.forEach((category) => {
      if (currentPlayer.scores[category] !== undefined) {
        scoreData[category] = {
          score: currentPlayer.scores[category],
          saved: true,
        };
      } else {
        scoreData[category] = {
          score: YahtzeeBrain.calculateScore(this.dice, category),
          saved: false,
        };
      }
    });
    scoreData["bonus"] = {
      score: currentPlayer.bonus,
      saved: true,
    };
    scoreData["upper-sum"] = {
      score: currentPlayer.calculateUpperSum(),
      saved: true,
    };
    scoreData["lower-sum"] = {
      score: currentPlayer.calculateLowerSum(),
      saved: true,
    };
    scoreData["grand-total"] = {
      score: currentPlayer.totalScore,
      saved: true,
    };
    return scoreData;
  }

  getPlayerByName(name) {
    return this.players.find((player) => player.name === name);
  }
  getDieById(id) {
    return this.dice.find((die) => die.id === id);
  }
  getPlayers() {
    return this.players;
  }
  getDiceValues() {
    return this.dice.map((die) => die.value);
  }
  getRollsLeft() {
    return this.rollsLeft;
  }
  getDice() {
    return this.dice;
  }
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }
}

module.exports = GameState;
