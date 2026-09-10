---
uid: report-9f85eb0e
id: REPORT-3652
type: report
title: 'Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And
  What The Page Declares (level=ac)'
created_by: xgd
created_at: '2026-09-10T03:43:43.614138+00:00'
updated_at: '2026-09-10T03:43:43.614138+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-bcbcdaf1
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And What The Page Declares
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

This is attempt 2. Attempt 1 (REPORT-3650) raised one violation and one warning,
both `ac-edit` coverage gaps. Both were re-read from current ticket state rather
than assumed fixed, and both are now closed — see *Prior-Attempt Disposition*
below.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-151 — Site locale identity, and rendered `lang`/`dir` | free_and_reconciled | created 2026-08-20; reconciled 2026-08-31 | Four optional `siteConfigSchema` fields (`country`/`locale`/`currency`/`timezone`); the 66-row `COUNTRY_DEFAULTS` derivation table; both renderers emitting `lang`/`dir` from one resolution; `BehaviorProps.locale`; refusal-with-path over silent fallback; the undeclared-site → region-free `en` decision | YES |
| REQ-153 — Reserve locale-shaped page slugs | free_and_reconciled | created 2026-08-20; reconciled 2026-08-31 | `ISO_639_1_LANGUAGES` as whole-registry data; `isLocaleShapedSlug` anchored + case-insensitive; numeric region reserved, four-letter script subtag deliberately not; the self-justifying refusal message with two alternatives | YES |
| BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | merged_at_commit `eef7a8b4` | The carrier for both of the above; STORY-122's `intent_uid` | YES (carrier) |
| REQ-152 — Money and time representation | free_and_reconciled | created 2026-08-20 | The `intl.ts` formatting seam — a *consumer* of this capability | YES, but out of scope (capability and story both exclude formatting) |
| REQ-7 — D1 schema … slug validation | abandoned | 2026-06-30 | Proposed a different slug-validation home | NO — retired |

A `--type request` sweep for locale/lang/slug/country/currency/timezone/direction
titles returns exactly these; no later intent retires or amends anything above.
Cumulative intent is therefore REQ-151 + REQ-153 as written.

