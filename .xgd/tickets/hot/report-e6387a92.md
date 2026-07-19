---
uid: report-e6387a92
id: REPORT-671
type: report
title: 'Reconciliation Review: commits (bundle-ab9e0cb6, REQ-58/59/61/62)'
created_by: xgd
created_at: '2026-07-19T04:09:09.194322+00:00'
updated_at: '2026-07-19T04:09:09.194322+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-ab9e0cb6
  anchor_uid: bundle-ab9e0cb6
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Anchor**: bundle-ab9e0cb6 (type: bundle — first-class intent)
**Subject/Intent**: bundle-ab9e0cb6 (REQ-58 gigabytealchemy pass-3 + REQ-59 gradient stop positions + REQ-61 responsive-diff + REQ-62 gradient panel)
**Stories Reviewed**: 8 (story-d5de22a5, story-82eb6908, story-16f2793c, story-2c7069fe, story-e15a19ef, story-c490f1cf, story-3569e1a4, story-46e3b3c7)

## Method

Intent read first (bundle body: REQ-58 T1–T20 log, REQ-59, REQ-61 settled framing + Task-6 scope correction, REQ-62; no chat comments on the bundle). Code read second (grounded new entry points in-tree: resolveColor/resolveStep/classifyLength/resolveSurfaceGradient/responsiveStepVars, responsive-diff.ts, stdio.ts, breakpoints.ts, plus dials cardVeil/cardBorder/navCollapse/panelGradient/submit*/fieldLabels/checkColor/linkColor/copyright). Stories read third. UAT evidence executed.

## Behavior Inventory (8 capability buckets)

1. values-diff capture axes & pairing — rendered-text extent ratio, alpha-composited surfaceFill, box-border axis, duplicate-text pairing by nearest centre.
2. Gradient first-class — text-fill stop positions (GradientStop[]) + tolerance diff (REQ-59); surfaceGradient capture/diff + panelGradient authoring field (REQ-62).
3. Size-aware diff — --size on values-diff (ladder ref) and pixel diff (same-width screenshot); per-width ladder screenshots; stale/uncaptured-width terminal-fail.
4. responsive-diff command — N-way per-node table, --sizes selection, --classify (presence-flip/layout-swap/value-step).
5. CLI hygiene — --multi-viewport boolean flag keeps slug; --json clean stdout (withCleanStdout + bootstrap-warning diversion).
6. Absolute-or-overlay value system — colour (resolveColor), length (classifyLength/resolveStep), radius literals.
7. Per-breakpoint dials — {base,sm,md,lg,xl} length objects, override-and-up, per-breakpoint contentWidth cap, navCollapse dial.
8. Reproduction treatments — cardVeil, cardBorder, fieldLabels=placeholder, submitInline/submitColor, footer copyright/textColor/linkColor.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Capture axes & pairing | Covered | story-d5de22a5 | AC629–633 |
| 2 | Gradient first-class (REQ-59+62) | Covered | story-82eb6908 | AC634–638 |
| 3 | Size-aware diff | Covered | story-16f2793c | AC639–647 |
| 4 | responsive-diff + classifier | Covered | story-2c7069fe | AC648–655 |
| 5 | CLI flag & --json hygiene | Covered | story-e15a19ef | AC656–659 |
| 6 | Absolute-or-overlay values | Covered | story-c490f1cf | AC660–665 |
| 7 | Per-breakpoint dials + navCollapse | Covered | story-3569e1a4 | AC666–673 |
| 8 | Reproduction treatments | Covered | story-46e3b3c7 | AC674–681 |

Every behavior in the bundle's declared scope maps to exactly one story. No uncovered or partially-covered behaviors found.

## Ungrounded Stories

None. Every story describes behavior supported by both the intent and the code.

## Intent-Fidelity Notes (divergences flagged, not absorbed)

- **Added-then-removed text-block `accent` dial** (commit fb42ac7a → removed 49e03566 as broken+redundant): story-46e3b3c7 and the plan explicitly place it OUT of scope; manifesto left-bars use the pre-existing `> [!role]` fc-callout syntax. Correctly NOT documented as a live capability.
- **Site-data commit df70fcda** (gigabytealchemy literal contentWidth 880px): correctly excluded — site authoring, ceremony-exempt (DOC-21), documents no framework capability.
- **Multi-viewport DIFF mode** (formatMultiViewportReport / full-ladder cell diff): its wiring commit 28650cb1 is NOT in this bundle's 29-commit set, so it is out of scope here. story-e15a19ef correctly documents the only in-scope --multi-viewport behavior — the boolean-flag parsing fix (commit 4f681c73) — and does not over-claim the diff mode. No gap.
- **Placeholder `containment` a11y-vs-fidelity residual**: a known residual noted in the intent, not claimed as resolved behavior by any story. Correct.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. capture/values-diff axes & pairing | story-d5de22a5 | ✓ |
| 2. gradient fidelity (capture/author/diff) | story-82eb6908 | ✓ |
| 3. size-aware diff across the ladder | story-16f2793c | ✓ |
| 4. responsive-diff command + classifier | story-2c7069fe | ✓ |
| 5. CLI flag & --json stdout hygiene | story-e15a19ef | ✓ |
| 6. absolute-or-overlay value system | story-c490f1cf | ✓ |
| 7. per-breakpoint dials + nav collapse | story-3569e1a4 | ✓ |
| 8. reproduction module treatments | story-46e3b3c7 | ✓ |

8/8 plan items produced a corresponding story. None dropped.

## Evidence Sufficiency (Step 5b)

51 AC-linked UATs (AC629–AC681) across 8 dedicated reconciliation test files. Executed all: **51/51 PASS** (reconcile-values-diff-fidelity 5, reconcile-gradient-first-class + reconciliation-* 34, size-aware-diff 7, 1c-cli-output-hygiene 5). UATs are behavioral — they enter through real interfaces (parseArgs, withCleanStdout, resolveColor/resolveStep, module render, normalizeGradient, classifyResponsiveTable, values-diff) and assert observable outcomes. No source-text-inspection tests, no internal-component mocking detected. A broken implementation would fail them (e.g. flag consuming the slug positional, render diagnostics leaking to stdout, a gradient stop-position drift passing clean, a translucent card reading as #ffffff).

## Judgment Calls

- Numbering gaps AC646 and AC672 are absent from the test tree — reserved/removed AC numbers, not missing evidence; every AC referenced by a story has a passing UAT. Immaterial.
- Multi-viewport diff mode omission judged NOT a gap: the wiring commit is outside this bundle's cherry-pick scope; documenting it here would be ungrounded within the reviewed commit set.

## Verdict

PASS: Stories accurately and completely document the behavior surface within the bundle's declared scope. Divergences (removed accent dial, excluded site-data commit, out-of-scope multi-viewport diff mode) are flagged rather than silently absorbed. All 8 plan items produced a story; all active ACs have passing behavioral UATs (51/51) that a broken implementation could not pass. A developer reading these stories would have a correct picture of what the operator intended to build.