# Performance investigation: port 4199

Date: 29 October 2026. Status: analysis preserved below; implementation subsequently authorized and applied. See [implementation and validation notes](performance-fixes-implementation.md).

## Conclusion

The primary demonstrated defect is **sprite cache thrashing in the Canvas 2D renderer**. The 5,000-record dataset has 2,409 distinct visual signatures. Even at the renderer's lowest sprite resolution, these require approximately **43.1 MiB**, exceeding the **24 MiB** cache. Drawing one frame evicts artwork needed by subsequent frames, so thousands of canvases, gradients, paths, and shadows are rebuilt continuously.

This is a concrete rendering scalability defect, not evidence that PostgreSQL needs tuning. The reported multi-second disappearance remains **unconfirmed**: resource pressure, canvas resets, or context loss are plausible, but no browser trace captured the event. A cache eviction alone does not clear the displayed canvas, and a slow draw does not by itself prove a blank frame.

## What was inspected

- The live page at `http://localhost:4199/` displayed 5,000 people, 4,980 connections, 20 nuclei, active motion, and a 6% zoom readout.
- The listening process was Node PID 29284; its working directory was this project.
- A read-only GET to `/api/datasets/team` returned HTTP 200, 1,027,759 bytes, in **276 ms**. This is one total-response sample, not an isolated SQL benchmark.
- Inspected `src/app.ts`, `src/controller.ts`, `src/renderer.ts`, `src/simulation.ts`, `src/model.ts`, `database.mjs`, `server.mjs`, the existing build, and test coverage.
- Replayed the captured API data through the existing `dist` model, simulation, and renderer using counting Canvas stubs. No application source, build output, database records, or server configuration was changed.

Live browser inspection timed out, and port 4199 subsequently stopped listening. The cause of that process exit is unknown. I did not stop or restart it. Consequently, served-JavaScript byte parity, live FPS, garbage collection, GPU behavior, and the disappearance event were not verified. The local build contains the same cache and render mechanisms identified in the TypeScript source. Browser timeouts alone are not proof of application main-thread saturation.

## Measurements

Replay uses DPR 2, 1/60-second simulation steps, all connections enabled, orbit paths disabled, and no selection or filter. Overview camera insets approximate the desktop layout. Focus is centered on the first root at scale 1.1. These are reproducible scenarios, not a reconstruction of the user's exact viewport or interactions.

| Scenario | Visible particles | New sprite canvases per steady frame | Requested raw pixel storage per frame |
|---|---:|---:|---:|
| 1440 × 900 overview, scale 0.083 | 5,000 | 2,269–2,271 | 40.8 MiB |
| 1920 × 1080 overview, scale 0.116 | 5,000 | 2,269–2,271 | 40.8 MiB |
| 1440 × 900 focus, scale 1.1 | 329–330 | 293–294 | 126.4–126.9 MiB |

At overview, a representative warm frame submits approximately **30,978 arcs, 7,249 strokes, and 5,001 image draws**, including sprite creation. At a hypothetical sustained 60 FPS, 40.8 MiB/frame implies about **2.4 GiB/second** of newly requested raw pixel storage. This is an extrapolation, not measured resident memory, GPU allocation, or achieved FPS. Evicted canvas resources can outlive cache entries until the browser reclaims them.

The diagnostic does not rasterize pixels, simulate DOM layout, or measure browser garbage collection/compositing. Its CPU timings must not be interpreted as browser frame times. Avatar decoding was held pending to isolate stable-state cache behavior; this dataset has one avatar filename.

## Findings and causes

### 1. Detailed sprites exceed the cache working set — confirmed, highest priority

`src/renderer.ts:9`, `:20–56`, `:117–124`.

The minimum resolution is 0.5 regardless of how tiny a particle appears on screen. A miss builds the full avatar, skill and proficiency rings, gradient, and shadow before LRU eviction. The 2,409 unique sprites require 43.1 MiB at resolution 0.5, 172.4 MiB at resolution 1, and 1,077.6 MiB at resolution 2.5. Only a subset is visible at focus, but that subset still thrashes the cache, as the replay demonstrates.

**Fix:** use screen-size-based levels of detail. Tiny overview particles should use inexpensive shared glyphs; medium particles should use simplified artwork; large, hovered, or selected particles should retain detailed rings. Size cached artwork for actual display dimensions, account for depth scale, use stable resolution buckets with hysteresis, and retain a bounded detailed-artwork working set. Queue cache misses with a small per-frame construction budget and draw an available lower-detail fallback while waiting. Do not solve this solely by increasing the cache limit.

### 2. Repeated sorting and individual connector submissions — confirmed secondary work

`src/renderer.ts:108–118`; `src/simulation.ts` function `pick`; `src/controller.ts:29–37`.

Each render copies and depth-sorts all 5,000 indices. Each hover pointer event independently copies and sorts them again. Each visible relationship has its own path/stroke; intersection checks allocate temporary arrays. This competes with animation and input processing even after fixing sprite churn.

**Fix:** reuse the rendered depth order for picking, process the latest pointer position at most once per animation frame, reuse buffers, and batch compatible connector paths by style/opacity. Preserve relationship visibility, selection highlighting, and topmost picking. Compare batched translucent-line appearance before accepting it; overlap blending can change. Introduce a spatial index only if profiling still shows picking is material.

