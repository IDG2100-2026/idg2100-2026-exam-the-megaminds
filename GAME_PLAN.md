# Game + Betting Feature — Working Doc & Handoff

Single source of truth for **playing the game** (the live, multiplayer dice board) and the **points / betting** system. Sibling of `frontend/TOURNAMENT_PLAN.md`; read that one for tournament-side context, since tournaments spawn games and reuse this engine.

> Scope: the game *board*, the **server-authoritative game engine over WebSockets**, **betting** (bet/match/raise/fold + pot), and the **points** economy (weekly grant, buy-in reservation, settlement). Auth/JWT and the base WS transport already exist (teammate); this feature rides on top of them.

> ⚠️ **The central rework.** The README is explicit (lines 72–79): *rolls are generated on the **backend**; the frontend only communicates held dice; the backend estimates the winner and enforces time; only the backend knows all rolls/holds before reveal.* The current board does the **opposite** — it rolls, evaluates, and decides the winner **in the browser**, then POSTs the result. That is the single biggest gap and the reason the game "isn't functional" per spec. Everything below is organised around closing it.

---

## 1. How to run

- **Backend** (`/backend`): `npm run dev` (`node --watch`, port **8476**). `npm run seed` to reset data.
- **Frontend** (`/frontend`): `npm run dev` → `http://127.0.0.1:5173`.
- **Login:** `PokerKing88` / `Dice1234` (admin; seeded `isAdmin:true`, `emailVerified:true`). All seed users share `Dice1234`. **Games require a verified email** (`requireEmailVerified` on create/join) — anonymous users can spectate but not play.
- **Env:** `VITE_WS_URL=ws://localhost:8476` (WS shares the API port). `VITE_API_URL` empty (Vite proxy forwards `/api`).

---

## 2. What exists today (and where)

### Backend
- **Model** `backend/models/games.js`: `rules { bestof, straightallowed, roundTime, numPlayers, buyIn, minElo, maxElo }`, `players [{ userId, score }]`, `winnerId`, `status`, `tournamentId`. **No betting fields yet.**
- **Constants** `backend/configs/constants.js`: `GAME_BESTOF_OPTIONS [3,5,7]`, `GAME_ROUND_TIME_OPTIONS [10,30,90]`, `GAME_NUM_PLAYERS_OPTIONS [2,3,5]`, `GAME_BUYIN_OPTIONS [1,10,50]`, `GAME_STATUSES ["pending","in-progress","finished"]`.
- **Service** `backend/services/games.service.js`:
  - `joinGame` — gates on status `pending`, "already in", "full", and **Elo range**; flips to `in-progress` when full. **Does NOT reserve buy-in points.**
  - `recordGameResult` — *trusts client-sent scores*, picks winner by max score, calls `updateElo`, and does a crude points transfer (each loser `-buyIn`, winner `+buyIn*losers`). **This is the trust hole + wrong economy.**
- **Elo** `backend/services/elo.service.js`: ✅ multi-player **pairwise** Elo (run per pair, win vs lower-score, lose vs higher) — already matches the spec's "adapt to >2 players". Picks the per-time-control field by `roundTime` (10→Bullet, 30→Blitz, 90→Rapid). Keep this; just call it from the server engine instead of the REST result endpoint.
- **WS** `backend/websocket/gameSocket.js`: handles `auth` → `join-game` (rooms keyed by `gameId`, `broadcastToGame`) and the tournament parallel. **No game-play message handling.** `broadcastToGame(gameId, msg)` exists and is ready to use.
- **Matchmaking** `backend/services/matchmaking.service.js`: queue-based, creates a game on match. (Spec says focus shifted from queue → rooms = the game page; matchmaking can stay as a secondary path.)
- **Routes** (`api.router.js`): `GET /games`, `GET /games/:id`, `POST /games`, `POST /games/:id/join`, `PATCH /games/:id/status`, `PATCH /games/:id/result`, comments. All real-time play will move **off REST onto WS**; `PATCH /result` becomes redundant once the engine settles server-side.

