---
uid: bug-e4af6a67
id: BUG-10
type: bug
title: Capture records list-style-type for non-list elements — every run renders a
  bullet
created_by: xgd
created_at: '2026-07-23T18:35:46.249096+00:00'
updated_at: '2026-07-23T20:28:07.294904+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 3eceada530fd1f818d90af97befde4f1656915d2
    reconcile_sha: null
    main_sha: null
  version: 0.0.182
  story_points: 1
---

Scope under [[request-7ff1bacd]] (REQ-88). Appearance-population gap surfaced by the
gigabytealchemy re-run. Capture-side; independent of the fold work.

## Behavior (bug)
Every rendered run shows a bullet. The fresh fold carries `listMarker:'disc'` on
**43 of 55** text nodes — including the `<h1>` wordmark "Gigabyte Alchemy", which is
not a list. The renderer faithfully paints it (`render.ts:378`: `display:list-item;
list-style-type:disc`).

## Root cause
The capture's `EXTRACT_SCRIPT` (tools/generate/src/cli/capture/extract.ts) records
computed `list-style-type` — whose **initial value is `disc` on every element** —
without gating on `display: list-item`. So non-list elements get a phantom marker.
The RawRun contract *says* "list-style-type when a marker is **painted**" but the
painted check is missing.

## Fix (as implemented)
`listMarkerOf(s)` now returns `null` unless `s.display === 'list-item'` — the only
elements for which the browser generates a `::marker` box. A genuine `<li>` (or any
list-item) keeps its marker; every other element reports `null`. `none` still
suppresses a marker on a real list item. The fold (`foldListMarker`) and renderer
are untouched — they are correct once the input is clean.

Single-line gate added to `listMarkerOf` in extract.ts; nothing else changed.

## Tests
`tests/bug10-list-marker-gate.test.ts` — four UATs run the **real** EXTRACT_SCRIPT
under jsdom (mirroring the req63 extraction test):
- `test_UAT_FC_BUG-10_non_list_runs_have_no_phantom_marker` — wordmark `<h1>` and
  body `<p>` carrying the initial-value `disc` report `listMarker: null`.
- `test_UAT_FC_BUG-10_genuine_list_item_keeps_its_marker` — a real `<li>` keeps `disc`.
- `test_UAT_FC_BUG-10_list_item_with_none_has_no_marker` — `list-style-type:none` → null.
- `test_UAT_FC_BUG-10_mixed_list_and_non_list_fixture` — heading + list: only the
  list item carries a marker (`decimal`).

Note: jsdom does not apply the UA `disc` default, so non-list fixtures set
`list-style-type` inline — this reproduces the exact computed-style input a real
browser presents for a plain heading/paragraph, which the gate must suppress.

Regression scope (green): req63-values-diff-coverage, req47-fidelity-structural,
and the l1 fold/roundtrip suite. (One pre-existing, unrelated failure in
reconciliation-l1-substrate `validateL1` — fails with this change stashed.)

## Acceptance — met
No bullet on non-list runs (wordmark, headings, body); genuine `<li>` lists keep
their markers; a mixed list/non-list fixture regresses it.