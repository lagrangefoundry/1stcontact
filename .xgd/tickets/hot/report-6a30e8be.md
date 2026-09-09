---
uid: report-6a30e8be
id: REPORT-3591
type: report
title: Fix 1c Capture & Diff Fidelity (ac) — attempt 7 (cont.)
created_by: xgd
created_at: '2026-09-09T23:56:07.415699+00:00'
updated_at: '2026-09-09T23:56:07.415699+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: ac
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (ac)

**Attempt**: 7 (second call)
**Fixes applied this call**: 7 (6 ticket mutations + 1 test edit)
**Violations remaining**: 0
**Needs more work**: false

This call finished STORY-77 — the last of the three stories carrying findings — and
cleared both warnings. Combined with the previous call (11 mutations across STORY-75
and STORY-76), all **12 violations and both warnings** in `report-6c3ed8d8` are now
addressed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-add | STORY-77 → **AC-1613** | Finding 10 (REQ-58). "`values-diff --multi-viewport` projects the draft across every persisted rung and reports worst-cell-first" — all three unpinned assertions: projection across *every* rung, cell-for-cell worst-first ordering (missing cells leading, then by top-delta severity), and the fail-loud refusal on a bundle with no ladder. Grounded in `fidelity.ts:199-235` (the loop and its two refusals), `:237-246` and `values-diff.ts:2726-2735` (`diffMultiState` returns the worst-first ranking) |
| 2 | ac-add | STORY-77 → **AC-1614** | Finding 11 (REQ-64). "`--collapse` deduplicates cell rows to one row per defect; the per-cell view stays the default" — both directions, including the diagnostic reason the un-collapsed view is the default. Grounded in `fidelity.ts:309-373` (dedup on `(text, property)`, widths recorded) and `index.ts:1040-1044` (`clusters ? … : collapse ? … : cells` — cells is the default arm) |
| 3 | ac-add | STORY-77 → **AC-1615** | Finding 12, roll-up half (REQ-76). "`--clusters` rolls collapsed defects into ranked causes carrying count, worst tier, width scope and a disposition" — several properties to one cause, the four carried attributes, count-first-then-worst-tier ranking, and the fix/review/accept summary. Grounded in `fidelity.ts:430-505` (`CAUSE_MAP` maps arrangement+containment → layout structure, shape+border+outline → control styling, fontLoad → `accept`) and `:507-530` |
| 4 | ac-add | STORY-77 → **AC-1616** | Finding 12, honesty half. "Cause roll-up never counts a derived axis and never drops an untaxonomised property" — split out because the two rules pull in opposite directions (one refuses to count, one refuses to drop). The second is the rule that keeps this story honest as STORY-75's axis set grows, which is exactly what last call's findings 1–5 did to it. Grounded in `fidelity.ts:300-303`, `:385-388`, `:489` (`if (d.derived) continue`) and `:490` (`CAUSE_MAP[d.property] ?? { cause: d.property, disposition: 'review' }`) |
| 5 | ac-add | STORY-77 → **AC-1617** | Warning 14 — carried unrepaired across four prior reports (`report-728bd245`, `report-cb7ea283`, `report-15f4892f` f5, `report-aec8af1b` f4). "One deterministic reference cell is selected per width, preferring the primary engine at rest", with the full documented fallback order and the absent-width case that feeds AC-642. The report offered "add an AC **or** drop the claim from Technical Context"; I took the AC, because the ladder genuinely can carry several projections per width (multiple engines × states) so the claim is load-bearing rather than vestigial. Grounded in `values-diff.ts:2707-2723` (`selectProjectionAtWidth`) |
| 6 | ac-edit | **AC-647** (`acceptance_criterion-b94eb4c7`) | Warning 13. Extended so In-scope item 5's own claim — the ladder as a capture-time artifact — is asserted: the per-rung **value manifest** now sits alongside the per-rung screenshots in both Criterion and Verification, with the no-image-bytes separation retained. Title widened to match. Grounded in `capture.ts:66-76` (`runMultiStateCapture` over `RESPONSIVE_VIEWPORTS` → `writeMultiState`, then the screenshot sibling) |
| 7 | uat-edit | `tests/reconciliation-size-aware-diff.test.ts` | Paired with #6 so the edited AC is not left stale: `test_UAT_AC647_…` now asserts the persisted `multiState` carries a projection at every `RESPONSIVE_VIEWPORTS` width and that each carries a per-element manifest, alongside the pre-existing screenshot and no-image-bytes assertions. **8/8 pass** |

All five new ACs carry `uat_coverage: missing`, so the uat level sees them as open
coverage rather than as silently passing.

## Verification

`npm test -- tests/reconciliation-size-aware-diff.test.ts tests/reconcile-gradient-first-class.test.ts`
→ **2 files, 12 tests, all passing.** The gradient suite is last call's AC-638 edit,
re-run here to confirm no regression.

## Code Edits (if any)

None. The two non-ticket edits across both calls are UAT extensions (tests, not
production code), each paired with the ac-edit it keeps honest. No `code-issue` was
opened in either call: as the report states, in every finding the code is right and
the matrix was silent or wrong about it.

## Cumulative Position Against `report-6c3ed8d8`

| Finding | Story | Category | Resolution |
|---|---|---|---|
| 1–5 | STORY-75 | ac-add ×5 | AC-1605, AC-1606, AC-1607, AC-1608, AC-1609 + AC-1610 (finding 5 split into gap axis + band-padding supersession) — call 1 |
| 6 | STORY-76 | ac-edit | AC-638 narrowed to `#hex`-only stops, palette-role moved to the rejected side (REQ-114) — call 1 |
| 7 | STORY-76 | ac-add | AC-1611 (four-clause surface-gradient ancestor selection) — call 1 |
| 8 | STORY-76 | ac-add | AC-1612 (REQ-72 in-browser hexification) — call 1 |
| 9 | STORY-76 | story-body-edit | In-scope clause restored for the validation leg; Out-of-scope narrowed to the resolver path — call 1, applied together with finding 6 per report note 2 |
| 10–12 | STORY-77 | ac-add ×3 | AC-1613, AC-1614, AC-1615 + AC-1616 (finding 12 split into roll-up + the two honesty rules) — this call |
| 13 (warning) | STORY-77 | ac-edit | AC-647 extended to the per-rung value manifest — this call |
| 14 (warning) | STORY-77 | ac-add | AC-1617 (deterministic per-width cell selection) — this call |

Report note 4's four clean stories — STORY-78, STORY-79, STORY-124, STORY-125 — were
left untouched in both calls, as instructed.

## Carried Forward — not actionable at this level

**Stale comments in `validate.ts` (report note 3).** `:131` ("a bare colour string
(hex/role)") and `:167-168` ("Absolute value (#hex) or a palette-role alias… the same
literal-or-role rule") still carry the REQ-114-retired formulation. The behaviour is
correct — every stop routes through `validateColor`, which rejects a role — so this is
not a `code-issue` and no AC depends on it. But it is the most plausible mechanical
reason findings 6 and 7 survived five cycles, and it will keep misleading anyone who
verifies AC-638 from nearby source rather than from the call graph. Worth a
comment-only cleanup outside this check.

**Environment note.** In this worktree the reconciliation suites cannot import until
`./bin/1c assets` regenerates `apps/control-app/src/generated/` (`Cannot find module
'./generated/ai-workers.js'`) — a location artifact, not a regression. Run in call 1;
no `dist-assets.staging/` left behind.

## needs_review Items Forwarded

None. No finding in `report-6c3ed8d8` is categorized `needs_review`, and none arose
across either call.
