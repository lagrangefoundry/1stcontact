---
uid: report-d5369a72
id: REPORT-3653
type: report
title: 'Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And
  What The Page Declares (level=uat)'
created_by: xgd
created_at: '2026-09-10T03:48:51.731753+00:00'
updated_at: '2026-09-10T03:48:51.731753+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-bcbcdaf1
  level: uat
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And What The Page Declares
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

This is attempt 1 at the `uat` level. The `story` level passed at REPORT-3649 and
the `ac` level passed at REPORT-3652 (attempt 2, 2026-09-10T03:43). Per the level
cascade, the **AC bodies are the working reference** here; intent was consulted
only to date the ledger and to confirm nothing was retired.

**The single cause of both violations**: the AC-level fix loop sharpened AC-1428
and AC-1433 earlier today (`updated_at` 03:37:57 and 03:38:01, 2026-09-10),
adding a *permissive complement* to each. The UAT file was authored on
2026-08-31 (`b70bafc8b6`, `reconciliation_uat_generation_prompt`) and has not
been touched since. The eight ACs that were **not** edited today all still carry
`updated_at` 2026-08-31T12:33 — the same batch that produced the tests — and all
eight are aligned. The drift is exactly the two ACs the fix loop moved.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-151 (`request-4fcbd354`) — Site locale identity, and rendered `lang`/`dir` | free_and_reconciled | created 2026-08-20; reconciled 2026-08-31 | The four optional config fields, the `COUNTRY_DEFAULTS` derivation table, both renderers emitting `lang`/`dir` from one resolution, `BehaviorProps.locale`, refusal-with-path over silent fallback, undeclared → region-free `en` | YES |
| REQ-153 (`request-94e93caa`) — Reserve locale-shaped page slugs | free_and_reconciled | created 2026-08-20; reconciled 2026-08-31 | Whole-registry ISO 639-1 match, anchored + case-insensitive, numeric region reserved / four-letter script subtag not, self-justifying refusal with two alternatives | YES |
| BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | `merged_at_commit eef7a8b4` | Carrier for both of the above; STORY-122's `intent_uid` | YES (carrier) |
| REQ-152 (`request-a03967f2`) — Money and time representation | free_and_reconciled | 2026-08-20 | The `intl.ts` formatting seam — a *consumer* of this capability | YES, but out of scope (story and capability both exclude formatting) |
| REQ-7 (`request-9b70eeca`) — D1 schema … slug validation | abandoned | 2026-06-30 | Proposed a different home for slug validation | NO — retired, and cited by nothing in this tree |

No later intent retires or amends any of the above. Step 2.5 was not reached: no
AC or test names a ticket as the delivery vehicle for a behaviour.

## Alignment Ledger

Verified this turn: `npm test -- tests/reconciliation-site-locale-identity.test.ts`
→ **10 passed / 10**, 591ms. Every UAT below is live, green evidence exercising
real components (`validateSite`, `resolveSiteLocale`, `renderSiteFiles`,
`renderL1Page`, `loadSite`, `readHistory`, `editPageAdd`) with no internal
mocking. The one injected double — `echoLocaleResolver` — stands in for a
behavior module that does not exist yet and is the smallest thing that can
observe the seam under test; that is a legitimate test double, not internal
mocking.

