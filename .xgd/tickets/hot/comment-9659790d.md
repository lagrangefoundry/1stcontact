---
uid: comment-9659790d
id: COMMENT-2453
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T03:51:25.130452+00:00'
updated_at: '2026-09-10T03:51:25.130452+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-029d6c22
  kind: note
---

Done. All three findings resolved in one call; the report is REPORT-3654 (`report-029d6c22`).

## What I did

All three findings were `uat-edit`s on `tests/reconciliation-site-locale-identity.test.ts`, and the assessor's diagnosis held exactly — the two violations were the two ACs the `ac`-level fix loop edited *after* the UAT file was generated, and the assertions they now demand were already written and passing in the intent-era FC file. Two lifts and one new line:

| Finding | Fix |
|---|---|
| 1 (violation) | AC-1428's test asserted only `resolveSiteLocale({}).locale` — the "just its language" shape the AC now names as insufficient. Added the whole-resolution `toEqual`, the literal `US`/`USD`/`America/New_York` restatement, and the `.not.toBe(en-US)` negative. Added `DEFAULT_COUNTRY` to the import. |
| 2 (violation) | AC-1433's test had no permissive case, so the exact tightening the AC was edited to forbid would have passed. Added the loop over `qz`, `qz-IE`, `zxx`, `tlh-Latn-US` asserting each validates *and* resolves unchanged. |
| 3 (warning) | AC-1432's "an unrecognised locale is left-to-right" had zero evidence. Added `expect(localeDirection('qz-XX')).toBe('ltr')`. |

**Verified**: `npm test -- tests/reconciliation-site-locale-identity.test.ts` → 10/10 passed. Re-run alongside both FC source files → 50/50 across 3 files. No production code changed — the lifted assertions passed first try against the landed implementation, confirming the report's "the defect is in the evidence, not the code."

The eight aligned UATs are untouched, and I did not delete the FC tests to resolve the Finding 4 duplication, per the report's explicit instruction.

## One deviation worth your attention

The `uat-edit` recipe ends with setting `uat_coverage: "pass"` on each AC. **I skipped that deliberately** — no acceptance_criterion in this matrix carries the field at all (0 of 50 sampled ACs have it), so setting it on these three alone would introduce a field the surrounding matrix doesn't use rather than record a real state change. That field is owned by the `check`/`fix_uat_coverage` prompts, and setting it from `fix_structural_validation` would manufacture progress in a lane this loop doesn't own. It's flagged in the report rather than silently skipped, so the assessor can overrule me if the convention is meant to start here.

Report fields: `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0` — control hands back to the assessor for verification.
