# Tournament Feature — Working Doc & Handoff

Single source of truth for the tournament feature (frontend + its backend half). This file lives **in the repo**, so it travels when the project moves. Read top-to-bottom to get oriented.

> Scope split: **tournament feature + its backend endpoints = ours.** Auth/JWT, the WebSocket server, the games/board feature, and other admin pages (user/comment admin) are owned by teammates.

---

## 1. How to run

- **Backend** (`/backend`): `npm run dev` (runs `node --watch` on port **8476**). Seed the DB with `npm run seed` (clears + recreates users, games, 2 tournaments).
- **Frontend** (`/frontend`): `npm run dev` → open **`http://127.0.0.1:5173`** (use `127.0.0.1`, not `localhost`, to avoid a ~2s IPv6 connect delay; Vite is pinned to `127.0.0.1`).
- **Admin login:** username **`PokerKing88`** / password **`Dice1234`** (log in by *username*, not email; seeded with `isAdmin: true`). All seed users share `Dice1234`.
- **Env** (`frontend/.env`):
  - `VITE_API_URL=` **(empty)** — `api.js` already prefixes `/api`; the Vite dev proxy forwards `/api` → `http://127.0.0.1:8476`.
  - `VITE_WS_URL=ws://localhost:8476` — the WS server shares the API's port.

---

## 2. Architecture & conventions

- **One service file: `src/services/api.js`.** Its `apiCall` sends `credentials: 'include'` (JWT cookie) and self-prefixes `/api`. Exposes `userService`, `tournamentService`, `commentService`, `gameService`, etc. (No separate `apiClient.js`/`tournamentService.js` — consolidated.)
- **Exports:** hooks = **named** exports (`export function useX`), pages/components = **default** exports. (Mismatching these throws "doesn't provide an export named…".)
- **Folder layout:** pages at `src/pages/Tournament/{TournamentList,TournamentDetail,CreateTournament}/`; components flat at `src/components/<Name>/<Name>.jsx` + `.module.css`. (Short names — no "Page" suffix, not grouped under `components/Tournament/`.)
- **Auth:** JWT in an httpOnly cookie. `useAppContext()` → `{ user, login, logout, refreshUser }`. `user.role` is `"admin" | "registered"` (both `login` and `getMe` return it). Anonymous → `user` is null.
- **Styling:** CSS Modules using theme vars (`--theme-*`, injected at runtime by `useTheme`'s `applyThemeToDocument`, with static fallbacks in `index.css`). BEM-ish `block__element` names; self-contained `@media (max-width: 768px)` per module. `index.css`/`App.css` were de-Vite-boilerplated (removed `#root{text-align:center;width:1126px}` etc.) — that boilerplate was the cause of earlier "everything centered / weird spacing".
- **Routes** (in `src/routes/AppRoutes.jsx`): `/tournament` (list), `/tournament/:tournamentid` (detail, lowercase param), and under `<AdminLayout/>`: `/admin/tournament/new` + `/admin/tournament/:tournamentid/edit` → `CreateTournament`.

---

## 3. Status

### ✅ Done
- **Browse** — `TournamentList`: two sections (upcoming `pending,in-progress` / past `finished,cancelled`); sort by date / title / `playerCount` + asc⇄desc selector; debounced (300ms) ≥3-char client-side title search. `TournamentCard` (list/preview variants), `TournamentStatusBadge`, `TournamentPreview`.
- **Detail page** — `TournamentDetail` + `useTournament(id)`; sections: rules (`TournamentRules`), players (`TournamentPlayersList`, resolves userIds→names), comments (`TournamentComments`, REST), countdown (`TournamentCountdown`/`useCountdown`), join/leave (`JoinLeaveButton`), admin panel (`AdminTournamentControls`), winner award (`AwardWinner`).
- **Admin (full lifecycle from UI)** — create + edit (shared `TournamentForm`; edit route + widened `validateTournamentUpdate`), cancel ⇄ reopen, delete, start round, advance round, award winner. `tournamentId` auto-generated server-side (model `pre("validate")` slug + random suffix).
- **Backend (ours)** — `TOURNAMENT_STATUSES` (incl. `cancelled`); `?status` comma-separated via `$in`; `?sortOrder`; `playerCount` via aggregation (`$size`); `leaveTournament` (`DELETE /tournaments/:id/participants/:userId`); auto-ID hook. **Security:** comment author from `req.userId` (not body), `.escape()` removed from comment validator (React encodes on render), `getMe` returns `role`.
- **Live comments via WebSockets (Phase 4)** — `gameSocket.js` now has a parallel `tournamentRooms` map + `join-tournament` handler + `broadcastToTournament(id, msg)` (mirrors the game-room pattern; auth-first guard reused). `createTournamentComment` controller broadcasts `{type:"new-comment", comment}` after persisting. Frontend `useTournamentSocket(id)` (token→auth→join-tournament; clears its reconnect timer on unmount) feeds `TournamentComments`, which appends live with `commentId` dedupe + optimistic local append on post (works even if the socket drops). `● Live` badge when connected.

### 🟡 Open — our side, unblocked
- **Polish:** loading skeletons, empty states, error toasts, accessibility pass (focus/ARIA/keyboard).
- **`AwardWinner` caveat:** sources finalists from the final round's game `winnerId`s — verify `gameService.getGame` response shape (`{ data: { winnerId } }`) once games record results.

### ⛔ Blocked / waiting
- **Standings + running-tournament/spectator views** (player auto-redirect to their game; non-players see ongoing games) — needs the games feature (started tournament + game pages + recorded results).
- **Trophy image upload** — waiting on a teammate's shared multer `POST /uploads` (profile page needs it too — build once). Trophy is a URL field for now.
- **Real `cors`** on the backend before any prod/demo build (dev relies on the Vite proxy).

### ⏸ Deferred / descoped
- **Homepage assembly** — mounting `<TournamentPreview/>` (+ lobby/activity) is deferred to the very end; `HomePage.jsx` is still a shell.
- **`buyIn` / `eloRange`** tournament fields (spec "Addition 3") — paused; not on the model. Revisit only if the grader wants buy-in/Elo-gated tournaments.

---

## 4. Phase 4 — live comments over WebSockets ✅ DONE

> Shipped 2026-05-26. Steps 3–4 below are implemented; kept here as the design record for the oral defense. Open follow-up: **anonymous viewers don't get live updates** (`/api/ws-token` is `requireRegistered`, so they 401 and stay on REST-loaded comments). Spec says "all users" — either accept the REST/polling fallback for anon or open anonymous read-only tournament joins (touches the game-socket owner's auth flow → coordinate).

