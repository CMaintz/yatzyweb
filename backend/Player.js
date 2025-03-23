class Player {
  constructor(name) {
    this.name = name;
    this.scores = {};
    this.bonus = 0;
    this.totalScore = 0;
  }

  updateScore(category, newScore) {
    if (this.scores[category] !== undefined) {
      throw new Error(`Category "${category}" is already selected.`);
    }
    this.scores[category] = newScore;
    this.totalScore += newScore;

    if (this.calculateUpperSum() >= 63 && this.bonus === 0) {
      this.bonus = 50;
      this.totalScore += 50;
    }
  }

  calculateUpperSum() {
    const upperCategories = ["1-s", "2-s", "3-s", "4-s", "5-s", "6-s", "bonus"];
    return upperCategories.reduce(
      (sum, cat) => sum + (this.scores[cat] ?? 0),
      0
    );
  }

  calculateLowerSum() {
    const lowerCategories = [
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
    return lowerCategories.reduce(
      (sum, cat) => sum + (this.scores[cat] ?? 0),
      0
    );
  }
}

module.exports = Player;
