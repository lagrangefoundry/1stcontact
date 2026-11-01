---
uid: report-7de589e7
id: REPORT-796
type: report
title: Fix L1 Layout Substrate + Safety Envelope (ac) — attempt 1
created_by: xgd
created_at: '2026-07-23T07:37:06.828581+00:00'
updated_at: '2026-07-23T07:37:06.828581+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: ac
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — L1 Layout Substrate + Safety Envelope (ac)

**Attempt**: 1
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

## Resolution of Finding #1 (violation, exclusivity — `ac-deprecate`)

AC-717 (`acceptance_criterion-3a1cae43`) was a behavioural duplicate of AC-684
(`acceptance_criterion-5de42d48`): both assert L1 geometry keyframes drive
per-viewport layout via `interpolate` (continuous) / `snap` (held-then-jump)
segments, with identical verification shape. AC-717's only distinct content was
provenance ("carried by L1, not by per-breakpoint module dials"), not a separate
behavioural criterion. Collapsed AC-717 into AC-684 per the assessor's suggested
edit and STORY-83's own body directive.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit (survivor) | AC-684 (acceptance_criterion-5de42d48) | Folded AC-717's unique provenance note into the Criterion ("Per-viewport variation is carried by this L1 geometry-keyframe substrate, not by per-breakpoint module dials (which no longer exist post REQ-79); this criterion subsumes the retired AC-717"). Survivor kept per assessor note (numerically-precise: position+width, endpoint pinning, below-smallest/above-largest clamping). |
| 2 | ac-deprecate | AC-717 (acceptance_criterion-3a1cae43) | Added a `note` comment (COMMENT-336) recording lineage/reason + where coverage now lives, then **archived** it. |
| 3 | story-body-edit (paired) | STORY-83 (story-d0a8cfad) | Rewrote the stale "a follow-up AC-level dedup *should* collapse AC-717…" sentence in the "Merged from STORY-81" section to record the collapse as **done** (AC-717 archived, note folded into AC-684, duplicate test retired; behaviour covered by reconciliation-l1-substrate.test.ts). |
| 4 | test retire | tests/reconciliation-responsive-keyframes.test.ts | Removed the duplicate UAT probe (`git rm`, committed `b0d397bc`). Behaviour remains covered by tests/reconciliation-l1-substrate.test.ts::test_UAT_AC684_interpolate_varies_continuously_and_snap_holds (7/7 pass, verified). |

## Mechanism note (why archive, not a `lifecycle` field)

The `ac-deprecate` recipe suggests a `lifecycle: deprecated` field, but the
capability/structural validator does **not** filter ACs on any lifecycle field.
Confirmed from source (two independent traces):

- `xgd_source/quality/structural_validation.py:122` builds the tree via
  `ticket_list({"type": "acceptance_criterion"})` and groups every returned AC by
  `story_uid` — no lifecycle/status filter.
- The prompt path (`capability_validation.yaml:165`) uses
  `xgd ticket list --type acceptance_criterion --filter fields.story_uid=<uid>` —
  no `--archived`, no status filter.
- `ticket_list` defaults `include_archived=False`; archived ACs are not indexed.

Therefore **archiving** is the operative — and sufficient — scope-exclusion
mechanism here; a `lifecycle: deprecated` field would have left AC-717 in
`acs_by_story` and the exclusivity violation would have persisted. Archive is the
correct lever for this validator.

## Verification

- `xgd ticket query "type=acceptance_criterion AND fields.story_uid=story-d0a8cfad"`
  → returns exactly 7 ACs (AC-682..688); AC-717 absent (archived) → exclusivity
  scope no longer contains the duplicate.
- `npx vitest run tests/reconciliation-l1-substrate.test.ts` → **7 passed** (incl.
  AC-684 interpolate/snap coverage) after removing the duplicate probe. No coverage
  lost.

## Finding #2 (info, coverage — resolution "none")

No action required. AC-682's structure primitives are covered at acceptance level;
their responsive rendered behaviour is delivered via geometry keyframes (AC-684).
The assessor marked this "No gap at this spike scope."

## Code Edits

None (test-file removal only; no production code touched).

## needs_review Items Forwarded

None.