Per the level cascade, STORY-122's body is the working reference — the story-level
cycle passed at REPORT-3649 (2026-09-10). The intents were consulted only to
confirm the reconciliation decisions and the retired/abandoned column.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1428 — undeclared site renders region-free language; every stored site validates | REQ-151 AC-1; REQ-153 AC-3 (folded in per STORY-122 reconciliation decision 3) | aligned — now states **both** halves of the undeclared resolution (region-free `en` *and* the default country's `US`/`USD`/`America/New_York`), and pins them as different behaviours by asserting the locale is *not* `en-US` |
| AC-1429 — country alone derives locale/currency/timezone and reaches rendered `lang` | REQ-151 AC-2 | aligned — IE and GB rows verified at `packages/site-schema/src/locale.ts:65,61` |
| AC-1430 — each field overrides independently | REQ-151 AC-3 | aligned — the declared-`US`→`en-US` case is consistent with `resolveSiteLocale`'s declared-vs-undeclared split (`locale.ts:269-273`) |
| AC-1431 — both render paths agree on `lang`/`dir` | REQ-151 AC-4 | aligned — correctly requires agreement observed in two rendered artifacts, not inferred from a shared implementation |
| AC-1432 — RTL renders `dir="rtl"`, decided by script subtag when present | REQ-151 AC-5 | aligned — IL→`he-IL`, AE→`ar-AE` (`locale.ts:100,98`); `az-Arab`/`az-Latn` opposition verified against `RTL_SCRIPTS` (`locale.ts:160-162`), which is checked before `RTL_LANGUAGES` |
| AC-1433 — bad locale field is a validation error at a machine-readable path | REQ-151 AC-6 | aligned — now pins the boundary from **both** sides: the five refusal classes, and that a well-formed tag with an unrecognised language subtag validates and resolves unchanged |
| AC-1434 — behavior module handed the resolved locale identity | REQ-151 AC-7 | aligned — the asserted object is exactly `ResolvedLocale` (`locale.ts:245-253`) and its values are the `IE` row |
| AC-1435 — every derivation-table row is valid site config and resolves back to itself | REQ-151 (formalised at reconciliation 2026-08-31; REQ-151's own ACs are silent on the platform's table) | aligned — authorised by STORY-122 reconciliation decision 1 |
| AC-1436 — locale-shaped slug refused at the authoring surface, with reason and two alternatives | REQ-153 AC-1 + test-plan authoring assertion (formalised at reconciliation decision 2) | aligned — `es-419` reserved and case-insensitivity both follow from `LOCALE_SHAPED` (`locale.ts:336`); the two alternatives match `localeShapedSlugMessage` (`locale.ts:368`) |
| AC-1437 — near-miss slugs still validate | REQ-153 AC-2 (+ AC-3 residue) | aligned — `zz`/`qq` confirmed absent from `ISO_639_1_LANGUAGES`; `zh-Hans`/`de-luxe`/`pt-brazil` all fall outside `LOCALE_SHAPED`'s two-letter-or-three-digit tail |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-1428 | — | Attempt 1's violation is closed. AC-1428's criterion now carries the undeclared resolution in full — "resolves country `US`, currency `USD` and timezone `America/New_York` … while its locale remains the region-free `en`" — with the asymmetry's reason stated, and its verification requires observing "the whole resolution, not just its language" plus an explicit assertion that the locale is *not* `en-US`. Matches `resolveSiteLocale` at `packages/site-schema/src/locale.ts:269-281`. | none |
| 2 | info | coverage | AC-1433 | — | Attempt 1's warning is closed. AC-1433 now states "The locale field's boundary is well-formedness, not registry membership" and requires a well-formed tag with an unrecognised language subtag (with and without a region) to validate and round-trip unchanged, explicitly so "a later tightening to registry membership fails this criterion". Matches the pure-shape `LANGUAGE_TAG` at `locale.ts:178-179`. | none |
| 3 | info | exclusivity | AC-1428 + AC-1437 | — | Both reach for the platform's stored sites: AC-1428 validates each stored site's draft and every published revision; AC-1437 folds the stored sites' slugs into its validating-slug list. Not the same criterion — AC-1428 validates whole definitions, AC-1437 isolates the slug matcher against real slugs — and the redundancy is cheap and deliberate. Recorded, not raised. | none |
| 4 | info | exclusivity | AC-1429 + AC-1435 | — | AC-1435's per-row "resolve the country alone and compare against the row" mathematically subsumes AC-1429's IE/GB resolution assertions. They remain distinct criteria: AC-1435 is about the platform's own data being valid at the moment a row is added, AC-1429 is about a declared country reaching the rendered `lang` attribute — which AC-1435 does not render. Different questions, and REQ-151 AC-2 and reconciliation decision 1 authorise them separately. | none |

## Prior-Attempt Disposition

| Attempt-1 finding | Severity then | State now |
|---|---|---|
| AC-1428 pinned only the language half of the undeclared resolution | violation | **closed** — AC-1428 `updated_at` 2026-09-10T03:37; second criterion paragraph and the extended verification both landed |
| AC-1433 pinned only the refusal side of the well-formedness boundary | warning | **closed** — AC-1433 `updated_at` 2026-09-10T03:38; the permissive complement and its verification both landed |
| AC-1428/AC-1437 stored-sites overlap | info | unchanged, still info (finding 3) |

Both repairs were additive `ac-edit`s, as the attempt-1 report prescribed. No AC
was deprecated, no story body was edited, and no AC lost coverage in the process
— all ten ACs were re-read in full at this attempt, not just the two touched.

## Notes for the Editor

- **Every concrete value asserted anywhere in the AC tree was re-checked against
  the landed implementation**, not carried over from the attempt-1 report:
  IE→`en-IE`/`EUR`/`Europe/Dublin`, GB→`en-GB`/`GBP`/`Europe/London`,
  US→`en-US`/`USD`/`America/New_York`, IL→`he-IL`, AE→`ar-AE`, `DEFAULT_COUNTRY`
  `US`, `UNDECLARED_LOCALE` `en`, the `ResolvedLocale` field set, the two slug
  alternatives, `es-419` reserved, `zh-Hans`/`zz`/`qq` not. All match.

- **`story_kind` is `feature`**, so the "every story has ACs" coverage check
  applies and is satisfied — STORY-122 is the capability's only story and carries
  all ten ACs.

- **No `needs_review`.** Step 2.5 was not reached: no story or AC text names a
  ticket as the delivery vehicle for a behaviour, and the only abandoned intent in
  the neighbourhood (REQ-7) is cited by nothing in this tree.

- **Two places where the AC tree deliberately under-specifies, and should stay
  that way.** STORY-122 says the table covers 66 countries and that the slug guard
  reaches the CLI, the AI toolbox and the store loader alike. AC-1435 enumerates
  the table rather than pinning the count, and AC-1436 asserts one authoring entry
  point rather than three. Both are correct: a pinned count breaks on the next
  one-row data edit that the story explicitly calls cheap, and the three-writer
  reach is an implementation rationale for putting the refinement on the field —
  reconciliation decision 2 already chose the authoring boundary as the stated
  surface. A future check should not read either as a coverage gap.

- **The three reconciliation decisions in STORY-122 all remain correctly landed**
  as AC-1435, AC-1436 and AC-1428's stored-sites paragraph. Each goes beyond the
  literal REQ text it derives from and each is authorised by a named decision in
  the story body — worth knowing before a future check reads AC-1435 as
  unsupported by REQ-151's seven acceptance criteria, which it is, by design.
