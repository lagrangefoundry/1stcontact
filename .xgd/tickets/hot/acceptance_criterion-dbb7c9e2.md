---
uid: acceptance_criterion-dbb7c9e2
id: AC-712
type: acceptance_criterion
title: Element effects (backdrop-filter/outline presence, blend mode, pseudo-content,
  opacity) are captured and compared
created_by: xgd
created_at: '2026-07-22T20:17:18.455698+00:00'
updated_at: '2026-07-23T11:45:15.503788+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
For a paired element, `values-diff` captures and compares element effect axes beyond shadow/filter:
- `backdrop-filter` (frosted-glass) and `outline` are compared as **presence** — present on one side only yields a delta; present-both or absent-both yields none (their raw value strings drift across engines, so value is not compared);
- `mix-blend-mode` and `::before`/`::after` injected pseudo-content are compared as **discrete values** — a differing blend mode, or pseudo-content present on one side only, yields a delta;
- element `opacity` is compared as an **exact numeric** value — a ghosted (partial-opacity) element vs a solid one yields a tonal (LOW) delta; a difference within the tolerance band (exact by default, a small band under `--tolerant`) yields none.
Each axis is guarded so both sides must carry it; a bundle captured before the axis existed produces no delta.

## Verification
Run the diff on paired elements where exactly one effect differs (backdrop-filter present vs absent, outline present vs absent, multiply vs normal blend, ::after present vs absent, opacity 0.5 vs 1.0) and assert a single delta on that axis. Assert no delta when the axes match, when the field is absent on one side, and for an opacity difference inside the tolerance band.