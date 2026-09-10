---
uid: report-a169f749
id: REPORT-3650
type: report
title: 'Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And
  What The Page Declares (level=ac)'
created_by: xgd
created_at: '2026-09-10T03:36:37.131395+00:00'
updated_at: '2026-09-10T03:36:37.131395+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-bcbcdaf1
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And What The Page Declares
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability has exactly one story (STORY-122), whose `intent_uid` is
`bundle-b3b7c399` (BUNDLE-20). No standalone `REQ-151` / `REQ-152` / `REQ-153`
tickets exist in the store — those requirements were absorbed into the bundle and
survive only as sections of its body. No AC under STORY-122 carries an
`intent_uid` or `updated_by` of its own, so the bundle is the whole ledger.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-20 (`bundle-b3b7c399`), merged at `eef7a8b4` | free_and_reconciled | created 2026-08-24, completed 2026-08-31 | Carries REQ-147/143/145/146/148/149/150/151/152/153 | YES |
| └ REQ-151 (bundle §"Site locale identity, and rendered lang/dir") | — (in bundle) | 2026-08-31 | Four optional config fields; 66-country derivation table; both renderers emit `lang`/`dir`; resolved locale to behavior modules; validation errors at `/config/<field>`; the undeclared-vs-`US` resolution | YES |
| └ REQ-153 (bundle §"Reserve locale-shaped page slugs") | — (in bundle) | 2026-08-31 | `isLocaleShapedSlug` on `pageSchema.slug`; whole ISO 639-1 registry; case-insensitive, anchored whole; numeric region reserved, script subtag not; refusal message with two alternatives | YES |
| └ REQ-152 (bundle §"Money and time representation") | — (in bundle) | 2026-08-31 | The `intl.ts` formatting seam — a *consumer* of this capability | YES, but out of this capability's scope (story and capability both exclude formatting) |

