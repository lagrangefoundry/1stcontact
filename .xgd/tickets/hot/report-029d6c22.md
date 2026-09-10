---
uid: report-029d6c22
id: REPORT-3654
type: report
title: 'Fix Site Locale Identity: Where A Business Is, And What The Page Declares
  (uat) — attempt 1'
created_by: xgd
created_at: '2026-09-10T03:51:10.712401+00:00'
updated_at: '2026-09-10T03:51:10.712401+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-bcbcdaf1
  level: uat
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Locale Identity: Where A Business Is, And What The Page Declares (uat)

**Attempt**: 1
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

All three findings the assessor raised (2 violations + 1 warning) are `uat-edit`s
on the same file, `tests/reconciliation-site-locale-identity.test.ts`, and all
three are applied. The report's diagnosis held exactly: the two violations were
the two ACs the `ac`-level fix loop edited on 2026-09-10 after the UAT file was
generated on 2026-08-31, and the assertions they now demand were already written
and passing in the intent-era FC file. Findings 1 and 2 were lifts; Finding 3 was
one new line.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | `test_UAT_AC1428_…` (`tests/reconciliation-site-locale-identity.test.ts:144-166`) | Added the whole-resolution assertion for an empty declaration — `toEqual({country: DEFAULT_COUNTRY, locale: UNDECLARED_LOCALE, currency, timezone, dir:'ltr'})`, the literal `toMatchObject({country:'US',currency:'USD',timezone:'America/New_York'})` restatement, and the negative `.not.toBe(COUNTRY_DEFAULTS[DEFAULT_COUNTRY].locale)` that pins the two halves as different behaviours. Lifted from `tests/test_UAT_FC_REQ-151_site_locale.test.ts:143-156` per the assessor's suggested edit. |
| 2 | uat-edit | `tests/reconciliation-site-locale-identity.test.ts:6` | Added `DEFAULT_COUNTRY` to the `packages/site-schema/src` import, required by Finding 1's assertions. |
| 3 | uat-edit | `test_UAT_AC1433_…` (`tests/reconciliation-site-locale-identity.test.ts:295-306`) | Added the permissive complement AC-1433 gained at 03:38 — loops `['qz','qz-IE','zxx','tlh-Latn-US']` (with and without a region, as the Verification asks), asserting `validateSite(siteJson({locale})).ok === true` and `resolveSiteLocale({locale}).locale === locale` so the tag is accepted, not accepted-then-rewritten. This is what makes the nine-case refusal list a boundary rather than an allowlist; a later tightening to registry membership now fails this UAT. Lifted from `tests/test_UAT_FC_REQ-151_site_locale.test.ts:283-296`. |
| 4 | uat-edit | `test_UAT_AC1432_…` (`tests/reconciliation-site-locale-identity.test.ts:257`) | Added `expect(localeDirection('qz-XX')).toBe('ltr')` for AC-1432's previously unevidenced criterion sentence "An unrecognised locale is left-to-right" (Finding 3, warning). |

## Verification

`npm test -- tests/reconciliation-site-locale-identity.test.ts` → **10 passed / 10**, 592ms.

Re-run together with both intent-era files the lifts came from, to confirm nothing
regressed in the sources:
`npm test -- tests/reconciliation-site-locale-identity.test.ts tests/test_UAT_FC_REQ-151_site_locale.test.ts tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts`
→ **3 files passed, 50 passed / 50**.

Every added assertion exercises a real entry point (`validateSite`,
`resolveSiteLocale`, `localeDirection`) with no mocking. No test outside the three
findings was touched — in particular the eight aligned UATs are byte-identical,
including the details the assessor asked be preserved (AC-1433's field-removed
control, AC-1428's published-revision walk, the non-empty guards in AC-1428 and
AC-1437, AC-1437 reading stored slugs at verification time).

## Code Edits (if any)

None this call. Consistent with the report's "Nothing here is a `code-issue`":
every behaviour the two edited ACs demand is already implemented, and the lifted
assertions passed on first run against the landed implementation without any
production change.

## Finding 4 (info) — not acted on

The assessor recorded the duplication between the AC-named file and the two FC
files as info, with an explicit instruction not to delete the FC tests to
"resolve" it. Not touched. As the report notes, that duplication is precisely
what made Findings 1 and 2 a copy rather than an authoring job.

## `uat_coverage` not set

The `uat-edit` recipe ends with `xgd ticket update <ac-uid> --fields
'{"uat_coverage": "pass"}'`. Not done deliberately: no acceptance_criterion in
this matrix carries the field (checked — 0 of 50 sampled ACs have `uat_coverage`
in `frontmatter.fields`), so setting it on these three alone would introduce a
field the surrounding matrix does not use rather than record a state change. The
field is owned by the `check`/`fix_uat_coverage` prompts; setting it from
`fix_structural_validation` would manufacture progress in a lane this loop does
not own. Flagging rather than silently skipping.

## needs_review Items Forwarded

None. The report carried `needs_review_count: 0` and all three findings were
actionable as categorized.

## Note for the next check

The report's cascade note is worth carrying forward: both violations existed only
because the `ac`-level fix loop edited an AC body after its UAT was generated, and
nothing in the pipeline re-runs UAT generation on that event. This shape — `ac`
passes on attempt 2, `uat` then fails on exactly the ACs attempt 2 touched — is
diagnosable from `updated_at` alone and should be expected whenever the AC fix
loop fires.