### 3. Directory rebuilding blocks interaction — confirmed structural issue

`src/app.ts:38–58` and the search input handler.

Every search input maps, filters, sorts, and recreates all matching rows and listeners. With no filter this creates 5,000 buttons and approximately 30,000 row elements. The accessibility output's 500-item display is a snapshot limit, not application virtualization. This explains load/search stalls, but the directory is not rebuilt every animation frame and cannot explain all idle stuttering by itself.

**Fix:** precompute normalized search text and name ordering, coalesce search work, and render a bounded visible window with overscan while retaining keyboard and screen-reader access to every result.

### 4. Canvas resets and lifecycle gaps can exacerbate blanking — mechanism confirmed; symptom attribution unproven

`src/controller.ts:19–22`, `:85–100`; `src/renderer.ts:73–79`; `src/app.ts` function `loadDataset`.

Both window resize and ResizeObserver paths call `resize`. It unconditionally assigns canvas dimensions, clears the sprite cache, and rebuilds the starfield. Dimension assignment clears the drawing buffer even if dimensions are unchanged, per the [HTML Canvas specification](https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions). Repeated resets can force expensive cold-cache draws. There are no Canvas 2D `contextlost`/`contextrestored` handlers. A thrown draw exception also exits before the next animation frame is scheduled; that would ordinarily stop animation rather than explain an automatic recovery.

**Fix:** consolidate resize handling, skip unchanged width/height/DPR, rebuild only affected resources, and preserve camera intent rather than fitting on every size observation. Add context loss/restoration handling and bounded error reporting/recovery. Capture reset, context, visibility, and navigation events so the actual disappearance can be attributed.

There is no timer, polling loop, WebSocket update, or server live-reload mechanism here. Dataset reloads occur on initial load, view-button clicks, and persisted-page restoration. Clicking the already active view does destroy/recreate the engine and refetch the data; guard that unnecessary path. A fixed camera can lose a moving group at close zoom. However, an overview geometry probe retained all 5,000 particles at every 10-second sample over 30 minutes of simulated time, so whole-scene blanking from overview culling was not reproduced. This coarse sampling does not exclude every transient or other camera position.

## Proposed course of action — requires approval

1. **Establish a browser baseline and identify blanking.** With the service available, record frame intervals, simulation/draw times, long tasks, cache hits/misses/evictions, sprite creation/pixel estimates, canvas resize counts, context events, uncaught errors, visibility changes, and dataset requests. Observe overview, focus, pan/zoom, search, and a disappearance if reproducible. Use a bounded diagnostic buffer and avoid recording personal record contents. Existing telemetry measures only draw submission and omits simulation, layout, GC, and compositing.
2. **Fix the primary renderer defect.** Add display-size detail levels, stable cache buckets, bounded sprite creation, and fallbacks. Keep detailed information available at inspection scale. Measure this change independently before introducing broader architectural changes.
3. **Remove secondary frame/input work.** Reuse depth order, coalesce picking, reduce temporary allocations, and batch compatible connectors subject to visual checks.
4. **Fix directory and lifecycle costs.** Window directory rendering, cache search metadata, deduplicate resize work, guard redundant view loads, and handle canvas context restoration. Use the baseline trace to choose any additional blanking-specific fix.
5. **Validate against the baseline.** Run core/lifecycle tests and add meaningful regression cases for steady-state cache reuse, creation limits, resize no-ops, context restoration, picking order, and access to all directory results. Perform real browser checks with the 5,000-record dataset. Keep raw captures local and report aggregate measurements.

This plan initially retains Canvas 2D and the current simulation. A WebGL rewrite, worker migration, database changes, or removing records is not justified by the current evidence. Consider those only if the measured result still misses the agreed performance budget.

## Proposed acceptance criteria

- Updated by user approval: frame pacing should adapt to particle count and system efficiency, including 20 FPS or lower; no fixed 60 FPS target. Preserve elapsed-time motion and report actual results.
- After warm-up, unchanged view/detail buckets reuse sprites without a continuing allocation/eviction loop; any new construction obeys the per-frame budget. Cache stays within its defined budget, with memory settling during a 10-minute interaction soak.
- No unexplained blank frames, engine reloads, or context-loss failures during that soak, including repeated zoom, resize, and visibility changes. A context restoration test redraws successfully.
- Input response p95 below 100 ms for search, selection, pan, and zoom; all 5,000 people remain accessible. Preserve ring meanings, relationship highlighting, and depth-aware picking.
- Verify team/project switching, pause/resume, orbit paths, reduced motion, teardown, and narrow layouts. Record any hardware/browser limitations.

## Artifacts and reproduction

`reports/audit-5000-performance.mjs` is a diagnostic script only. Run it with a locally captured dataset path:

```sh
node reports/audit-5000-performance.mjs /tmp/orbit-4199-team.json
```

Aggregate results are in `reports/performance-5000-evidence.json`. The temporary input contains the API response and was not copied into this report or a new repository fixture. Existing historical audit results concern a different legacy implementation and were not used as current performance evidence.

**Subsequent approval:** the user authorized implementation with adaptive frame pacing and greater particle separation. Changes and remaining validation limits are recorded in [implementation and validation notes](performance-fixes-implementation.md).