Because the ledger is a single reconciled bundle with no later intent retiring
anything, cumulative intent is simply REQ-151 + REQ-153 as written. Nothing in
the AC tree describes retired behaviour, and nothing in the bundle asks for
behaviour the capability's story omits. Per the level cascade, STORY-122's body
was the working reference; the bundle was consulted only to confirm the two
places below.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1428 — undeclared site renders region-free language; every stored site validates | REQ-151 AC-1, REQ-153 AC-3 (folded in per STORY-122's reconciliation decision) | **gap**: covers only the *language* half of the undeclared resolution; the story's stated currency/timezone half is unpinned (finding 1) |
| AC-1429 — country alone derives locale/currency/timezone and reaches rendered `lang` | REQ-151 AC-2 | aligned (IE/GB values match `COUNTRY_DEFAULTS` rows at `packages/site-schema/src/locale.ts:61,65`) |
| AC-1430 — each field overrides independently | REQ-151 AC-3 | aligned |
| AC-1431 — both render paths agree on `lang`/`dir` | REQ-151 AC-4 | aligned; correctly requires agreement observed in two rendered artifacts, not inferred from a shared implementation |
| AC-1432 — RTL renders `dir="rtl"`, decided by script subtag when present | REQ-151 AC-5 | aligned (IL→`he-IL`, AE→`ar-AE` match `locale.ts:98,100`) |
| AC-1433 — bad locale field is a validation error at a machine-readable path | REQ-151 AC-6 | aligned on the refusal side; the complementary "well-formed but unregistered language tag validates" line the story draws is unpinned (finding 2) |
| AC-1434 — behavior module handed the resolved locale identity | REQ-151 AC-7 | aligned (the exact object asserted matches the `IE` row) |
| AC-1435 — every derivation-table row is valid site config and resolves back to itself | REQ-151 (formalised at reconciliation 2026-08-31; REQ-151's own ACs are silent on the platform's table) | aligned; the reconciliation decision in STORY-122 authorises this AC explicitly |
| AC-1436 — locale-shaped slug refused at the authoring surface, with reason and two alternatives | REQ-153 AC-1 + its test plan's authoring-entry-point assertion (formalised at reconciliation) | aligned |
| AC-1437 — near-miss slugs still validate | REQ-153 AC-2 (+ AC-3 residue) | aligned; minor overlap with AC-1428 noted as info (finding 3) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1428 | ac-edit | STORY-122's Description states an affirmative behaviour no AC pins: *"Currency and timezone take no such care, because there is no region-free currency and no region-free clock — the default country answers for them or nothing does."* AC-1428 is the undeclared-site AC and asserts only the language half (`lang="en"`, `dir="ltr"`, and that the resolution "reports that same region-free language"). Nothing in the AC tree states what an undeclared site's `country`, `currency` or `timezone` resolve to. The behaviour is real — `resolveSiteLocale({})` at `packages/site-schema/src/locale.ts:267-281` returns `country: 'US'`, `currency: 'USD'`, `timezone: 'America/New_York'` via `DEFAULT_COUNTRY` — and it is the deliberate *asymmetry* the story and REQ-151's "the undeclared default" section both single out as a decision. Left unstated it is also the most surprising part of the capability: the capability body's "an unstated fact stays unstated" property predicts an unstated country, and the code reports `US`. The cascade is visible at the uat level too: `tests/test_UAT_FC_REQ-151_site_locale.test.ts:126-134` asserts only `resolveSiteLocale({}).locale`. | Extend AC-1428's criterion and verification to state the whole undeclared resolution — the region-free language `en` *and* that country, currency and timezone fall to the default country's row (`US` / `USD` / `America/New_York`), naming why the two halves differ. An `ac-add` for a separate "undeclared currency and timezone" AC is an acceptable alternative shape, but AC-1428 already owns the undeclared site and splitting it would create two ACs about one configuration. |
| 2 | warning | coverage | AC-1433 | ac-edit | STORY-122's Technical Context draws an explicit line: *"Locale validation is well-formedness, not registry membership, for the language tag: an unrecognised language subtag is far more likely to be a real minority language than a typo."* AC-1433 pins only the refusal side of that line. No AC states that a well-formed tag whose language subtag is not in any registry **validates** — so the rule could silently tighten to registry membership (refusing a real minority-language site) with no AC failing. The contrast with the slug half of this same story is instructive: there the boundary is pinned from both sides, by AC-1436 (refused) and AC-1437 (near-misses validate). Implementation confirms the intended behaviour: `LANGUAGE_TAG` at `locale.ts:178-179` is pure shape-matching with a comment saying exactly this. | Add to AC-1433's criterion (and its verification) that a well-formed BCP 47 tag whose language subtag is unrecognised validates and resolves — the complement that makes the refusal list a boundary rather than a list. |
| 3 | info | exclusivity | AC-1428 + AC-1437 | — | Both ACs reach for the platform's stored sites: AC-1428 validates each stored site's draft and published revisions; AC-1437 closes with "the slugs the platform's existing stored sites already use validate". AC-1428 subsumes the latter — a stored site with a reserved slug would already fail AC-1428. They are not the same criterion (AC-1428 validates the definitions as they stand; AC-1437 isolates the slug matcher against real slugs in a fixture), and the redundancy is cheap and deliberate, so this is recorded rather than raised. | none |

## Notes for the Editor

- **Both findings are the same shape**: STORY-122 states a behaviour as a
  deliberate *decision* (the undeclared currency/timezone asymmetry; well-formedness
  over registry membership), and the AC tree pins the half that was easy to
  assert. Neither is drift between matrix and intent — the ACs that exist are
  accurate — they are gaps at the boundary of an otherwise well-covered surface.
  Repair is additive; no AC needs deprecating and no story body needs editing.

- **No consistency violations.** Every concrete value an AC asserts was checked
  against the landed derivation table (`packages/site-schema/src/locale.ts:46-131`):
  IE→`en-IE`/`EUR`/`Europe/Dublin`, GB→`en-GB`/`GBP`/`Europe/London`,
  US→`en-US`/`USD`/`America/New_York`, IL→`he-IL`, AE→`ar-AE`. All match.

- **No `needs_review`.** Step 2.5 was not reached: no story or AC text names a
  ticket as a delivery vehicle for behaviour, and the single intent in the ledger
  is `free_and_reconciled` with nothing abandoned or superseded downstream of it.

- **The three reconciliation decisions in STORY-122 all landed correctly** as
  AC-1435, AC-1436 and the second paragraph of AC-1428. Each goes beyond the
  literal REQ text it derives from, and each is authorised by a named decision in
  the story body — worth knowing before a future check reads AC-1435 as
  unsupported by REQ-151's seven acceptance criteria, which it is, by design.

- **REQ-152 (the money/time formatting seam) is correctly absent** from this
  capability's AC tree. It sits in the same bundle and reads this capability's
  output, but both the capability body and STORY-122 place formatting out of
  scope. No coverage finding was raised for it.
