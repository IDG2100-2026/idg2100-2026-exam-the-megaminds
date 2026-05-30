# Betting Implementation Guide

Full implementation of the betting system across 4 files. Do them in order.

---

## File 1 — `backend/services/gameEngine.service.js`

### Change 1 — `freshPlayer`: add `currentBet` and accept `buyIn` param

Change the function signature and body:
```js
function freshPlayer(p, buyIn = 0) {
    return {
        userId: p.userId,
        username: p.username ?? "Player",
        faces: FRESH_DICE(),
        held: [false, false, false, false, false],
        rollsLeft: 3,
        score: 0,
        stack: buyIn,
        currentBet: 0,
        folded: false,
        done: false,
        connected: true
    };
}
```

### Change 2 — `ensureEngine`: init stack from buyIn, add bettingQueue

Add `const buyIn = game.rules?.buyIn ?? 0;` before the `const engine = {` block.

Change `players: game.players.map(freshPlayer),` to:
```js
players: game.players.map(p => freshPlayer(p, buyIn)),
```

Add `bettingQueue: [],` to the engine object (next to `pot: 0` and `highestBet: 0`).

### Change 3 — `startRound`: reset betting state each round

After `engine.revealed = false;` add:
```js
engine.pot = 0;
engine.highestBet = 0;
engine.bettingQueue = [];
```

Inside the `players.forEach`, after `p.folded = false;` add:
```js
p.currentBet = 0;
```

### Change 4 — `doneRolling`: go to betting phase instead of reveal

Replace the end of `doneRolling`:

Old:
```js
e.toAct = null;
e.phase = "reveal";          // step 4 fills in reveal + scoring
return { roundComplete: true };
```

New:
```js
e.toAct = null;
e.phase = "betting";
e.highestBet = 0;
e.bettingQueue = e.players.filter(p => !p.folded).map(p => p.userId);
e.toAct = e.bettingQueue[0] ?? null;
return { roundComplete: true };
```

### Change 5 — Add `advanceBetting`, `placeBet`, `foldBet`

Add these three functions before `revealRound`:

```js
function advanceBetting(engine) {
    const active = engine.players.filter(p => !p.folded);
    if (active.length <= 1) {
        if (active.length === 1) { active[0].stack += engine.pot; engine.pot = 0; }
        engine.phase = "reveal";
        engine.toAct = null;
        return { bettingComplete: true };
    }
    if (engine.bettingQueue.length === 0) {
        engine.phase = "reveal";
        engine.toAct = null;
        return { bettingComplete: true };
    }
    engine.toAct = engine.bettingQueue[0];
    return { bettingComplete: false };
}

export function placeBet(gameId, userId, amount) {
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found" };
    if (e.phase !== "betting") return { error: "Not the betting phase" };
    if (e.toAct !== userId) return { error: "Not your turn" };
    const player = e.players.find(p => p.userId === userId);
    if (!player || player.folded) return { error: "Not in this game" };
    const toCall = e.highestBet - player.currentBet;
    if (amount < toCall) return { error: `Must bet at least ${toCall}` };
    if (amount > player.stack) return { error: "Not enough points in stack" };
    const isRaise = amount > toCall;
    player.stack -= amount;
    e.pot += amount;
    player.currentBet += amount;
    if (player.currentBet > e.highestBet) e.highestBet = player.currentBet;
    e.bettingQueue.shift();
    if (isRaise) {
        const others = e.players
            .filter(p => !p.folded && p.userId !== userId)
            .map(p => p.userId)
            .filter(uid => !e.bettingQueue.includes(uid));
        e.bettingQueue.push(...others);
    }
    e.bettingQueue = e.bettingQueue.filter(uid => !e.players.find(p => p.userId === uid)?.folded);
    return advanceBetting(e);
}

export function foldBet(gameId, userId) {
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found" };
    if (e.phase !== "betting") return { error: "Not the betting phase" };
    if (e.toAct !== userId) return { error: "Not your turn" };
    const player = e.players.find(p => p.userId === userId);
    if (!player) return { error: "Not in this game" };
    player.folded = true;
    e.bettingQueue.shift();
    e.bettingQueue = e.bettingQueue.filter(uid => uid !== userId);
    return advanceBetting(e);
}
```

### Change 6 — `revealRound`: distribute pot to winner(s)

After `winnerIds.forEach(uid => { ... p.score += 1; });` add:
```js
const share = Math.floor(e.pot / winnerIds.length);
winnerIds.forEach((uid, i) => {
    const p = e.players.find(p => p.userId === uid);
    if (p) p.stack += share + (i === 0 ? e.pot % winnerIds.length : 0);
});
e.pot = 0;
```

### Change 7 — `getState`: expose `currentBet` per player

Inside `getState` players.map, after `folded: p.folded,` add:
```js
currentBet: p.currentBet,
```

### Change 8 — Update exports

```js
export default { ensureEngine, startRound, rollDice, doneRolling, revealRound, placeBet, foldBet, getEngine, removeEngine, getState };
```

---

