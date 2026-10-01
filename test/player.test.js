const { test } = require("node:test");
const assert = require("node:assert/strict");
const Player = require("../backend/Player");

test("adds 50 bonus once the upper section reaches 63", () => {
  const player = new Player("Anna");
  player.updateScore("6-s", 18);
  player.updateScore("5-s", 15);
  player.updateScore("4-s", 12);
  player.updateScore("3-s", 9);
  assert.equal(player.bonus, 0);
  player.updateScore("2-s", 6);
  assert.equal(player.bonus, 0);
  player.updateScore("1-s", 3);
  assert.equal(player.calculateUpperSum(), 63);
  assert.equal(player.bonus, 50);
  assert.equal(player.totalScore, 113);
});

test("lower section scores do not count towards the bonus", () => {
  const player = new Player("Bo");
  player.updateScore("chance", 30);
  player.updateScore("yatzy", 50);
  assert.equal(player.bonus, 0);
  assert.equal(player.calculateLowerSum(), 80);
  assert.equal(player.totalScore, 80);
});

test("a category can only be used once", () => {
  const player = new Player("Bo");
  player.updateScore("chance", 20);
  assert.throws(() => player.updateScore("chance", 25), /already selected/);
  assert.equal(player.totalScore, 20);
});
