# Performance fixes implemented — 29 October 2026

The approved performance work is implemented, with variable frame pacing and a wider universe layout. There is no required 60 FPS target or 20 FPS floor.

## Changes

- Simulation advances by actual elapsed time, including at 5 FPS. Visibility and resume reset the clock to avoid advancing through time spent hidden or paused. Rendering follows native refresh when inexpensive and yields proportionally to measured simulation/picking/draw CPU work when expensive. User input requests an immediate redraw.
- Orbital radii start at 2.4 times the old grade distance. Dense sibling groups occupy multiple bands sized for their occupancy; root distribution covers more area. Fit and zoom accommodate the larger world. This is a spatial hierarchy, not a physical gravity or collision simulation: occasional projected overlaps remain possible, and fitting all 5,000 people necessarily compresses their screen spacing.
- Tiny particles draw as location-colored glyphs; medium glyphs add a simple ring. Detailed artwork retains the existing location/skill/proficiency semantics at inspection scale, with selected/hovered people prioritized. Cache resolutions include depth and stable buckets with hysteresis. The 24 MiB cache admits a stable working set instead of evicting it continuously. Uncached people use glyphs while the cache is saturated; their full information remains available by selecting them. Unused entries expire after two unused draw epochs to make room when navigating.
- At most eight sprite canvases are constructed per draw, with a soft 3 ms budget checked between constructions. A single construction can exceed that time. Pending construction continues even while motion is paused.
- Simulation maintains depth order; input picking reuses it. Pointer movement is coalesced to one pick per rendered frame. Connector intersection checks no longer allocate arrays. Individual translucent connector strokes remain intentional: batching would change overlap blending and was not accepted without a visual equivalence study.
- Search text and alphabetical ordering are precomputed. Search updates coalesce to an animation frame. The directory renders accessible pages of at most 60 people, with previous/next buttons and announced page counts. Pagination replaces the proposed scrolling virtual window to retain ordinary keyboard/screen-reader navigation; every matching person is reachable.
- Both resize sources use the same handler, unchanged dimensions/DPR do nothing, and resize preserves camera scale and center intent. Sprite artwork survives resizing. Context loss suspends drawing, restoration recreates canvas resources, and repeated draw exceptions stop after three attempts with a console error.
- Redundant active-dataset clicks no longer destroy/reload the scene. A bounded 240-event engine diagnostic buffer records frame intervals/work, resizes, context/visibility/navigation/errors and supported browser long tasks, without record contents. Telemetry shows observed FPS, p95 frame interval, CPU frame work and sprite memory; these do not measure GPU completion or browser resident memory.

## Validation

`npm test`: all 16 tests pass. Coverage includes all 5,000 directory results, 5 FPS elapsed motion, stable saturated sprite allocation, construction limits, no-op resize, context recovery, depth picking, lifecycle cleanup, hierarchy geometry, wrap, and original datasets.

The existing captured 5,000-record dataset was replayed with the counting Canvas harness. Results: [performance-5000-after.json](performance-5000-after.json). At both overview sizes, all 5,000 people are visible and no sprite canvases are allocated. The original report measured approximately 2,270 per steady frame. In the 1440 × 900 focus scenario, the wider geometry leaves 47–48 visible people, construction is at most eight per draw and reaches zero by draw six, at about 23.5 MiB. This changes both layout and renderer, so focus counts are not a like-for-like renderer-only benchmark. Stub timings are not browser FPS.

Live checks used the in-app browser and the actual database API on `http://localhost:4199/`. Overview displayed 5,000 people, 4,980 connections and 20 nuclei. A 60.0 observed FPS / 17.0 ms p95 interval / 3.10 ms p95 CPU-work sample was read from telemetry in the 1280 × 720 overview session. A later focus sample reported 60.0 FPS / 16.9 ms p95 interval / 2.50 ms p95 CPU work with an 11.8 MiB sprite cache. These are short samples, not guarantees or controlled before/after browser traces. The browser viewport also changed during the session.

Observed UI checks: page 2 of 84, empty-result search and recovery, profile selection at 110% zoom, pause, recenter, project switching, detailed ring appearance. The inspected browser console contained no errors/warnings. One Playwright click reported an input timeout although a subsequent accessibility snapshot confirmed the page advance; native accessibility actions worked afterward.

No original disappearance event was reproduced. A controlled 10-minute interaction/memory soak, measured input p95, explicit narrow-viewport/reduced-motion browser checks and a full GPU/GC profile have **not** been completed. Context restoration and visibility/reduced-motion cleanup are covered by automated lifecycle tests; that does not replace a browser context-loss soak. The original blanking cause remains unproven.

The local service was started on loopback port 4199 for review. No database data or schema was changed.
