---
uid: comment-1325c3ce
id: COMMENT-2450
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T03:39:22.649367+00:00'
updated_at: '2026-09-10T03:39:22.649367+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8543c507
  kind: note
---

Done — both findings resolved, 4 mutations, report REPORT-3651 (`report-8543c507`) filed.

**What I changed**

Both findings were the same shape the assessor described: STORY-122 states a behaviour as a deliberate *decision*, and the AC tree pinned only the half that was easy to assert. Both repairs were additive `ac-edit`s — nothing deprecated, no story body edited, no production code touched.

| # | Category | Element | Change |
|---|---|---|---|
| 1 | ac-edit | AC-1428 | Criterion + verification now state the whole undeclared resolution: region-free `en` **and** country/currency/timezone falling to the default row (`US`/`USD`/`America/New_York`), with the reason the halves differ. Verification asserts the locale is *not* `en-US`, pinning the asymmetry as two behaviours. |
| 2 | ac-edit | AC-1433 | Added the permissive complement — a well-formed BCP 47 tag with an unrecognised language subtag validates and resolves — while keeping the country/currency contrast explicit. The refusal list is now a boundary, not an allowlist. |
| 3 | uat-edit | `..._a_site_declaring_no_locale_renders_exactly_as_before` | Was asserting only `resolveSiteLocale({}).locale` (the exact cascade flagged at the uat level); now asserts the full resolved object. |
| 4 | uat-add | `..._an_unregistered_but_well_formed_language_tag_validates` | New: `qz`, `qz-IE`, `zxx`, `tlh-Latn-US` each pass `validateSite` and survive resolution unchanged. |

**Verification.** `npm test -- tests/test_UAT_FC_REQ-151_site_locale.test.ts` → 10 passed (was 9). No regressions. The wrangler `EPERM` log lines are sandbox noise, not failures.

Every value I wrote into the ACs I read off the implementation first rather than trusting the report: `DEFAULT_COUNTRY = 'US'` (locale.ts:133), `UNDECLARED_LOCALE = 'en'` (:150), `resolveSiteLocale` keying the locale off `declared` rather than `country` (:267-281) — which is the asymmetry itself — and `LANGUAGE_TAG` as pure shape-matching (:170-179).

I left `uat_coverage` alone on both ACs; that field belongs to `check`/`fix_uat_coverage`, and setting it here would manufacture progress this prompt doesn't own. Declared `needs_more_work: false, progress_made: true` — the assessor verifies next. No `needs_review` items to forward.
