---
uid: acceptance_criterion-7c503447
id: AC-711
type: acceptance_criterion
title: Typography treatments (font-style, decoration, transform, small-caps) and list
  marker are captured and compared per text run
created_by: xgd
created_at: '2026-07-22T20:17:07.039778+00:00'
updated_at: '2026-07-23T11:45:13.837670+00:00'
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
For a paired text run, `values-diff` captures and compares the typography treatment axes as discrete values, null-normalised and case-folded:
- `font-style` — an italic/oblique run vs a roman one yields a treatment delta; italic↔italic yields none;
- `text-decoration-line` — an underline (or line-through/overline) present on one side only yields a delta;
- `text-transform` — a CSS `uppercase`/`lowercase`/`capitalize` vs a differing (or absent) transform yields a delta;
- `font-variant` — a small-caps run vs a normal one yields a delta;
- `list-style-type` marker — a disc/decimal/… marker vs a differing (or `none`) marker yields a delta.
Each axis is guarded so both sides must carry it — a bundle captured before the axis existed (field absent on either side) produces no delta. The four typography axes report at MEDIUM severity under a treatment kind; the list marker reports under its own `marker` kind.

## Verification
Run the diff on paired runs where exactly one treatment axis differs (italic vs roman, underline present vs absent, uppercase vs none, small-caps vs normal, disc vs decimal) and assert a single delta on that axis at the expected severity. Repeat with the axes matching and with the field absent on one side; assert no delta in both cases.