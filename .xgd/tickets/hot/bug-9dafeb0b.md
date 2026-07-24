---
uid: bug-9dafeb0b
id: BUG-15
type: bug
title: values-diff cannot read L1-rendered pages — reports stale/false 'missing',
  useless as an L1 reproduction scoreboard
created_by: xgd
created_at: '2026-07-23T22:39:21.555138+00:00'
updated_at: '2026-07-23T23:05:37.310352+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 3e0c49f724992c27be7961f436c47da118d1fbbf
    reconcile_sha: null
    main_sha: null
  version: 0.0.187
  story_points: 2
---

Scope under [[request-7ff1bacd]] (REQ-88). Surfaced in the gigabytealchemy round:
our only appearance scoreboard was lying.

## Behavior (bug)
`1c values-diff --multi-viewport` returned **byte-identical** output (354 deltas,
54 Type-B, worst "Your email address") **across two renders that changed
completely** (text-only → hero image + bands + cards + served font). A scoreboard
that doesn't move when the render is transformed is not measuring the render. It
reported ~all target elements as `[B] missing (present → absent)` even though the
rendered page visibly contained them.

## Root cause (CONFIRMED)
Not the pairing (the original "suspected" note) — the **actual-side extraction
came back empty**, which is what makes the output byte-identical (position-based
pairing would tiebreak *differently* on two different renders; an empty actual
side reports every target "missing" identically).

The in-page extractor (`EXTRACT_SCRIPT`, `tools/generate/src/cli/capture/extract.ts`)
segments a page into style-scope **bands** = the top-level `<body>` children that
are `>= 8px` tall. The L1 renderer (`fold.ts:955` builds the root as a
geometry-less box → rendered `position: relative`) emits a **flat tree of
absolutely-positioned leaves under one wrapper**. Absolutely-positioned children
leave no in-flow box, so the wrapper **collapses to height 0**, is dropped by the
`>= 8px` scan → `bands = []` → actual manifest empty → every target element reads
`missing` → the diff freezes regardless of what we rendered.

## Fix (as implemented)
`extract.ts` band selection: when the top-level `>= 8px` scan finds **no** bands
yet the body still paints content, fall back to a single **body-spanning band** so
`runsUnder` / `fieldsUnder` / `itemGroup` still collect the flat tree (paired
downstream by text). General (any absolutely-positioned layout), not L1-specific.
Semantic sites always have real `>= 8px` top-level bands, so the fallback stays
**dormant** for them — no regression.

Pairing was left unchanged: once the actual manifest is populated, the existing
text-key pairing (with a geometry tiebreak for duplicate text) produces real
per-axis deltas. This is the simplest change that meets acceptance.

## Acceptance / evidence
`tests/bug15-values-diff-l1-flat-dom.test.ts` (runs the real `EXTRACT_SCRIPT`
under jsdom over a collapsed flat tree):
- `test_UAT_FC_BUG-15_extract_populates_content_from_collapsed_flat_tree` — the
  flat tree's runs are collected (were empty pre-fix).
- `test_UAT_FC_BUG-15_scoreboard_moves_when_render_changes` — a complete repro
  pairs every element (`matched=3, unmatched=0`); a partial repro genuinely misses
  the absent runs (`matched=1, unmatched=2`); the report MOVES (the frozen
  byte-identical output was the bug). Fails without the fix (`matched=0`).
- `test_UAT_FC_BUG-15_semantic_multiband_dom_bypasses_fallback` — a normal
  multi-section page still yields its real bands (fallback dormant, no regression).

Regression scope (all green): req63 / req47 / req31 / req35 / bug10 / capture
extractor + values-diff suites (82 tests).
