# Orbit — People in perspective

A local TypeScript + Canvas 2D rebuild of [subzw0rld/datavisualization](https://github.com/subzw0rld/datavisualization/tree/494026b1afd3a4154ec8f46ce6518a172a4f2e64). Both original datasets and their ring meanings are retained. The original repository is untouched; the analysis is in `reports/particle-system-analysis.md`.

## Run

Requires Node.js 22+ and npm.

```sh
npm install
npm start
```

Configure `.env` with `DATABASE_URL`, `HOST`, and `PORT`. The supplied configuration uses port 3001 and binds to all network interfaces; use `HOST=127.0.0.1` to restrict access to this computer. Open **http://127.0.0.1:3001**. The server connects to PostgreSQL and exposes the datasets through `/api/datasets/team` and `/api/datasets/project`. The API reads fresh data when a view is loaded; it does not push live updates. The server has no authentication, so only expose it on a trusted network. Location IDs without matching lookup rows are labeled as unknown.

After editing TypeScript, run `npm run build` and refresh. CSS/HTML edits only need a refresh. The server does not perform live reload.

```sh
npm run check
npm test
```

## Explore

- Switch between **Team view** (64 people) and **Project view** (6 people).
- Click a node or find someone in the directory. Selection pauses motion and shows actual skills, location, supervisor, and direct reports.
- Search by name, role, grade, or skill; combine with a location filter. Nonmatching nodes are dimmed to retain graph context.
- Drag to pan; scroll or use the buttons to zoom. **Fit view** restores the complete overview. Directory selections center and enlarge that person.
- Toggle orbit paths, change speed, pause, or resume. Reduced-motion preference starts the scene paused; hidden tabs stop scheduling animation frames.
- Use **Reading the map** for all skill, proficiency, and location colors. Node radius retains the original grade encoding.
- Keyboard: use the directory buttons; on the canvas use Space for motion, arrows for pan, +/− for zoom, and 0 to fit. Escape closes the selected profile.

## Architecture

| File | Responsibility |
|---|---|
| `src/model.ts` | Validates and copies input; resolves references; builds deterministic parent-first traversal. |
| `src/simulation.ts` | Seeded orbital layout, reserved group bounds, elapsed-time updates, camera and picking geometry. |
| `src/renderer.ts` | Cached avatar/ring artwork, a 24 MiB sprite budget, viewport culling, edges and labels. |
| `src/controller.ts` | Canvas lifecycle, animation scheduling, visibility, resize, pan/zoom and pointer input. |
| `src/app.ts` | Dataset loading, accessible directory, filtering, profile and legend UI. |
| `server.mjs` | Serves the app and database-backed dataset API. |
| `database.mjs` | Reads and maps PostgreSQL records in a consistent snapshot. |

Root groups are packed deterministically rather than randomly scattered. Team roots drift gently within reserved bounds; project roots stay stationary. Orbital speed is 0.18 rad/s at the default setting (slower for deeper levels), independently of refresh rate. Large elapsed gaps are clamped to 50 ms; time does not catch up after tab suspension. The pulse is a short outer halo rather than an expansion of all ring artwork. There is no collision simulation, so nodes within nested groups can still overlap; use pause, zoom, and the directory to inspect them.

Avatars are decoded once per unique URL and clipped/scaled explicitly. Missing images retain a drawn silhouette. Sprite keys share identical visual appearances; display scale is capped at DPR 2 and caches are rebuilt for changed geometry/resolution. The renderer skips offscreen artwork while simulation still updates its ancestors. Connectors crossing the viewport are retained even when their endpoints are outside it. Labels avoid overlapping other labels.

The raw JSON records are copied before normalization. Declared headcounts remain separate from children actually present. The four original records with a declared report missing from this subset show that distinction in their profiles. Static example billing charts were replaced with real per-person skill and relationship details. Unused email/client fields were omitted during import.

## Verification and limits

`npm test` checks both datasets, immutability/reinitialization, reversed input order, current-frame nested geometry, motion across 30/60/120/144 updates per second, malformed graphs, empty and single-node cases, view bounds, transformed picking, offscreen connectors, two independent engine instances, pause/resume, hidden tabs, reduced motion, and teardown. The lifecycle test uses DOM/Canvas stubs; browser checks complement it.

`/assets/qa/mobile.html` embeds the app in a 390 CSS-pixel viewport for a reproducible narrow-layout smoke check. This does not substitute for testing on a physical mobile device.

**Render details** shows p95 CPU draw-submission time over the last 120 draws and estimated raw cached pixel memory. It excludes full GPU/compositor work and is not an FPS benchmark or a before/after speedup claim. This first implementation is verified with the supplied 6/64-person datasets; stress benchmarks and a full browser/device matrix from the report remain future validation work.

Data and avatar provenance: original repository revision `494026b1afd3a4154ec8f46ce6518a172a4f2e64`. The optional `scripts/import-legacy-data.mjs` recreates the JSON and copies the two images from a trusted checkout; it executes those legacy data scripts in a VM and should only be used with the reviewed source.

### Spatial motion

People move in a projected three-dimensional simulation: smaller particles move faster, and reporting relationships remain connected as groups travel. Depth affects apparent size and draw order. The animation is illustrative; the bundled datasets are not a live data feed. Motion can be paused or adjusted with the existing controls and starts paused when reduced motion is requested.