| Element (test) | AC | Outcome |
|---|---|---|
| `test_UAT_AC1428_undeclared_locale_renders_region_free_en_and_stored_sites_still_validate` (`tests/reconciliation-site-locale-identity.test.ts:133`) | AC-1428 | **gap** — covers the rendered `en`/`ltr` half and the stored-sites half in full (drafts *and* every published revision, non-empty guard); does not cover the whole-resolution clause the AC gained at 03:37. Finding 1. |
| `test_UAT_AC1429_country_alone_derives_locale_currency_timezone_and_reaches_rendered_lang` (`:161`) | AC-1429 | aligned — IE resolution in full, rendered `lang="en-IE"`, GB compared against IE on currency and timezone with the shared language subtag |
| `test_UAT_AC1430_locale_currency_and_timezone_each_override_independently` (`:185`) | AC-1430 | aligned — all three configurations from the AC, plus the locale override read off the rendered artifact |
| `test_UAT_AC1431_both_render_paths_declare_the_same_lang_and_dir` (`:216`) | AC-1431 | aligned — the AC's four configurations, both paths rendered and compared, non-empty `lang` asserted |
| `test_UAT_AC1432_a_right_to_left_locale_renders_dir_rtl_decided_by_script_when_present` (`:231`) | AC-1432 | aligned on the Verification section; one criterion sentence uncovered (Finding 3) |
| `test_UAT_AC1433_a_bad_locale_field_is_a_validation_error_at_a_machine_readable_path` (`:245`) | AC-1433 | **gap** — all nine refusal cases with paths, each paired with its corrected value *and* the field-removed control; the permissive side the AC gained at 03:38 is absent entirely. Finding 2. |
| `test_UAT_AC1434_a_behavior_module_is_handed_the_resolved_locale_identity` (`:278`) | AC-1434 | aligned — asserts the exact five-field object and that the emitted `EUR` reached `index.html` |
| `test_UAT_AC1435_every_country_row_is_valid_config_and_resolves_back_to_itself` (`:309`) | AC-1435 | aligned — enumerates the table, validates each row as site config, resolves each back, asserts `IE`/`GB`/`US` present |
| `test_UAT_AC1436_a_locale_shaped_slug_is_refused_with_a_reason_and_two_alternatives` (`:334`) | AC-1436 | aligned — all six reserved forms plus both case variants at `/pages/0/slug` with slug, reason and both alternatives in the message; then the authoring surface (`editPageAdd`) with `SCHEMA_INVALID`, `/pages/1/slug`, the no-half-written-page re-read, and the successful qualified-slug retry |
| `test_UAT_AC1437_slugs_that_resemble_or_extend_a_language_code_still_validate` (`:387`) | AC-1437 | aligned — the AC's fourteen slugs verbatim, plus the stored sites' own page slugs discovered at verification time with a non-empty guard |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | `test_UAT_AC1428_…` (`tests/reconciliation-site-locale-identity.test.ts:139-140`) | uat-edit | AC-1428's Verification (edited 2026-09-10T03:37:57) requires resolving an empty declaration and observing **"the whole resolution, not just its language"** — country `US`, currency `USD`, timezone `America/New_York` alongside the region-free `en` — and requires asserting the locale is **not** `en-US` "so the two halves are pinned as different behaviours rather than as one". The test asserts only `resolveSiteLocale({}).locale`, which is precisely the "just its language" shape the AC now names as insufficient. A regression giving the undeclared site `en-US`, or dropping currency/timezone to undefined, would not fail this UAT. | Extend the test after line 140 with the full-object assertion and the negative. The exact assertions already exist verbatim at `tests/test_UAT_FC_REQ-151_site_locale.test.ts:143-156` (`toEqual({country: DEFAULT_COUNTRY, locale: UNDECLARED_LOCALE, currency: …, timezone: …, dir: 'ltr'})`, the `toMatchObject({country:'US',currency:'USD',timezone:'America/New_York'})` literal restatement, and `.not.toBe(COUNTRY_DEFAULTS[DEFAULT_COUNTRY].locale)`) — lift them, adding `DEFAULT_COUNTRY` to the import at line 5-11. |
| 2 | violation | consistency | `test_UAT_AC1433_…` (`tests/reconciliation-site-locale-identity.test.ts:245-276`) | uat-edit | AC-1433's Criterion and Verification (edited 2026-09-10T03:38:01) make the permissive side **part of the criterion**: "a well-formed BCP 47 tag whose language subtag the platform does not recognise **validates** and resolves", verified by validating a locale outside any registry the platform consults "with and without a region" and observing that resolution returns the declared tag unchanged, "so the refusal list above is a boundary rather than an allowlist, and a later tightening to registry membership fails this criterion". The test contains no such case — it asserts only the nine refusals and their corrected counterparts. The exact tightening the AC was edited to forbid would pass this UAT. | Add a loop after line 275 over well-formed unregistered tags with and without a region, asserting `validateSite(siteJson({locale})).ok === true` and `resolveSiteLocale({locale}).locale === locale`. Already written at `tests/test_UAT_FC_REQ-151_site_locale.test.ts:283-296` over `['qz','qz-IE','zxx','tlh-Latn-US']` — lift it. |
| 3 | warning | coverage | `test_UAT_AC1432_…` (`tests/reconciliation-site-locale-identity.test.ts:240-242`) | uat-edit | AC-1432's Criterion states "An unrecognised locale is left-to-right, which is both the overwhelming majority and what a browser assumes anyway." No assertion anywhere exercises it. The AC's own Verification section does not ask for it, which is why this is a warning and not a violation — but it is a criterion sentence with zero evidence, and the fix is one line. | Add `expect(localeDirection('qz-XX')).toBe('ltr')` (or similar unrecognised tag) beside the existing `localeDirection` assertions at line 240-242. |
| 4 | info | exclusivity | `tests/reconciliation-site-locale-identity.test.ts` vs `tests/test_UAT_FC_REQ-151_site_locale.test.ts` + `tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts` | — | The AC-named file is a near 1:1 re-derivation of the two intent-era FC files — same helpers, the same `echoLocaleResolver` verbatim, the same case tables — eight duplicated scenarios in the same shape. Under a strict reading this is redundant evidence, but it is the repo's standing pattern (121 `reconciliation-*.test.ts` files coexist with 52 `test_UAT_FC_*.test.ts` files), and the two serve different traceability chains: FC tests trace to REQ-151/REQ-153, AC-named tests are the matrix evidence. Recorded, not raised. Note the irony this check turns on: the FC files hold the two assertions Findings 1 and 2 say are missing — the duplication is what makes the repair a copy rather than an authoring job. | none |
| 5 | info | consistency | all ten UATs | — | Executed this turn, not inferred: `npm test -- tests/reconciliation-site-locale-identity.test.ts` → 10 passed / 10. Evidence is live and green against the landed implementation. | none |

