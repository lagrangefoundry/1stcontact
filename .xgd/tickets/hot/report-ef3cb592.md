---
uid: report-ef3cb592
id: REPORT-898
type: report
title: 'Capability-Intent Alignment: 1c Gradient Fidelity (level=ac)'
created_by: xgd
created_at: '2026-07-24T07:16:28.375554+00:00'
updated_at: '2026-07-24T07:16:28.375554+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-36dd68c5
  level: ac
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Gradient Fidelity
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability (CAP-64 / capability-36dd68c5) has a single story, STORY-76
(story-82eb6908, `story_kind=feature`, status=completed), whose `intent_uid`
is `bundle-ab9e0cb6`. The bundle carries the two intents that constitute this
capability's cumulative scope (REQ-58 and REQ-61 in the same bundle concern the
gigabytealchemy re-import and responsive-diff, not gradient fidelity).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 (via bundle-ab9e0cb6) | reconciled (bundle is a completed story's intent; render/diff landed) | ~2026-07-16 | Capture text-fill gradient **stop positions**; `values-diff` compares stop offsets within ±2pp; absent offsets compared on colour only | YES |
| REQ-62 (via bundle-ab9e0cb6) | reconciled ("Implementation (2026-07-16) — landed, free-coded") | ~2026-07-16 | Capture + **render (resolver)** + diff a **panel/card surface gradient**: `surfaceGradientOf` capture, a `surfaceGradient` treatment (angle+stops, `resolveColor` per stop) rendered as card/panel `background`, and a surface-gradient diff axis | YES |

Note: REQ human-ID direct lookups returned null in this worktree (the intents are
visible via the bundle body only); status inferred from (a) the bundle being the
`intent_uid` of a `completed` story, (b) the capability being `active` with
`uat_coverage=pass`, and (c) both REQ bodies recording landed implementations.
This does not affect the finding — the story body is the working reference at
`ac` level and is internally clear about scope.

**Cumulative intent:** capture + diff of text-fill gradient stop positions
(REQ-59); capture + resolver-render + diff of a panel/card **surface** gradient
(REQ-62). REQ-62 scopes a *shared surface-gradient resolver* rendered as a
card/panel background — it does **not** scope homing that fill as a padded/rounded
render on any specific module. The story body reflects this exactly in its
"Out of scope" clause.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-76 | REQ-59, REQ-62 | aligned (working reference; story body internally consistent, out-of-scope clause explicit) |
| AC-634 (text-fill stop-position drift → gradient delta, ±2pp) | REQ-59 | aligned |
| AC-635 (stops without explicit offset compared on colour only) | REQ-59 | aligned |
| AC-636 (missing/differing panel **surface** gradient → surface-gradient delta; matching/absent → none) | REQ-62 | aligned |
| AC-637 (criterion: `resolveSurfaceGradient` → `background-image: linear-gradient(...)`, absolute-or-overlay stops, <2 stops → no fill) | REQ-62 | **criterion aligned; TITLE misaligned** — title claims a text-block padded/rounded gradient-panel render the story marks out of scope |
| AC-638 (gradient content-field value: accept well-formed, reject non-gradient with field-naming error) | REQ-62 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-637 | ac-edit | AC-637 **title** — "A text-block authored with a gradient panel renders a padded, rounded panel with that gradient surface" — asserts homing the gradient surface fill as a padded/rounded render on a specific module (text-block). STORY-76's "Out of scope" explicitly excludes this in near-identical words: "homing the resolved gradient surface fill as an authored render on a specific module ... no module currently owns a padded/rounded/inset gradient-panel render". REQ-62 scopes only the shared resolver rendered as a card/panel background, not a module-specific padded/rounded panel. The AC's own **criterion + verification** are correctly in-scope (they exercise only `resolveSurfaceGradient` returning a `background-image: linear-gradient(...)` declaration; nothing about a text-block, padding, or rounding). So the title overstates capability relative to both intent and the criterion beneath it. | Reword AC-637 title to match its criterion, e.g. "A gradient content value resolves via `resolveSurfaceGradient` to a `linear-gradient` surface fill (absolute-or-overlay stops), superseding the solid fill". Do NOT touch the story body (its out-of-scope clause is correct) and do NOT touch the AC criterion/verification (already correct). |

## Notes for the Editor

- **Single-line fix.** Only the AC-637 title needs editing. Its criterion body,
  its verification, the story body, and the other four ACs are all correctly
  aligned to REQ-59/REQ-62. Resist the temptation to "make the title true" by
  adding a text-block gradient-panel render — that render is deliberately out of
  scope per STORY-76 and unscoped by REQ-62; adding it would be new capability,
  not an alignment fix.
- **Coverage is complete.** Text-fill stop positions (AC-634 drift, AC-635
  absent-offset), panel surface-gradient diff (AC-636), resolver authoring
  (AC-637 criterion), and gradient-value validation (AC-638) collectively cover
  the story's in-scope surface. The correctly-excluded items (radial/conic
  gradients; the solid composited `surfaceFill` axis owned by CAP-63) have no
  ACs, as intended — no over-coverage.
- **No exclusivity issues.** AC-634 (offset-drift delta) and AC-635
  (absent-offset colour-only) are distinct scenarios, not duplicates; AC-636's
  surface-*gradient* axis is explicitly distinct from CAP-63's solid `surfaceFill`.
