# Dedup Frontend

A React frontend for the Dedup Service's detect / review / promote / reject / delete workflow.

## Features

- 🎨 Dark theme UI (unchanged from earlier versions)
- 🔍 Run detection against a workspace, then review results from the DB — detection never promotes/rejects/deletes
- 📊 Analytics cards and charts per module (DITA / Images)
- ✅ Promote / reject duplicate groups, enforced client-side *and* server-side to exact 100% matches only
- 🔬 Side-by-side compare view, with a unified diff for DITA topics
- 🧾 Full activity/audit trail per module
- 🗑️ Final physical delete step, gated behind a confirmation dialog

## Tech Stack

- React 18+
- Vite
- TailwindCSS
- Axios
- React Router
- Recharts
- React Hot Toast
- Lucide Icons

## Installation

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run preview
```

## Configuration

Backend base URL is set in `src/api/axios.js`:

```javascript
baseURL: 'http://localhost:8093'
```

The backend must be running with CORS allowing `http://localhost:3000` (already configured in `app/main.py`).

## Project Structure

```
src/
├── api/
│   ├── axios.js              # Axios instance (baseURL, headers)
│   └── dedup.js               # One function per /api/v1/dedup/* endpoint
├── components/
│   ├── AnalyticsCards.jsx     # Generic stat-card grid over one EntityTypeAnalytics block
│   ├── AnalyticsCharts.jsx    # Bar/pie charts over the same analytics shape
│   ├── ConfirmDialog.jsx      # Reusable confirmation modal (used by the delete action)
│   ├── MatchBadge.jsx         # match_percentage + match_type pill
│   ├── StatusBadge.jsx        # Group status / activity status pill
│   ├── SnapshotTable.jsx      # Home dashboard table (fed by GET /snapshots)
│   ├── Navbar.jsx
│   └── Loader.jsx
├── pages/
│   ├── Home.jsx               # Run-detection form + snapshot dashboard
│   ├── SnapshotOverview.jsx   # Analytics + links into each module
│   ├── DuplicateGroupsPage.jsx # List groups, promote/reject (single + bulk)
│   ├── ComparePage.jsx        # Reference vs duplicate detail + diff
│   └── ActivityPage.jsx       # Audit trail + final delete
├── utils/
│   └── formatters.js
├── styles/
│   └── index.css
├── App.jsx                    # Routes
└── main.jsx                   # Entry point
```

## Workflow

```
Home (run detection)
   -> SnapshotOverview (analytics)
        -> DuplicateGroupsPage (per module: dita | images)
             -> ComparePage (per group)
                  -> Promote / Reject (only if match_percentage == 100.0)
        -> ActivityPage (audit trail, final Delete)
```

`snapshot_id` is the identifier threaded through every URL after detection —
there is no client-facing `job_id` concept anymore. Re-running detection
for an existing `snapshot_id` wipes its previous pending groups and
re-detects fresh; already-decided (promoted/rejected/deleted) history is
preserved in the audit trail regardless.

## API Endpoints

All under `/api/v1/dedup`:

- `POST /` — run detection (synchronous)
- `GET /snapshots` — list all snapshots (for the Home dashboard)
- `GET /{snapshot_id}/analytics`
- `GET /{snapshot_id}/{dita|images}/duplicate-groups`
- `GET /{snapshot_id}/{dita|images}/compare/{group_id}`
- `POST /{snapshot_id}/{dita|images}/promote` — body `{"group_ids": [...]}`
- `POST /{snapshot_id}/{dita|images}/reject` — body `{"group_ids": [...]}`
- `GET /{snapshot_id}/{dita|images}/activity`
- `DELETE /{snapshot_id}/{dita|images}/delete` — optional body `{"group_ids": [...]}`

Promote/reject/delete respond **HTTP 200** with a per-item `results` array
(`status`/`error_code`/`message`) — a group failing the 100%-match rule is
not an HTTP error, it's an item in that array. The frontend inspects
`results`, not exceptions, to report per-group outcomes.

## Known limitation

There is no image-serving endpoint on the backend, so the image compare
view shows metadata (dimensions/size/sha256/phash) side by side rather than
an actual image preview.

## License

MIT
