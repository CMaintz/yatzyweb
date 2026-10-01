const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const YahtzeeBrain = require("../backend/YahtzeeBrain");

const score = (values, category) =>
  YahtzeeBrain.calculateScore(
    values.map((value) => ({ value })),
    category
  );

describe("upper section", () => {
  test("counts only the matching face", () => {
    assert.equal(score([1, 1, 2, 3, 1], "1-s"), 3);
    assert.equal(score([2, 2, 2, 2, 5], "2-s"), 8);
    assert.equal(score([3, 1, 3, 6, 6], "3-s"), 6);
    assert.equal(score([4, 4, 4, 4, 4], "4-s"), 20);
    assert.equal(score([5, 1, 2, 3, 4], "5-s"), 5);
    assert.equal(score([6, 6, 6, 1, 1], "6-s"), 18);
  });

  test("scores 0 when the face is missing", () => {
    assert.equal(score([1, 2, 3, 4, 5], "6-s"), 0);
  });
});

describe("one pair", () => {
  test("takes the highest pair", () => {
    assert.equal(score([1, 1, 5, 5, 3], "one-pair"), 10);
  });

  test("uses a pair out of three or more of a kind", () => {
    assert.equal(score([4, 4, 4, 2, 1], "one-pair"), 8);
    assert.equal(score([6, 6, 6, 6, 6], "one-pair"), 12);
  });

  test("scores 0 without a pair", () => {
    assert.equal(score([1, 2, 3, 4, 6], "one-pair"), 0);
  });
});

describe("two pairs", () => {
  test("adds two different pairs", () => {
    assert.equal(score([2, 2, 6, 6, 1], "two-pairs"), 16);
  });

  test("works with a full house", () => {
    assert.equal(score([3, 3, 3, 5, 5], "two-pairs"), 16);
  });

  test("four of a kind is not two pairs", () => {
    assert.equal(score([4, 4, 4, 4, 1], "two-pairs"), 0);
  });

  test("scores 0 with a single pair", () => {
    assert.equal(score([1, 1, 2, 3, 4], "two-pairs"), 0);
  });
});

describe("three and four of a kind", () => {
  test("three of a kind", () => {
    assert.equal(score([5, 5, 5, 1, 2], "three-same"), 15);
    assert.equal(score([5, 5, 5, 5, 2], "three-same"), 15);
    assert.equal(score([5, 5, 1, 1, 2], "three-same"), 0);
  });

  test("four of a kind", () => {
    assert.equal(score([2, 2, 2, 2, 6], "four-same"), 8);
    assert.equal(score([6, 6, 6, 6, 6], "four-same"), 24);
    assert.equal(score([2, 2, 2, 6, 6], "four-same"), 0);
  });
});

describe("full house", () => {
  test("sums three of a kind and a pair", () => {
    assert.equal(score([2, 2, 2, 6, 6], "full-house"), 18);
    assert.equal(score([6, 1, 6, 1, 6], "full-house"), 20);
  });

  test("yatzy does not count as a full house", () => {
    assert.equal(score([4, 4, 4, 4, 4], "full-house"), 0);
  });

  test("scores 0 for four of a kind plus one", () => {
    assert.equal(score([3, 3, 3, 3, 5], "full-house"), 0);
  });
});

describe("straights", () => {
  test("small straight is exactly 1-5 in any order", () => {
    assert.equal(score([5, 3, 1, 4, 2], "small-straight"), 15);
    assert.equal(score([2, 3, 4, 5, 6], "small-straight"), 0);
    assert.equal(score([1, 2, 3, 4, 4], "small-straight"), 0);
  });

  test("large straight is exactly 2-6 in any order", () => {
    assert.equal(score([6, 2, 5, 3, 4], "large-straight"), 20);
    assert.equal(score([1, 2, 3, 4, 5], "large-straight"), 0);
  });
});

describe("chance and yatzy", () => {
  test("chance is the sum of the dice", () => {
    assert.equal(score([1, 3, 4, 6, 6], "chance"), 20);
  });

  test("yatzy is 50 for five of a kind", () => {
    assert.equal(score([1, 1, 1, 1, 1], "yatzy"), 50);
    assert.equal(score([1, 1, 1, 1, 2], "yatzy"), 0);
  });
});

test("does not reorder the dice it is given", () => {
  const dice = [5, 3, 1, 4, 2].map((value) => ({ value }));
  YahtzeeBrain.calculateScore(dice, "small-straight");
  assert.deepEqual(
    dice.map((d) => d.value),
    [5, 3, 1, 4, 2]
  );
});

test("unrolled dice score 0 everywhere", () => {
  for (const category of ["1-s", "one-pair", "chance", "yatzy", "full-house"]) {
    assert.equal(score([0, 0, 0, 0, 0], category), 0);
  }
});

test("unknown category throws", () => {
  assert.throws(() => score([1, 2, 3, 4, 5], "bonus"), /Unknown category/);
});