### Frontend
- **Page** `pages/Game/GamePage/GamePage.jsx`: loads game + comments, opens `useWebSocket(gameid)`, renders `<GameBoard>` + comments sidebar + a (cosmetic) "Leave Game" that just navigates away.
- **Wrapper** `components/GameBoard/GameBoard.jsx`: bridges board CustomEvents → `send()` and, on `game-ended`, POSTs `recordResult`. **This is where client-authority leaks in.**
- **Web Components** `components/GameBoard/dice-poker-{board,player,die}.js`: ✅ Web Components requirement met. The board owns **all** game logic locally: `gameStart`/`turn`/`turnFinished`/`#evaluateHand`/`compareTurns`/`roundEnd`/`finishGame`. Spanish hands (Repóker→Carta Alta) live in `dice-poker-board.js` `handRules`. **Rolling is client-side** (`dice-poker-die` + `player.rollDice`).
- **Transport** `hooks/useWebSocket.js`: token → `auth` → `join-game`; exposes `{ lastMessage, connected, send }`. `send()`-ing unknown types is a no-op server-side today.

---

## 3. Status

### ✅ Done / reusable
- Web Components board UI (dice, players, hands, timer, waiting screen) — **keep the rendering, gut the decision-making**.
- Multi-player pairwise **Elo** (`elo.service.js`).
- Game variants on the model: `numPlayers [2,3,5]`, `buyIn [1,10,50]`, time controls `[10,30,90]`, Elo range gating in `joinGame`.
- WS transport + room/broadcast plumbing (`broadcastToGame`).
- `points` field on the user (default 1000, `min:0`).

### 🟥 Must build (this branch)
1. **Server-authoritative engine** — backend rolls, holds, evaluates, decides; clients render only.
2. **Betting** — bet / match / raise / fold, a pot, per-player stacks.
3. **Points economy** — reserve buy-in at join, bet from stack, settle stacks → profile at game end; weekly +100 grant.
4. **Time enforcement** server-side (spec: *total* seconds for the whole game, not per turn — see §7).
5. **State restore on reload** (spec line 71) — rejoin returns full current state.
6. **Leave-before-start** (spec line 66) — real leave that frees the buy-in if the game hasn't started; mid-game leave → auto-play (always match, no holds).