## File 2 — `backend/websocket/gameSocket.js`

### Change 1 — Import `placeBet` and `foldBet`

Change the import line:
```js
import { ensureEngine, rollDice, doneRolling, revealRound, startRound, getEngine, removeEngine, getState, placeBet, foldBet } from "../services/gameEngine.service.js";
```

### Change 2 — `done-rolling` handler: don't auto-reveal, handle betting

The `done-rolling` handler currently calls `revealRound` when `roundComplete`. Change the block inside `if (result.roundComplete)` to:

```js
if (result.roundComplete) {
    broadcastState(socket.gameId);
    return;
}
```

The reveal will now be triggered when betting completes (see Change 3).

### Change 3 — Add `bet` and `fold` handlers

Add these after the `done-rolling` handler:

```js
if (msg.type === "bet") {
    const result = placeBet(socket.gameId, socket.userId, msg.amount ?? 0);
    if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));
    broadcastState(socket.gameId);
    if (result.bettingComplete) {
        await handleReveal(socket.gameId);
    }
    return;
}

if (msg.type === "fold") {
    const result = foldBet(socket.gameId, socket.userId);
    if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));
    broadcastState(socket.gameId);
    if (result.bettingComplete) {
        await handleReveal(socket.gameId);
    }
    return;
}
```

### Change 4 — Extract reveal logic into `handleReveal`

The reveal + game-over logic is currently inline in `done-rolling`. Extract it into a helper function and add it near the top of `initGameSocket`, before the `wss.on("connection")` call:

```js
async function handleReveal(gameId) {
    const reveal = revealRound(gameId);
    if (reveal.error) return;
    broadcastState(gameId);
    broadcastToGame(gameId, {
        type: "round-result",
        winnerIds: reveal.winnerIds,
        handNames: reveal.handNames,
        scores: reveal.scores,
        isGameOver: reveal.isGameOver
    });

    if (reveal.isGameOver) {
        const engine = getEngine(gameId);
        const players = engine
            ? engine.players.map(p => ({ userId: p.userId, score: p.score, stack: p.stack }))
            : reveal.scores;
        const roundTime = engine?.rules?.roundTime;

        recordGameResult(gameId, { players, roundTime })
            .catch(err => console.error('Settlement failed:', err));

        removeEngine(gameId);

        try {
            const finishedGame = await getGameById(gameId);
            if (finishedGame?.tournamentId) {
                const updated = await advanceTournament(finishedGame.tournamentId).catch(() => null);
                if (updated) {
                    broadcastToTournament(finishedGame.tournamentId, { type: 'round-change', currentRound: updated.currentRound });
                }
            }
        } catch { /* not all tournament games finished */ }

        setTimeout(() => broadcastToGame(gameId, {
            type: "game-over",
            winnerIds: reveal.gameWinnerIds,
            scores: reveal.scores
        }), 3000);
    } else {
        setTimeout(() => {
            const engine = getEngine(gameId);
            if (!engine) return;
            startRound(engine);
            broadcastState(gameId);
        }, 3000);
    }
}
```

Then in `done-rolling`, keep the `roundComplete` check but replace the inline reveal logic with:
```js
if (result.roundComplete) {
    broadcastState(socket.gameId);
    return;
}
```

---

## File 3 — `backend/services/games.service.js`

### Change — `recordGameResult`: return stacks instead of flat buyIn formula

Find the block that does `buyIn * players.length` for the winner and replace it.

Old:
```js
const buyIn = result?.rules?.buyIn ?? 0;
if (buyIn > 0) {
    await User.findOneAndUpdate({ userId: winner.userId }, { $inc: { points: buyIn * players.length} });
}
```

New:
```js
for (const player of players) {
    if ((player.stack ?? 0) > 0) {
        await User.findOneAndUpdate({ userId: player.userId }, { $inc: { points: player.stack } });
    }
}
```

---

## File 4 — `frontend/src/components/GameBoard/GameBoard.jsx`

### Change 1 — Add `useState` import

Add `useState` to the React import:
```js
import { useEffect, useRef, useState } from 'react';
```

### Change 2 — Add `gameState` state

After `const { play } = useSound();` add:
```js
const [gameState, setGameState] = useState(null);
const [betAmount, setBetAmount] = useState(0);
const [betError, setBetError] = useState('');
```

### Change 3 — Capture state in the lastMessage effect

In the existing `lastMessage` useEffect, inside `if (lastMessage?.type === 'state')` add:
```js
setGameState(lastMessage.state);
```

### Change 4 — Add betting action handlers

After the existing `useEffect` blocks, add:
```js
const myPlayer = gameState?.players?.find(p => p.userId === user?.userId);
const isMyBettingTurn = gameState?.phase === 'betting' && gameState?.toAct === user?.userId;
const toCall = (gameState?.highestBet ?? 0) - (myPlayer?.currentBet ?? 0);

const handleBet = () => {
    if (betAmount < toCall) { setBetError(`Must bet at least ${toCall}`); return; }
    setBetError('');
    send({ type: 'bet', amount: betAmount });
    setBetAmount(0);
};

const handleFold = () => {
    setBetError('');
    send({ type: 'fold' });
};
```