**WS facts:** server is `backend/websocket/gameSocket.js`, attached to the Express server → port **8476**. **Game-only** today: handles `auth` then `join-game` (rooms keyed by `gameId`, `broadcastToGame`). Auth = one-time token: `GET /api/ws-token` (cookie-authed) → `{ wsToken }`; open WS → `{type:"auth",wsToken}` → `auth-success`/`auth-failed`. Then `{type:"join-game",gameId}` → `joined-game`.

Steps:
1. ✅ `VITE_WS_URL=ws://localhost:8476`.
2. ✅ `TournamentComments` over REST (load + post + refetch) — done; live is the enhancement below.
3. ✅ **Extended the WS for tournaments:** parallel `tournamentRooms` map + `join-tournament` handler + `broadcastToTournament(id, msg)` in `gameSocket.js`; `createTournamentComment` broadcasts `{type:"new-comment", comment}` after saving.
4. ✅ **`useTournamentSocket(id)`:** `ws-token` → connect → auth → `join-tournament` → on `new-comment` append (deduped by `commentId`). Clears its reconnect timer on unmount. Ready to extend for `standings-update`/`round-change`.

Fallback: polling (`usePolling` exists in `frontend reference/`) is acceptable if the WS extension stalls.

---

## 5. Data shape (verified against `backend/models/tournaments.js`)

```js
{
  tournamentId: string,            // primary id (NOT _id); auto-generated server-side
  title: string,                   // 3–100
  description: string,             // 10–500
  format: { bestof: 3|5|7, straightallowed: boolean, roundTime: 5|10|15 },
  minPlayers: number,              // ≥2
  maxPlayers: number,              // ≥minPlayers
  startDate: ISODateString,
  status: 'pending'|'in-progress'|'finished'|'cancelled',
  participants: number[],          // userIds (numeric — fetch names via userService.getUser)
  games: string[],                 // gameIds
  currentRound: number,            // 0 = not started
  rounds: [{ roundNumber, games: string[], byeUserId: number|null }],
  trophy: { title: string, imageUrl: string|null },
  createdBy: number,               // userId
  winnerId: number|null,
  createdAt, updatedAt
}
```

Note: spec vocabulary is "upcoming/ongoing/finished"; backend uses `pending`/`in-progress`/`finished` (+`cancelled`). `TournamentStatusBadge` owns the display mapping.

---

## 6. Exam-defense notes

AI-looking code triggers extra questioning; be ready to explain *your* choices:
- Why data-fetching is in hooks (`useTournament(s)`) vs. inline — state management + reuse (e.g. edit form reuses `useTournament`).
- Why one `TournamentForm` serves create AND edit (controlled inputs; differ only by `initialValues` + submit action).
- Join/leave stays in sync via `refresh()` (re-fetch) after the action — and why the effect depends on the *stable* `updateParams` callbacks, not the hook's return object (which is recreated each render → would loop).
- XSS handling: rely on React's output encoding, don't `.escape()` on input (double-encoding). Comment/tournament author comes from the JWT, never the client body.
- Why the list splits upcoming/ongoing vs past; why `playerCount` sort needs a Mongo aggregation (can't `.sort()` by array length).
- `useCountdown` ticks via one interval, cleaned up on unmount; no synchronous setState in the effect body (avoids the `set-state-in-effect` lint + extra renders).

---

## 7. Log (condensed)

- **2026-05-26** — Phase 4 shipped: live tournament comments over WebSockets. Added `tournamentRooms` + `join-tournament` + `broadcastToTournament` to `gameSocket.js` (mirrors game rooms, reuses the auth-first guard); broadcast on comment create; new `useTournamentSocket(id)` hook; `TournamentComments` now appends live with `commentId` dedupe + optimistic post + `● Live` badge. Open: anonymous viewers don't get live updates (see §4 note).
- **2026-05-24** — Consolidated this doc (was heavily layered). Current state captured in §3. Highlights this stretch: merged `main` (JWT-cookie auth + login UI); consolidated services onto `api.js` (env → empty `VITE_API_URL`); built the full detail page + admin lifecycle (create/edit/cancel/reopen/delete/start/advance/award); auto-generated `tournamentId`; security fixes (comment author from JWT, removed input `.escape()`, `getMe` returns `role`); de-boilerplated global CSS. Sockets merged but game-only → Phase 4 is the solo track.
- Earlier history (Phases 1–3 build-out, the sort/search iterations, the CORS/proxy and props-destructure fixes) is preserved in git history; no need to replay it here.
