---
uid: report-b1f350ae
id: REPORT-3732
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (uat) — attempt
  7'
created_by: xgd
created_at: '2026-09-10T12:41:22.997995+00:00'
updated_at: '2026-09-10T12:41:22.997995+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: uat
  fixes_applied: 10
  progress_made: true
  needs_more_work: true
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (uat)

**Attempt**: 7
**Fixes applied this call**: 10
**Violations remaining**: 0 (both violations addressed; 1 warning — Finding 5 — deferred to attempt 8)
**Needs more work**: true

Both violations (Findings 1 and 2) and four of the five warnings (3, 4, 6, 7) are
closed this call. Only Finding 5 (the AC-930 / AC-942 cross-capability duplicate)
remains; it is the one finding needing a test **retarget** rather than a split or a
clause edit, and it is scheduled for attempt 8.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-685 (`acceptance_criterion-62adf959`) | **Finding 1 (violation), 5th cycle — closed as `ac-edit`, the assessor's primary category.** ¶1's "this holds even for a value that bypassed validation" is now scoped to the five families DOC-2 §2 actually guarantees at Layer 2 (text / colour / font-family / length / image-src), with a new sentence stating a closed-enum axis is bounded by the **schema** (Layer 1) instead. ¶2's re-derivation list no longer says "closed-enum": numeric and hex fields are re-checked at emit time, enum fields are constrained by the envelope before the emitter reads them. Verification gains an explicit "enum payloads are not part of this criterion" line so no later cycle adds one. Confirmed the code side first: `grep -n cssEnum packages/framework/src/l1/render.ts` → 0 hits, and `:2037`/`:2038`/`:230` interpolate `text-transform` / `font-style` raw. Neither `test_UAT_AC685_*` needed touching (both already bypass validation, which the AC now states explicitly), and neither went red |
| 2 | uat-edit | `test_UAT_AC1012_*` (`tests/reconciliation-nowrap-width-floor.test.ts`) | **Finding 2 (violation), 4th cycle.** Split into two tests: an engine-free `test_UAT_AC1012_floored_and_fixed_stylesheets_differ_only_in_their_width_declarations` (the stylesheet-equality proxy, unchanged assertions) and `it.runIf(HAVE_CHROMIUM)('test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed')` carrying the box measurement. The fixture moved to a shared `uneditedFixture()` so both arms measure the same document. **The success condition the report predicted now holds: the file reports `4 passed \| 3 skipped`, not `4 passed`** |
| 3 | ac-edit | AC-1012 (`acceptance_criterion-c9bec9a2`) | **Finding 2(b)** — took the assessor's option (ii). Dropped the "…and that the same document's round-trip fidelity against the original capture is unchanged" clause (no arm reached it; the fixture is a synthetic `multi(…)` with no original capture) and the criterion's matching "matches the captured reference within the round-trip tolerance" phrase, cross-referencing **AC-683**, which owns and proves `capture(render(L1)) ≈ L1` against a real capture. Verification now names the two arms explicitly and marks the browser arm as engine-gated / reported-as-skipped |
| 4 | uat-edit | `test_UAT_AC1009_*` (same file) | **Finding 3.** Bare `if (!HAVE_CHROMIUM) return` tail replaced by a separate `it.runIf(HAVE_CHROMIUM)('test_UAT_AC1009_longer_copy_grows_the_floored_box_instead_of_vanishing')`; fixture extracted to `floorFixture()` |
| 5 | uat-edit | `test_UAT_AC1011_*` (same file) | **Finding 3.** Same split: engine-free declaration/extrapolation arm, plus `it.runIf(HAVE_CHROMIUM)('test_UAT_AC1011_each_rung_measures_at_its_own_floor_never_the_extrapolation')`. Fixture + the extrapolation constant hoisted to `AC1011_CAPTURED` / `AC1011_EXTRAPOLATED` / `growingFixture()`. File header documents why the split exists, so a later reader does not re-collapse it |
| 6 | uat-edit | `tests/reconciliation-behavior-modules.test.ts:471` | **Finding 4, sub-defect.** `vi.doUnmock('../packages/framework/src/index')` → `'../packages/framework/src/worker'`, the path the negative arm actually mocks since REQ-145. The old line was inert; the mock was never torn down. Comment records why the path matters |
| 7 | ac-edit | AC-702 (`acceptance_criterion-a2c7925e`) | **Finding 4, main.** Took the assessor's second option (record it) rather than adding a production seam: the Verification now states that the shipped render path takes its catalog from a static import and accepts no injection, so the empty-catalog arm's premise **is** the substituted `@1stcontact/framework/worker` catalog, with the pipeline/CLI/filesystem real and the positive arm guarding vacuity — and that the arm should be rewritten to drive a catalog/resolver seam if one is ever added. This is now a declared, bounded substitution rather than an undeclared internal mock |
| 8 | ac-edit | AC-686 (`acceptance_criterion-33ecc306`) | **Finding 6.** Deleted the "repeat a representative violation as an authored page inside a site definition" clause from Verification and cross-referenced **AC-849 / AC-850**, which drive it through a real site definition. The criterion's authored-document paragraph is kept but now says in-line that AC-849/AC-850 own and prove it — attribution fixed without deleting intent |
| 9 | ac-edit | AC-687 (`acceptance_criterion-c9b3f600`) | **Finding 6.** Same treatment for the `/pages/N/l1/…` page-prefix clause: removed from Verification, cross-referenced to AC-849/AC-850, criterion paragraph retained with explicit ownership. **No new tests written** — the assessor's "do not uat-add" instruction is honoured; `test_UAT_AC849_*` already asserts the multi-page prefixing |
| 10 | uat-edit | `test_UAT_AC718_*` (`tests/reconciliation-reproduction-treatments.test.ts`) | **Finding 7.** Added `expect(contactFormMeta.slots.form.required).toBe(true)` beside the existing `Object.keys(…slots)` assertion — verified against the real shape (`BehaviorSlotSpec.required`, `packages/framework/src/modules/behavior.ts:64`; `contact-form/meta.ts:58-62`). Replaced the retired REQ-87 "capability" vocabulary in the file header (×2), the section header and the `describe` string with "behavior". No AC edit (the AC was already correct) |