### Change 5 — Add BettingPanel to the JSX

In the return statement, after the `<dice-poker-board>` closing tag, add:
```jsx
{gameState?.phase === 'betting' && (
    <div className="betting-panel">
        <div className="betting-info">
            <span>Pot: <strong>{gameState.pot} pts</strong></span>
            <span>Highest bet: <strong>{gameState.highestBet} pts</strong></span>
            {myPlayer && <span>Your stack: <strong>{myPlayer.stack} pts</strong></span>}
            {myPlayer && <span>Your bet: <strong>{myPlayer.currentBet} pts</strong></span>}
        </div>

        {myPlayer?.folded && <p className="betting-folded">You folded this round.</p>}

        {isMyBettingTurn && !myPlayer?.folded && (
            <div className="betting-actions">
                <p className="betting-prompt">
                    {toCall === 0 ? 'Check or bet:' : `Call ${toCall} pts or raise:`}
                </p>
                <div className="betting-controls">
                    <input
                        type="number"
                        className="betting-input"
                        value={betAmount}
                        min={toCall}
                        max={myPlayer?.stack ?? 0}
                        onChange={e => setBetAmount(Number(e.target.value))}
                    />
                    <button className="betting-btn betting-btn--primary" onClick={handleBet}>
                        {toCall === 0 && betAmount === 0 ? 'Check' : betAmount === toCall ? 'Call' : 'Bet / Raise'}
                    </button>
                    <button className="betting-btn betting-btn--danger" onClick={handleFold}>
                        Fold
                    </button>
                </div>
                {betError && <p className="betting-error">{betError}</p>}
            </div>
        )}

        {!isMyBettingTurn && !myPlayer?.folded && (
            <p className="betting-waiting">
                Waiting for {gameState.players?.find(p => p.userId === gameState.toAct)?.username ?? 'opponent'}…
            </p>
        )}

        <div className="betting-players">
            {gameState.players?.map(p => (
                <span key={p.userId} className={`betting-player-tag ${p.folded ? 'folded' : ''} ${p.userId === gameState.toAct ? 'active' : ''}`}>
                    {p.username}: {p.stack} pts {p.folded ? '(folded)' : `(bet ${p.currentBet})`}
                </span>
            ))}
        </div>
    </div>
)}
```

---

## File 5 — `frontend/src/components/GameBoard/GameBoard.css`

Add at the bottom of the existing CSS file:

```css
/* Betting panel */
.betting-panel {
    margin-top: 1rem;
    padding: 1.25rem 1.5rem;
    background: var(--theme-primary);
    border: 1px solid var(--theme-accent-dark);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
}

.betting-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    font-size: 0.9rem;
    color: var(--theme-text-secondary);
}

.betting-info strong {
    color: var(--theme-accent-light);
}

.betting-prompt {
    font-size: 0.85rem;
    color: var(--theme-text-secondary);
    margin: 0;
}

.betting-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.betting-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.betting-input {
    width: 90px;
    padding: 0.45rem 0.6rem;
    background: var(--theme-background);
    border: 1px solid var(--theme-accent-dark);
    border-radius: 6px;
    color: var(--theme-text);
    font-size: 0.875rem;
}

.betting-input:focus {
    outline: none;
    border-color: var(--theme-accent);
}

.betting-btn {
    padding: 0.45rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
}

.betting-btn--primary {
    background: var(--theme-accent);
    color: #fff;
}

.betting-btn--primary:hover { opacity: 0.85; }

.betting-btn--danger {
    background: transparent;
    border: 1px solid #e53e3e;
    color: #e53e3e;
}

.betting-btn--danger:hover {
    background: rgba(229, 62, 62, 0.1);
}

.betting-error {
    font-size: 0.8rem;
    color: #e53e3e;
    margin: 0;
}

.betting-waiting {
    font-size: 0.875rem;
    color: var(--theme-text-secondary);
    font-style: italic;
    margin: 0;
}

.betting-folded {
    font-size: 0.875rem;
    color: var(--theme-text-secondary);
    font-style: italic;
    margin: 0;
}

.betting-players {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.betting-player-tag {
    font-size: 0.78rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--theme-background);
    border: 1px solid var(--theme-accent-dark);
    color: var(--theme-text-secondary);
}

.betting-player-tag.active {
    border-color: var(--theme-accent);
    color: var(--theme-accent-light);
    font-weight: 600;
}

.betting-player-tag.folded {
    opacity: 0.45;
    text-decoration: line-through;
}
```

---

## Notes

- **Buy-in reservation** at join is already implemented in `games.service.js` (`joinGame` checks points and deducts).
- **Stack settlement** at game end: `recordGameResult` now returns each player's remaining stack to their profile points.
- **Auto-play for disconnected players** (always match) is NOT yet implemented — can be added later.
- The betting phase happens after all players finish rolling and before the dice are revealed.
