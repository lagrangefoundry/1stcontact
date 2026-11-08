---
uid: story-1e340c9a
id: STORY-176
type: story
title: 'Multi-variate text runs: one string of L1 page text can vary within itself'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:27:19.176018+00:00'
updated_at: '2026-11-08T13:51:38.281230+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-0d00566a
  capability_uid: capability-ae9d65d6
  story_kind: feature
  story_points: 3
---

## Story
**As an** AI author (and the site owner whose copy it lays out), **I want** a single piece of page text to vary within itself — a coloured word in a headline, an ordinal set as a superscript, an emphasised phrase in a paragraph — **so that** ordinary inline typography reflows with the copy at every width instead of being faked with hand-positioned, absolutely-placed text fragments.

## Description
An L1 text node's `text` is either a plain string (unchanged; every existing document stays valid) or an ordered, one-level list of at least two `{ text, axes? }` runs. Run axes are a narrow, relative subset: `color`, `sizeScale`, `fontWeight`, `fontStyle`, `baselineShiftEm`.

The capability spans the whole round trip:
- **Schema + envelope**: the run form is closed (no nesting, no links, no off-subset axes); a one-element array is refused so the string is the only spelling of single-run copy; run scale, lift and weight are bounded by the L1 envelope.
- **Renderer**: one span per run that varies; a run with no axes emits bare text.
- **Capture → fold → fidelity oracle**: capture records which runs share an inline flow (a `<br>` or a blockified child ends a flow); the fold rejoins only flows whose runs differ in fill, size, weight or slope, laying the node out in the flow root's rect; the oracle and the round-trip manifest agree with the fold on which flows were rejoined.
- **Editor**: a multi-run node opens as `Text 1 … Text N` plain-string fields; per-run axes stay AI-only.
- **Text-height estimation** treats a multi-run node consistently with the same copy as one run.

Out of scope (per REQ-211): inline links inside runs, nesting/rich text, logo marks (`outline_text`), SVG `<tspan>` (REQ-209).

## Technical Context
- Intent: REQ-211 (bundled in BUNDLE-41), DOC-52 §3.7; editor exposure rule DOC-28 §3 ("a plain string or a pick from a closed list").
- Security policy §1–2: runs keep the structured-only invariant — the run schema is closed (unknown keys rejected), colours stay hex/palette, and the renderer remains the only emitter (and the sole `<a>` sink).
- Relative sizes are load-bearing: `sizeScale` emits as `em` and `baselineShiftEm` as `vertical-align` in `em`, so a run rides the node's per-width `responsive.fontSizePx` track (BUG-18) and the line box accounts for a lifted run.
- The rejoin decision is stated once and shared by the fold and the fidelity oracle (CAP-71 L1 Reproduction Pipeline; CAP-63 Capture & Diff Fidelity) so an emphasised word never reports phantom `unmatched` runs.
- Envelope bounds as landed: `runSizeScale` 0.1–8, `runBaselineShiftEm` −10–10; run weight uses the existing `fontWeight` bounds.
- Existing evidence: `tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts`, `tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts` (two browser-gated tests).

## Reconciliation Decisions
- **Baseline shift alone does not make a flow "vary"** (decided at reconciliation, 2026-11-08): REQ-211 names fill, size, weight and slope as the rejoin test and is silent on a flow differing only in `vertical-align`. The landed code does not rejoin such a flow (rare case; rejoining would trade exact boxes for a flowed box). Formalized in the "flow that varies in nothing is left as separate nodes" AC.
- **Exact envelope numbers** (decided at reconciliation, 2026-11-08): REQ-211 requires run bounds but names no values; the landed scale 0.1–8 and lift −10–10 em are formalized as the envelope AC's boundaries, with a superscript's ordinary values admitted.

No intent/code contradictions found.

## Dependencies
-

## Story Points
3