## Verification run

```
npm test -- tests/reconciliation-reproduction-treatments.test.ts \
             tests/reconciliation-behavior-modules.test.ts \
             tests/reconciliation-nowrap-width-floor.test.ts

 Test Files  3 passed (3)
      Tests  16 passed | 3 skipped (19)
```

The 3 skips are the three newly separated engine-gated arms (AC-1009, AC-1011,
AC-1012) reporting honestly under this sandbox's chromium absence. Before this
call the same file reported `4 passed (4) … 14ms` with nothing skipped — the
number the anchor report singled out as the counter-signal. `test_UAT_AC703_*`
passed in this run rather than hitting `listen EPERM`; that arm was not touched.

## Code Edits (if any)

None. All ten mutations are matrix (AC body) or test edits.

## needs_review Items Forwarded

None. One finding is deferred rather than forwarded:

| Element | Finding | Plan for attempt 8 |
|---|---|---|
| `test_UAT_AC930_*` (`tests/reconciliation-colour-palette-overlay.test.ts:286`) + AC-930 | Finding 5 (warning, exclusivity): duplicates STORY-97's `test_UAT_AC942_*` in shape across capabilities | Retarget the test at the axis AC-930 uniquely owns — a reference carrying its own alpha resolving to the right literal, via `validateL1` + `resolveL1Color` at the load boundary, keeping the whole-byte-range exactness loop — drop the `cmdColors`/`cmdColorsAssign` drive, and apply the matching one-line `ac-edit` on AC-930's Verification, which currently mandates that drive |

## Notes for the assessor

- **Finding 1 was resolved by the primary category (`ac-edit`), not the `code-issue`
  alternative.** The evidence chain the report laid out points that way: DOC-2 §2
  does not list enums among the Layer-2 guarantees, `render.ts` has no enum guard,
  and `validateL1` genuinely rejects an enum breakout on the production path, so no
  shipped site is exposed. If the operator prefers the stronger reading, the change
  needed is an emit-time enum re-check shaped like `cssColor`, plus an enum payload
  case in one `test_UAT_AC685_*`; nothing in this call's edits blocks that.
- **`uat_coverage` fields were deliberately not touched** — that field is owned by
  check/fix_uat_coverage.
