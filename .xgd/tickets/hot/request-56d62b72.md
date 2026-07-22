---
uid: request-56d62b72
id: REQ-83
type: request
title: 'Framework pivot B2: capture to L1 fold (keyframes + oracle) + structural-hint
  extractor'
created_by: xgd
created_at: '2026-07-20T19:48:24.468991+00:00'
updated_at: '2026-07-22T18:51:59.116527+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 7131f5e377c7b014ddc8c220b633a7136cf0d0a9
    reconcile_sha: null
    main_sha: null
  - working_sha: 94365416f9d67df69e93d31446eec27d381f1cb7
    reconcile_sha: null
    main_sha: null
  version: 0.0.168
  story_points: 5
  bundled_in: bundle-31e474b9
---

Part of the framework pivot — see **REQ-79 (request-87b26bca)**. Depends on the L1 substrate REQ.

## Goal
Make reproduction **mechanical**: fold a multi-viewport capture into **one L1 document**, and extract **advisory structural hints** from the source.

## Behaviour
- **Fold**: match nodes across the 6 sampled widths (reuse `responsive-diff` alignment); per node emit L1 leaf values + geometry keyframes + per-segment `interpolate|snap` flags + a visibility rule (presence across widths). **Retain the raw 6-sample ladder as the acceptance oracle** in the bundle.
- **Structural-hint pass** (extends DOC-13 rendered-only → rendered + hints): annotate each element/group with ancestry / parent-id, sibling-repetition, parent **computed** layout (`display`/`flex-direction`/`justify-content`/`gap`/`grid-template-columns`), sizing unit (`%`/`fr`/`auto`/`clamp` vs `px`), position mode, real `@media` breakpoints, semantic tags. **Advisory only; never executed** (read for DIRECTION, not EXECUTION).
- `1c capture page <url>` emits an **L1 doc** (+ oracle ladder + hints) — the old manifest/`reproduce`/`adopt-values` path dissolves.

## Acceptance (UAT — `test_UAT_FC_<this REQ id>_*`)
- `capture_emits_l1`: capturing a fixture site produces a valid L1 doc that renders within tolerance of the oracle at the sampled widths.
- `keyframes`: an element with fluid width across widths folds to `interpolate`; a reflow folds to `snap`.
- `hints`: the hint pass reports container layout mode + sizing unit + `@media` breakpoints for a fixture.

## Docs (same session)
- Update **DOC-13**: rendered-only → rendered + structural hints.

-


---

## As-built (follow-up session — closed the two deferred deliverables)

The core (fold.ts, hints.ts, oracle retention, 3 UATs) landed in the first session
(commit `7131f5e`, v0.0.161). This follow-up closed the two gaps that were promised
but unmet:

**GAP 1 — DOC-13 updated (doc change, no ceremony).** Appended §11 "Structural
hints (advisory)" to DOC-13, preserving §§1–10. It documents the hint pass
(ancestry/parent-id, sibling-repetition, parent computed layout —
display/flex-direction/justify/gap/grid-template-columns, authored sizing unit
%/fr/auto/clamp vs px, position mode, real @media breakpoints, semantic tags),
grounded in `tools/generate/src/cli/capture/hints.ts`, and states the load-bearing
rule: hints are **advisory only — read for DIRECTION never EXECUTION** (they inform
AI structure recovery in REQ-86; nothing in the render/repro path consumes them).

**GAP 2 — `adopt-values` dissolved (VESTIGE → removed).** Investigation: `adopt-values`
(REQ-66) read a capture bundle's `multistate.json` ladder and snapped flat Type-A
axes into a draft's **old-model styled content objects** (`modules[].content`, dials,
`*Style`) — the pre-L1 "capture bundle → adopt axis values into a site" reproduction
flow that REQ-84 (removed layout modules) + REQ-86 (fully-L1 fold) superseded. It has
no role in the L1 pipeline → removed completely: CLI case + USAGE, `edit.ts` logic
(`adoptFlatValues`/`cmdAdoptValues` + types + now-unused capture import). The REQ-74
`adopt-gaps` sibling (`planGapFixes`/`cmdApplyGapFixes`) is an independent surviving
feature and was left untouched; its UATs moved from the misnamed
`tests/req66-adopt-values.test.ts` to `tests/req74-gap-inversion.test.ts`. New UAT
`test_UAT_FC_REQ-83_adopt_values_command_removed` asserts the strip is total
(not a valid CLI command → unknown-command default; no surviving exported symbol).

Note for follow-up (out of this session's scope): `adopt-gaps` (REQ-74) itself
targets the removed `text-block`/`services-grid` layout modules + `dials.spacingTop`,
so it is likely a vestige too — flagged, not acted on (this session was scoped to
`adopt-values` only).

**Verification:** clean cross-package typecheck (site-schema build → framework
--noEmit → tools/generate --noEmit, all OK); `req83` + `req74` green (8/8, incl. the
new UAT and the real-Chromium hints probe); L1-pipeline regression `req84` + `req86`
green (6/6); CLI-surface `req11` + cli-output-hygiene green (14/14). Commit
`9436541` (v0.0.168).