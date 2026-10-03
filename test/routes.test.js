const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

const CATEGORIES = [
  "1-s", "2-s", "3-s", "4-s", "5-s", "6-s",
  "one-pair", "two-pairs", "three-same", "four-same", "full-house",
  "small-straight", "large-straight", "chance", "yatzy",
];

async function startedGame(...names) {
  const agent = request.agent(app);
  for (const name of names) {
    await agent.post("/add-player").send({ name }).expect(200);
  }
  await agent.get("/play").expect(200);
  return agent;
}

describe("lobby", () => {
  test("each browser session gets its own game", async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);

    await alice.post("/add-player").send({ name: "Alice" }).expect(200);
    const res = await bob.post("/add-player").send({ name: "Bob" }).expect(200);

    assert.deepEqual(res.body.players.map((p) => p.name), ["Bob"]);
    const page = await alice.get("/").expect(200);
    assert.match(page.text, /Alice/);
    assert.doesNotMatch(page.text, /Bob/);
  });

  test("rejects missing, too long and duplicate names", async () => {
    const agent = request.agent(app);
    await agent.post("/add-player").send({}).expect(400);
    await agent.post("/add-player").send({ name: "   " }).expect(400);
    await agent.post("/add-player").send({ name: { a: 1 } }).expect(400);
    await agent.post("/add-player").send({ name: "x".repeat(31) }).expect(400);
    await agent.post("/add-player").send({ name: "Anna" }).expect(200);
    await agent.post("/add-player").send({ name: " Anna " }).expect(400);
  });

  test("needs two players to start", async () => {
    const agent = request.agent(app);
    await agent.post("/add-player").send({ name: "Solo" }).expect(200);
    const res = await agent.get("/play").expect(400);
    assert.match(res.body.message, /at least 2 players/);
  });

  test("can't join a game that has started", async () => {
    const agent = await startedGame("A", "B");
    await agent.post("/add-player").send({ name: "Late" }).expect(409);
  });
});

describe("game routes", () => {
  test("game actions need a game in progress", async () => {
    const agent = request.agent(app);
    await agent.get("/roll").expect(409);
    await agent.put("/hold/d0").expect(409);
    await agent.put("/updatescore").send({ category: "chance" }).expect(409);
  });

  test("three rolls per turn, then 409", async () => {
    const agent = await startedGame("A", "B");
    for (let rollsLeft = 2; rollsLeft >= 0; rollsLeft--) {
      const res = await agent.get("/roll").expect(200);
      assert.equal(res.body.rollsLeft, rollsLeft);
      assert.ok(res.body.dice.every((d) => d.value >= 1 && d.value <= 6));
    }
    const res = await agent.get("/roll").expect(409);
    assert.equal(res.body.success, false);
  });

  test("hold validates the die id", async () => {
    const agent = await startedGame("A", "B");
    await agent.put("/hold/d0").expect(409);
    await agent.get("/roll").expect(200);
    for (const bad of ["d5", "d9", "x", "d0d", "constructor"]) {
      await agent.put(`/hold/${bad}`).expect(400);
    }
    const held = await agent.put("/hold/d2").expect(200);
    assert.equal(held.body.held, true);
    const released = await agent.put("/hold/d2").expect(200);
    assert.equal(released.body.held, false);
  });

  test("held dice keep their value", async () => {
    const agent = await startedGame("A", "B");
    const first = await agent.get("/roll").expect(200);
    await agent.put("/hold/d1").expect(200);
    const second = await agent.get("/roll").expect(200);
    assert.equal(second.body.dice[1].value, first.body.dice[1].value);
  });

  test("scoring validates the category and passes the turn", async () => {
    const agent = await startedGame("A", "B");
    await agent.put("/updatescore").send({ category: "chance" }).expect(409);
    await agent.get("/roll").expect(200);
    await agent.put("/updatescore").send({}).expect(400);
    await agent.put("/updatescore").send({ category: "bonus" }).expect(400);
    await agent.put("/updatescore").send({ category: ["chance"] }).expect(400);

    const res = await agent.put("/updatescore").send({ category: "chance" }).expect(200);
    assert.equal(res.body.currentUser.name, "B");
    assert.equal(res.body.rollsLeft, 3);
    assert.equal(res.body.players[0].scores.chance > 0, true);
  });

  test("a full game ends on the leaderboard", async () => {
    const agent = await startedGame("A", "B");
    await agent.get("/end").expect(302).expect("Location", "/play");

    let last;
    for (const category of CATEGORIES) {
      for (let player = 0; player < 2; player++) {
        await agent.get("/roll").expect(200);
        last = await agent.put("/updatescore").send({ category }).expect(200);
      }
    }
    assert.equal(last.body.redirectToEnd, true);

    const end = await agent.get("/end").expect(200);
    assert.match(end.text, /Leaderboard/);
    await agent.get("/play").expect(302).expect("Location", "/end");

    const lobby = await agent.get("/").expect(200);
    assert.doesNotMatch(lobby.text, /<li class="player">/);
  });
});
