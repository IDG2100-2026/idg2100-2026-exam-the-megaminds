# Admin Dashboard — Total-based Pagination

Goal: the admin list tabs already paginate (each page is a `limit`/`skip` query — they do **not** load everything). This change adds a **`total` count** so the pager is accurate (no empty "Next" page) and can show "Page X of Y".

This matches the pattern the **Error Logs** endpoint already uses: response shape `{ success, data, total }`, and `hasMore = page * LIMIT < total`.

**Pattern everywhere:** `Promise.all([ <paged find>, countDocuments(sameQuery) ])` — the count reuses the same filter so search results paginate correctly, and `Promise.all` keeps it to one round-trip.

Each service has exactly one backend caller, so changing the return shape to `{ data, total }` is safe.

---

## Users (admin-only — simplest)

- [ ] **Backend — `backend/services/users.service.js` `getAllUsers`** — replace the `return User.find(...)` tail with:

```js
    const [data, total] = await Promise.all([
        User.find(query).sort({ [sortField]: -1 }).limit(Number(limit)).skip(Number(skip)).select("-pwd"),
        User.countDocuments(query)
    ]);
    return { data, total };
```

- [ ] **Backend — `backend/controllers/users.js` `getAllUsers`:**

```js
export async function getAllUsers(req, res) {
    const { data, total } = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, data, total });
}
```

- [ ] **Frontend — `frontend/src/services/api.js` `getAllUsers`** — return total too (last line of the method):

```js
        return apiCall('GET', `/api/users?${params}`).then(res => ({ data: res.data, total: res.total }));
```

- [ ] **Frontend — `UsersTab` in `AdminDashBoard.jsx`:**
  - Swap `const [hasMore, setHasMore] = useState(false);` → `const [total, setTotal] = useState(0);`
  - Add near the top: `const hasMore = page * LIMIT < total;`
  - Update the fetch `.then`:

```js
      .then(({ data, total }) => {
        setUsers(Array.isArray(data) ? data : []);
        setTotal(total ?? 0);
      })
```

---

## Comments (admin-only)

- [ ] **Backend — `backend/services/comments.service.js` `getAllComments`** — replace the `return Comment.find(...)` tail with:

```js
    const [data, total] = await Promise.all([
        Comment.find(query).sort({ [sort]: order === "asc" ? 1 : -1 }).limit(Number(limit)).skip(Number(skip)),
        Comment.countDocuments(query)
    ]);
    return { data, total };
```

- [ ] **Backend — `backend/controllers/comments.js` `getAllComments`:**

```js
export async function getAllComments(req, res) {
    const { data, total } = await commentService.getAllComments(req.query);
    res.status(200).json({ success: true, data, total });
}
```

- [ ] **Frontend — `api.js`:** no change — `getAllComments` already returns the full response.

- [ ] **Frontend — `CommentsTab` in `AdminDashBoard.jsx`:**
  - Swap `const [hasMore, setHasMore] = useState(false);` → `const [total, setTotal] = useState(0);`
  - Add: `const hasMore = page * LIMIT < total;`
  - Update the fetch `.then`:

```js
      .then((res) => {
        setComments(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total ?? 0);
      })
```

---

## Games (shared with Lobby + Home — handle carefully)

`gameService.getAllGames` is also used by the public Lobby and Home pages. Those call `.then(res => res.data)` and get the array. The backend will still put the array in `data` (with `total` as a sibling), so **Lobby/Home keep working untouched**. The admin tab uses a **separate** method to also read `total`.

- [ ] **Backend — `backend/services/games.service.js` `getAllGames`:**

```js
export async function getAllGames({ sort = "createdAt", limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;
    const [games, total] = await Promise.all([
        Game.find().sort({ [sort]: -1 }).limit(Number(limit)).skip(Number(skip)),
        Game.countDocuments()
    ]);
    return { data: await attachUsernames(games), total };
}
```

- [ ] **Backend — `backend/controllers/game.js` `getAllGames`:**

```js
export async function getAllGames(req, res) {
    const { data, total } = await gameService.getAllGames(req.query);
    res.status(200).json({ success: true, data, total });
}
```

- [ ] **Frontend — `api.js`:** leave `getAllGames` as-is (Lobby/Home depend on it). Add a dedicated admin method:

```js
    getAllGamesPaged: (page = 1, limit = 20) =>
        apiCall('GET', `/api/games?page=${page}&limit=${limit}`),
```

- [ ] **Frontend — `GamesTab` in `AdminDashBoard.jsx`:**
  - Switch the call to `gameService.getAllGamesPaged(page, LIMIT)`
  - Swap `const [hasMore, setHasMore] = useState(false);` → `const [total, setTotal] = useState(0);`
  - Add: `const hasMore = page * LIMIT < total;`
  - Update the fetch `.then`:

```js
      .then((res) => {
        setGames(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total ?? 0);
      })
```

---

## Defense notes (for the oral exam)

- The count reuses the **same `query`/filter**, so the total reflects search results, not the whole collection.
- `Promise.all` runs the page fetch and the count **concurrently** (one round-trip, not two sequential awaits).
- `getAllGames` was left **untouched** for the public Lobby/Home pages; the admin tab uses the dedicated `getAllGamesPaged`, so the shared endpoint's response shape didn't change for existing consumers.
- `hasMore = page * LIMIT < total` is exact, unlike the old `list.length === LIMIT` heuristic which shows an empty page when the total is an exact multiple of the page size.

## After implementing
- Restart the backend.
- Test each tab: page through to the last page (Next should disable at the end, no empty page), and confirm search + pagination work together.

> Note: this file is just personal notes — delete it before your final submission so it isn't mistaken for project content.
