---
uid: request-bc936f38
id: REQ-59
type: request
title: '1c capture: record gradient stop positions (text-fill gradients)'
created_by: xgd
created_at: '2026-07-13T19:23:25.591720+00:00'
updated_at: '2026-07-19T04:53:19.448289+00:00'
completed_at: '2026-07-19T04:53:19.448289+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 064ee3a576e3d3a776ce3bce2eacbdff7a65b303
    reconcile_sha: null
    main_sha: null
  version: 0.0.110
  story_points: 2
  bundled_in: bundle-ab9e0cb6
---

## Problem

`1c capture` records text-fill gradients (`background-clip: text`) as a
`gradient: { angleDeg, stops: [<bare #hex>…] }` — **the stop colours only. The
stop *positions* (percentages) are dropped.**

Concretely, gigabytealchemy.ai's wordmark source is:

```
linear-gradient(90deg, #F5E6A3 0%, #F5E6A3 60%, #FF8C42 90%, #FF6B35 100%)
```

but `capture.json` stores `stops: ["#f5e6a3","#f5e6a3","#ff8c42","#ff6b35"]` with
no offsets. The comment at `packages/framework/src/modules/text-style.ts:99`
states this as the current contract ("The report's TextGradient.stops are bare
`#rrggbb` strings").

## Impact — a values-diff blind spot

Because positions aren't captured, `values-diff` compares only stop **colours +
angle**. Two gradients with identical colours but different stop offsets (e.g. the
cream holding to 60% vs spread evenly so orange starts at ~33%) diff as **clean**.
This is exactly the "wordmark goes orange too fast" delta found during the
gigabytealchemy re-import ([[REQ-58]]): the reproduction rendered visibly wrong
(positionless stops → evenly distributed) while the gate reported the gradient
matched. It could only be caught by eye + reading `raw.html`.

The framework **render** side already supports positioned stops
(`GradientStop { color, position? }`, `textRunGradientSchema`) — so once the
capture records them, a reproduction transcribes them verbatim and the gate can
flag position drift.

## Scope

1. **Capture (`extract.ts`)** — when resolving a text-fill gradient, record each
   stop's position (%) alongside its colour, e.g. `stops: [{ color, position }]`
   (or a parallel `positions: number[]`), parsed from the computed
   `background-image` `linear-gradient(...)`.
2. **Fidelity report / `ValueElement`** — carry the positions through the
   projection so `values-diff` can compare them.
3. **values-diff** — add a `gradientStops` (or extend the `gradient`) comparison
   that diffs position offsets within a tolerance, surfaced as a delta row.
4. **UATs** — `test_UAT_FC_<this-id>_*`: an oklch/hex multi-stop text-fill
   gradient captures its positions; values-diff flags a position-only mismatch
   that today passes.

## Attribution

Tooling gap (capture + values-diff), not a reproduction-config issue. Surfaced by
[[REQ-58]] (gigabytealchemy re-import). Companion runbook note belongs in
[[DOC-19]] once landed (gradient stop positions are now a captured axis).


---

## Implementation (free-coded — commit 064ee3a)

**Design decision — object stops, not a parallel array.** `TextGradient.stops`
changed from `string[]` to `GradientStop[]` (`{ color: string; position: number
| null }`), mirroring the framework's render-side `GradientStop` so a
reproduction pastes `{ color, position }` straight into a `TextRunGradient`
stop. Chosen over a parallel `positions: number[]` (which the ticket offered as
an alternative) to keep a single source of truth — two aligned arrays are a
desync smell. Positionless stops record `position: null`.

### What changed

1. **Capture parse** (`values-diff.ts::normalizeGradient`) — the stop regex now
   captures an optional trailing offset (`… 60%`) per colour; a stop with no
   explicit offset records `position: null`. Works off the stored raw
   `gradientCss`, so re-diffing older bundles reparses positions with no
   recapture needed (positionless CSS → all-null, unchanged behaviour).
2. **Type** (`types.ts`) — new `GradientStop`; `TextGradient.stops:
   GradientStop[]`. Positions flow through `ValueElement.gradient` unchanged, so
   the fidelity report / manifest carry them automatically.
3. **values-diff** (`gradientsMatch` + new `stopsMatch`) — compares stop
   positions within a tolerance. New option `gradientPositionTolerancePct`
   (default **2**). A position is compared only when BOTH stops captured one; a
   positionless stop falls back to colour-only, so it never fabricates a delta.
   `gradientLabel` renders `#hex 60%` so the delta row shows the offsets.

### Test plan (all UATs in `tests/req59-gradient-stop-positions.test.ts`)

- `normalize_captures_stop_positions` — the gigabytealchemy wordmark CSS
  (`#f5e6a3 0%, #f5e6a3 60%, #ff8c42 90%, #ff6b35 100%`) parses to positioned stops.
- `positionless_stops_record_null` — offset-free gradient records `position: null`.
- `position_only_mismatch_flags` — identical colours + angle, different offsets
  (cream to 60% vs evenly spread) → a `gradient` delta that previously passed clean.
- `matching_positions_do_not_flag` / `positionless_stops_do_not_false_flag` —
  no false positives.
- `capture_records_positions_from_dom` — real Chromium capture of a positioned
  text-fill gradient fixture reads the offsets out of the computed
  `background-image`.

Existing REQ-31 / REQ-53 capture-side gradient fixtures updated to the new
object-stop shape (the `TextGradient` contract they assert changed under REQ-59).