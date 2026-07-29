---
uid: comment-532fd455
id: COMMENT-150
type: comment
title: Comment on request REQ-59
created_by: xgd
created_at: '2026-07-15T04:18:28.408272+00:00'
updated_at: '2026-07-15T04:27:46.407522+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bc936f38
  kind: chat_transcript
---

<!-- xgd-turn id="713036f4-c211-459f-82e7-db6bcfc39bad-user" -->

<!-- xgd-chat role="user" ts="2026-07-15T04:18:24.978131+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="713036f4-c211-459f-82e7-db6bcfc39bad-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-15T04:27:46.375646+00:00" -->
#### Claude
I'll start by reviewing the ticket and the relevant code to understand the current state.

Now let me find the capture extraction code and the values-diff / fidelity report code.

Let me read the key sections in detail.

Let me check all consumers of `TextGradient.stops` and the gradient diff comparison block.

The blast radius is small and contained in the capture tools. Let me look at the existing tests and how `normalizeGradient` is tested, plus how runs flow to the diff.

Tests are at repo root `./tests/`. Let me examine the closest existing test and the test runner.

Now let me look at the options interface and where `angleTol` is derived, and the `colorToHex`/`SIDE_ANGLES` helpers.

I have a complete picture. Let me make the changes. First, `types.ts` — restructure `TextGradient.stops` to carry positions.

Now `normalizeGradient` — parse each stop's colour + optional position. First check imports of `GradientStop` in values-diff.

Now update `normalizeGradient`:

Now `gradientLabel` and `gradientsMatch`:

Now add the tolerance option and wire the call site. First the options interface:

Now let me check the `index.ts` exports so the new `GradientStop` type is available and confirm nothing else references the old `stops` shape.

`export * from './types'` covers the new `GradientStop`. Now let me typecheck and find any remaining `stops: [` string-literal usages in tests.

The framework-side `TextRunGradient` tests (req32/req50/req36/req24/req28/req20) use a different type and are unaffected. Only the capture-side `TextGradient` tests (req31, req53) need updating since that type changed. Let me view them.

Let me check the served fixture's gradient CSS to know what positions the real-capture assertion (line 398) will now produce.

The fixture gradient has no positions, so real capture yields `position: null`. I'll go with the object-stop model (aligns with the framework's `GradientStop` and is the single-source-of-truth shape). Updating the REQ-31/REQ-53 capture-side fixtures is the direct consequence of the contract change. Let me update them.

I'll replace the identical positionless literal everywhere in req31 with the object shape.

Now req53:

Let me check the req20 `stops:` at line 321 (whether capture-side or framework-side):

The req20 case is framework-side (`resolveTextStyle`), unaffected. Now let me look at the test helpers and the real-capture setup in req31 so I can mirror them for REQ-59 UATs.

Let me check the helper signatures (`hasDelta`, `hasProp`, `diffManifests`, `serveDir`, `flattenCapture`) I'll use.

I'll write a self-contained REQ-59 test file plus a real-capture fixture. Let me read the existing fixture to mirror its structure.

Now the fixture with a positioned multi-stop text-fill gradient:

Now let me find `serveDir` and `chromiumAvailable` usage to mirror the capture setup.

Now I'll write the REQ-59 UAT test file:

Now let me run the affected tests. First verify `node_modules` is present (no install), then run the gradient tests.

All 34 pass. Let me confirm the REQ-59 browser capture test actually executed (not skipped), and run the broader capture/values-diff suite to check for regressions.

All 6 REQ-59 UATs pass. Now let me run the broader gradient/capture-touching suites and a full workspace typecheck to catch regressions.

Typecheck clean. Final safety grep for any other `.stops` consumers in the capture tools that might assume strings:

All consumers updated and consistent. Now the free-coding commit sequence — bump version first.

Version bumped in `package.json`. Now commit all changes with `[FREE-CODED]`:

Now move the ticket to `free_coded` via the gate command, then record story points:

Now update the ticket body to reflect the final implementation, preserving the original problem/scope. Let me append an implementation section.

Let me verify the final ticket state.

Done. REQ-59 is free-coded and parked at `free_coded` with a clean tree.

## What I did

**Problem:** `1c capture` recorded text-fill gradient stop *colours + angle* but dropped stop *positions*, so `values-diff` couldn't see the gigabytealchemy wordmark "orange too soon" delta (cream held to 60% vs spread evenly) — it diffed clean while rendering visibly wrong.

**Change (commit `064ee3a`, v0.0.110):**
- `TextGradient.stops` is now `GradientStop[]` (`{ color, position: number|null }`) — mirroring the framework's render-side `GradientStop` so a reproduction transcribes `{ color, position }` straight into a `TextRunGradient`. I chose object stops over the parallel `positions[]` array the ticket also offered, to keep a single source of truth.
- `normalizeGradient` parses each stop's optional `… 60%` offset from the computed `background-image` (works off stored `gradientCss`, so old bundles reparse with no recapture).
- `gradientsMatch`/new `stopsMatch` compare offsets within a new `gradientPositionTolerancePct` (default 2). A position is only compared when **both** stops captured one — positionless stops fall back to colour-only and never fabricate a delta. `gradientLabel` now renders `#hex 60%`.

**Tests** — 6 new UATs in `tests/req59-gradient-stop-positions.test.ts` (incl. a real-Chromium capture UAT against a new positioned-gradient fixture) proving positions are parsed, a position-only mismatch flags, and positionless/matching stops don't false-flag. Updated the REQ-31/REQ-53 capture-side gradient fixtures to the new stop shape (their asserted `TextGradient` contract changed here). All targeted suites pass (34 + 160) and `tools/generate` typechecks clean.

**Ticket:** body updated with the implementation + design rationale; `status=free_coded`, `commits=[064ee3a]`, `story_points=2`.

Promotion to `ready_to_reconcile` is your call when you're ready.

<!-- xgd-chat-end -->