### ⛔ Cross-feature
- **Tournament winner bonus points** — now *unblocked* (points field exists). See `TOURNAMENT_PLAN.md` §3/§Blocked.
- **Sounds** on roll/hold/round/game-end (spec line 81) — gated on the header settings toggle (teammate's settings context).

---

## 4. Target architecture — server-authoritative engine

**Principle:** the server is the only place that knows the dice. The client sends *intents* (`roll`, `hold`, `bet`, `fold`…), the server validates, mutates authoritative state, and **broadcasts** redacted views (each player sees their own dice; others' dice are hidden until reveal).

```
client intent (WS)                     server                                   broadcast (WS)
─────────────────────  ───────────────────────────────────────────  ──────────────────────────────
join-game           →  reserve buy-in, add to room, maybe start    →  state (redacted per socket)
roll {held:[…]}     →  validate turn+rollsLeft, RNG unheld dice    →  your-dice (to roller only)
hold {indices}      →  record holds (server-side)                  →  (no public reveal)
bet  {amount}       →  validate stack≥amount, move to pot          →  betting-update (pot, toAct)
match / raise/ fold →  update pot/stacks/folded                    →  betting-update
(all matched/folded)→  reveal, #evaluateHand, award pot            →  round-reveal (all dice) + round-result
(bestof reached)    →  settle stacks→points, updateElo, finish     →  game-over
```

**Where the engine lives.** A new `backend/services/gameEngine.service.js` holds an **in-memory** `Map<gameId, EngineState>` (rolls/holds/pot/turn live here — never persisted mid-game, so they can't leak via the DB). `gameSocket.js` gets new `case`s that call into it and broadcast results. Persist to Mongo only at **checkpoints** (game start, round end, game over) so a server restart can rebuild enough to continue or void the game.

**Hand evaluation moves to the backend.** Port `#evaluateHand` + `handRules` out of `dice-poker-board.js` into `backend/services/handEval.service.js` (pure functions, easy to unit-test and a good oral-defense artifact). The web component keeps only *rendering* of faces the server sends.

**Anti-cheat = redaction.** `broadcastToGame` currently sends the same payload to everyone. Add a per-socket send (iterate the room Set, build a view where `socket.userId`'s dice are real and everyone else's are `null`/face-down). Reveal sends real faces to all.

---

## 5. Betting model & flow (per in-game round)

Spanish Poker Dice betting layered on the existing best-of-N rounds:

1. **Buy-in reserved at join.** On `join-game`: check `user.points ≥ rules.buyIn`; `$inc points -buyIn`; set the player's in-engine `stack = buyIn`. (If they leave before start, refund.)
2. **Roll phase.** Each player gets up to 3 rolls, choosing held dice between rolls (frontend sends `held` indices; backend RNGs the rest). Others' dice stay hidden.
3. **Betting phase.** Turn order around the table:
   - **bet** — first wager into the pot (from stack).
   - **match (call)** — put in the difference to equal the highest bet.
   - **raise** — match + increase; reopens action.
   - **fold** — forfeit; points already in the pot stay; player sits out the reveal.
   - Phase ends when every non-folded player has matched the highest bet (or all but one folded).
4. **Reveal & award.** Server reveals all (non-folded) dice, evaluates hands, highest wins the **round score +1** and **collects the pot** into their stack. **Draws split** the pot (and the round point, per current board behavior — decide: split point or replay).
5. **Game end.** When someone reaches `floor(bestof/2)+1` round wins (or rounds exhausted): **settle** every player's `stack` back to their profile `points` (`$inc`), run `updateElo(players, roundTime)`, set `winnerId`/`status:"finished"`, broadcast `game-over`.
6. **Timeout / abandon.** Spec line 79: dice are still rolled for them, they can't hold/reroll, and they **always match** the pot. Server-side timer drives this; no client cooperation needed.

**Edge cases to decide & document:** a player whose `stack` can't cover a match (all-in / side-pot — simplest: cap their contribution, they can win only up to what they matched); everyone folds to one player (they take the pot, no reveal); disconnect vs. deliberate leave.

---

## 6. Points economy

- **Weekly +100 grant** (spec line 67) — *not implemented anywhere.* Cheapest correct approach: a `pointsWeekStart` date on the user + a lazy top-up — on login / `getMe`, if `now - pointsWeekStart ≥ 7d`, `$inc points +100` (cap if you want) and reset the date. (Avoids a real cron; mirrors how `eloWeekStart` already lazily resets.) Note the model currently *defaults* points to **1000**, not 100 — reconcile the starting grant with the spec narrative and justify it in the defense.
- **Buy-in reservation** — moves from "settled at result time" (current `recordGameResult`) to "reserved at join, settled at game end" (§5). Delete/retire the points logic in `recordGameResult`.
- **Display** — points already shown on the profile page (verify) and should appear on the game page (your stack + pot).

---

## 7. Time control semantics (fix)

Spec line 68: *"instead of 3/10/30 sec per round, have 10/30/90 seconds in total, for all rounds."* The board currently treats `roundTime` as a **per-turn** countdown (`_startTimer(roundTime)` every turn). Target: a **per-player total budget** for the whole game (a chess-style clock). Server owns the clock; when a player's budget hits 0 they enter auto-play (always match, no holds) per §5.6. Decide whether the budget is per-player or shared and document it.

---

## 8. Data-shape additions (design, not yet written)

On the **game model** (persisted checkpoints only — live rolls/holds stay in memory):
```js
betting: {
  pot: Number,                 // current round pot
  highestBet: Number,          // amount to match
  stacks: [{ userId, stack }], // remaining reserved points per player
  folded: [Number],            // userIds out of the current round
  toAct: Number,               // userId whose action it is
  phase: "rolling" | "betting" | "reveal"
},
clock: [{ userId, msLeft }],   // server-authoritative time budget
currentRound: Number           // in-game round (rename from tournament "round" to avoid clash)
```
On the **user model**:
```js
pointsWeekStart: { type: Date, default: Date.now }  // for the weekly +100 lazy grant
```

---

## 9. WS message protocol (the contract)

Client → server (all require prior `auth` + `join-game`):
| type | payload | server action |
|------|---------|---------------|
| `roll` | `{ held: number[] }` | validate it's their turn & rolls remain; RNG the unheld dice; reply `your-dice` |
| `done-rolling` | — | lock their dice for the round; advance turn |
| `bet` / `raise` | `{ amount }` | validate `amount ≤ stack` (and ≥ highestBet for raise); move to pot |
| `match` | — | move `highestBet − alreadyIn` from stack to pot |
| `fold` | — | mark folded |
| `leave` | — | pre-start: free buy-in + remove; mid-game: flag auto-play |

Server → client(s):
| type | to | payload |
|------|----|---------|
| `state` | per-socket | full redacted snapshot (for join + reload restore) |
| `your-dice` | roller only | real faces + rolls left |
| `betting-update` | room | `{ pot, highestBet, stacks, toAct, folded }` |
| `round-reveal` | room | all non-folded players' real faces + each hand name |
| `round-result` | room | `{ winnerId, handName, scores }` |
| `game-over` | room | `{ winnerId, finalScores, pointsDelta }` |
| `error` | one | `{ message }` (illegal move, not your turn, insufficient stack…) |

Keep payloads small and **redacted by recipient** — that redaction *is* the bluffing mechanic and the anti-cheat guarantee.

---

## 10. Implementation order (suggested, smallest shippable steps)

> Build the engine in slices that each leave the game runnable. Do them one at a time (snippet-in-chat workflow).

1. **Lift hand eval to backend** — new `handEval.service.js` (port `#evaluateHand` + `handRules`); unit-test against known hands. *No behavior change yet.*
2. **Engine skeleton** — `gameEngine.service.js` with the in-memory `Map`, `createEngine(game)`, `getState(gameId, viewerId)` (redacted). Wire `join-game` to seed it and send `state`.
3. **Server-side rolling** — add `roll`/`done-rolling` cases; RNG on the server; `your-dice` to the roller; broadcast a generic `turn-change`. Strip rolling from the web component (it now just renders faces from `your-dice`).
4. **Reveal + scoring on server** — when all done rolling, reveal + evaluate + `round-result`; replace the board's `compareTurns`/`roundEnd` with rendering of server messages.
5. **Game-over + settlement** — settle stacks→points, `updateElo`, persist `finished`, `game-over`. Retire `PATCH /result` + the client `recordResult` call.
6. **Buy-in reservation at join** + refund on pre-start leave.
7. **Betting** — pot/stacks/folded/toAct + `bet`/`match`/`raise`/`fold` + `betting-update`; betting UI in the board.
8. **Server clock** — total-time budget + auto-play on timeout/abandon.
9. **Reload restore** — `state` on rejoin fully rehydrates the board.
10. **Weekly +100 grant** (lazy on getMe/login).
11. **Polish** — sounds (settings-gated), spectator view (read-only redaction for non-players), empty/loading/error states.

---

## 11. Exam-defense notes

- **Why server-authoritative?** Anti-cheat + bluffing: if the client knew/decided rolls, a player could see opponents' dice or fix outcomes. The server being the sole source of truth is *the* security requirement of the game (README 72–79). Be ready to explain the per-socket **redaction**.
- **Why in-memory engine, persist at checkpoints?** Live rolls/holds must never be queryable (DB leak = cheat). Persisting only at start/round-end/game-over keeps secrets out of Mongo while surviving restarts at safe boundaries.
- **Why keep the Web Component but move logic out?** Spec mandates Web Components for the board (✅). Separation of concerns: component = presentation, server = rules. Also makes hand eval unit-testable.
- **Elo for >2 players** — pairwise: you "win" pairings vs lower scores, "lose" vs higher; sum the deltas. Already implemented; know the K-factor (32) and the time-control split.
- **Points lifecycle** — reserved at join (can't bet points you don't have), live in a stack, returned to profile at game end; pot is zero-sum among players. Weekly grant keeps everyone able to play.
- **Time = total, not per-turn** — and what happens on timeout (auto-match, no holds).

---

## 12. Log

- **2026-05-28** — Doc created. Audited the game feature: board UI + Web Components + pairwise Elo are solid, but **all game logic is client-side** and the WS server has no play handlers (`game-start`/`turn-finish`/`game-ended` are dropped) — so the game isn't real-time or spec-compliant, and **betting doesn't exist**. Plan above reorganises the work around a server-authoritative engine + betting + points economy. Moving to a dedicated branch to build it.