## Notes for the Editor

- **Both violations are additive `uat-edit`s, and neither requires new thinking.**
  The assertions the two ACs now demand are already written, tested and passing
  in `tests/test_UAT_FC_REQ-151_site_locale.test.ts`. The repair is to lift them
  into the AC-named tests so the *matrix evidence* carries the claim, rather than
  leaving it to a file that traces to the intent instead of the AC. Do not delete
  the FC tests to "resolve" the duplication in Finding 4 — that would remove the
  only coverage these two clauses currently have anywhere.

- **Nothing here is a `code-issue`.** Every behaviour the two edited ACs now
  demand is implemented and demonstrably correct: the FC tests exercise exactly
  those paths and pass. The defect is in the evidence, not the code.

- **Do not touch the eight aligned UATs.** They match their ACs sentence for
  sentence, including the deliberate details — the field-removed control in
  AC-1433's refusal loop, the published-revision walk in AC-1428's stored-sites
  half, the non-empty guards in AC-1428/AC-1437 that stop the criteria passing
  vacuously, and AC-1437 reading stored slugs at verification time rather than
  naming them.

- **Cascade note for whoever runs this check next.** Both violations exist only
  because an AC was edited after its UAT was generated. There is no mechanism in
  the pipeline that re-runs UAT generation when the `ac`-level fix loop edits an
  AC body, so this shape — `ac` passes on attempt 2, `uat` then fails on the two
  ACs attempt 2 touched — should be expected any time the AC fix loop fires, and
  is diagnosable from `updated_at` alone.
