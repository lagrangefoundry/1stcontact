---
uid: report-7cc895e6
id: REPORT-3649
type: report
title: 'Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And
  What The Page Declares (level=story)'
created_by: xgd
created_at: '2026-09-10T03:32:43.687439+00:00'
updated_at: '2026-09-10T03:32:43.687439+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-bcbcdaf1
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And What The Page Declares
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 0.

## Cumulative Intent Considered

The capability ticket itself carries no `intent_uid`/`updated_by`. Its single
story (STORY-122) carries `intent_uid: bundle-b3b7c399` (BUNDLE-20), which is a
ten-member bundle; only two of its members touch this capability. Both were
resolved to their own `request` tickets and their statuses read independently.

A full sweep of all 157 `request` tickets and all 38 `bug` tickets for
locale/slug/lang/country/currency/timezone/RTL/direction keywords found no other
intent touching this capability's surface.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-7 (request-9b70eeca) | abandoned | created 2026-06-30 | Proposed D1 schema incl. slug validation | NO — abandoned |
| REQ-151 (request-4fcbd354) | free_and_reconciled | created 2026-08-20, completed 2026-08-31 | Four optional `siteConfigSchema` fields (`country`/`locale`/`currency`/`timezone`); country→(locale,currency,timezone) derivation table; both renderers emit `lang`/`dir` from one resolution; resolved locale reaches behavior modules as `BehaviorProps.locale`; undeclared resolves to region-free `en`; invalid field is a validation error at `/config/<field>`. 7 ACs. | YES |
| REQ-152 (request-a03967f2) | free_and_reconciled | created 2026-08-20, completed 2026-08-31 | Money/time formatting seam (`packages/framework/src/intl.ts`) + render-determinism resolution | Out of capability — landed under CAP-105 / STORY-123, which this capability's "Not in scope" explicitly cedes. No overlap. |
| REQ-153 (request-94e93caa) | free_and_reconciled | created 2026-08-20, completed 2026-08-31 | `pageSchema.slug` `superRefine` reserving slugs that are *exactly* a locale segment; ISO 639-1 registry as data; numeric region reserved, four-letter script subtag deliberately not; refusal message carries reason + two alternatives. 3 ACs. | YES |
| BUNDLE-20 (bundle-b3b7c399) | free_and_reconciled | completed 2026-08-31, main `eef7a8b4` | Reconciliation vehicle carrying REQ-151/152/153 (+7 unrelated) | YES (vehicle) |

Chronologically REQ-151 and REQ-153 were created on the same day and reconciled
in the same bundle, so there is no supersession sequence to walk: the cumulative
intent for this capability is simply REQ-151 ∪ REQ-153. No behavior asked for by
either has been retired by a later intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-104 (capability-bcbcdaf1) | REQ-151, REQ-153 | aligned — every in-scope clause of the capability body maps to behavior one of the two intents asked for; the "Not in scope" cession of money/time formatting matches the separate CAP-105 (STORY-123, REQ-152), so the capability boundary is clean rather than merely asserted |
| STORY-122 (story-17ba490e), `story_kind: feature`, status `completed` | REQ-151, REQ-153 | aligned, with one warning (Finding 1). All 7 REQ-151 ACs and all 3 REQ-153 ACs are expressed in the story body and land on ACs AC-1428…AC-1437. Three explicitly recorded Reconciliation Decisions (AC-1435 derivation-table validation, AC-1436 slug refusal stated at the authoring boundary, AC-1428 no-regression widened to published revisions) are each traceable to a named intent gap and each is a *widening* of intent by landed evidence, not an invention. |

### Story-level coverage map (cumulative intent → story body)

| Intent ask | Expressed in STORY-122? | Landed AC |
|---|---|---|
| REQ-151 AC-1 undeclared site renders as before, no regression | yes — "resolves to the region-free language… byte-identical to the literal it replaced" | AC-1428 |
| REQ-151 AC-2 `country: IE` derives locale/currency/timezone | yes | AC-1429 |
| REQ-151 AC-3 each field overrides independently | yes — "each derived value individually overridable" | AC-1430 |
| REQ-151 AC-4 both render paths agree | yes — "Both of the platform's render paths emit… from that one resolution" | AC-1431 |
| REQ-151 AC-5 RTL renders `dir="rtl"` | yes — incl. the script-subtag-before-language rule | AC-1432 |
| REQ-151 AC-6 invalid field → error at machine-readable path | yes — "never a silent fall back to one country's defaults" | AC-1433 |
| REQ-151 AC-7 resolved locale reaches a behavior module | yes | AC-1434 |
| (reconciliation decision) derivation table held to site validation | yes — Reconciliation Decisions §1 | AC-1435 |
| REQ-153 AC-1 exact locale segment refused, actionable message | yes | AC-1436 |
| REQ-153 AC-2 `design`/`deals`/`delivery` still validate | yes — "anchored whole" | AC-1437 |
| REQ-153 AC-3 both existing sites still validate | yes — Reconciliation Decisions §3, widened to every stored site's draft *and every published revision* | folded into AC-1428 |

No intent ask is unexpressed. No story text describes behavior no intent
supports. Exclusivity is vacuously satisfied: the capability has exactly one
story, and the neighbouring CAP-105 covers the disjoint REQ-152 surface.

## Implementation checks performed (chain of authority, tier 3)

The story body's Technical Context makes several claims the intent bodies do not
state. Each was verified against the landed code rather than escalated:

| Story claim | Verified |
|---|---|
| "Locale validation is well-formedness, not registry membership, for the language tag" | `isWellFormedLocale` (`packages/site-schema/src/locale.ts:193`); schema message "well-formed BCP 47 language tag" (`schema.ts:946`). Contrast `isSupportedCountry` (`locale.ts:188`) which *does* require table membership — the asymmetry the story describes is real. |
| "A timezone is checked against the runtime's own tz database rather than a pattern or a checked-in list" | `isKnownTimezone` constructs `new Intl.DateTimeFormat('en-US', { timeZone: value })` (`locale.ts:210-212`). |
| "Both of the platform's render paths emit the document's language and text direction from that one resolution" | `packages/framework/src/l1/render.ts:2505-2507` and `tools/generate/src/render/render.ts:153,208` both call `resolveSiteLocale`. |
| "Direction… decided by the script subtag when the locale carries one and by the language subtag otherwise" | `localeDirection` (`locale.ts:226-230`). |
| "The resolved locale identity reaches behavior modules as part of their render input" | `BehaviorProps.locale?: ResolvedLocale` (`packages/framework/src/modules/behavior.ts:183`), populated by `renderModuleInstances` → `Component({ …, locale })` (`tools/generate/src/render/render.ts:103-126`). |
| "anchored whole and case-insensitive… numeric region form reserved and the four-letter script subtag deliberately not" | `LOCALE_SHAPED = /^([a-z]{2})(?:-(?:[a-z]{2}\|[0-9]{3}))?$/` over `slug.toLowerCase()`, gated on `ISO_639_1_LANGUAGES` membership (`locale.ts:337-351`). |
| "The refusal names why the slug is refused and offers two working alternatives" | `localeShapedSlugMessage` (`locale.ts:362-370`) — names the collision and emits `<slug>-services` / `about-<slug>`. |
| "The slug reservation sits on the page's slug field" | `pageSchema.slug` `superRefine` (`packages/site-schema/src/schema.ts:560-562`), so the issue path is `/pages/N/slug` by construction and every `validateSite` writer inherits it. |
| "consumed by the Money & Time Formatting Seam (plan item 11)" | Resolves correctly — the reconciliation plan (report-12841fa2:919) numbers "Money & Time Formatting Seam" as item 11, and `intl.ts` does not import `resolveSiteLocale`, so it genuinely does not re-derive. |
| "a platform derivation table covering **66** countries" | **Does not verify — 65.** See Finding 1. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-122 (story-17ba490e), body line 32 | story-body-edit | Story body states the derivation table covers "66 countries". `COUNTRY_DEFAULTS` (`packages/site-schema/src/locale.ts:46-131`) has **65** rows: Europe 34, Americas 6, Africa & Middle East 10, Asia & Pacific 15. The number is not invented by the story — REQ-151's own implementation record (free_and_reconciled) says "66 countries", and the story copied it faithfully; the off-by-one originates in the intent prose and was never checked against the table, because no test asserts a count (`test_UAT_FC_REQ-151_site_locale.test.ts:306` asserts only `arrayContaining(['IE','GB','US'])`; `reconciliation-site-locale-identity.test.ts:316` asserts only `length > 0`). Per the chain of authority the implementation settles the disagreement. | Drop the hard count from the story body — e.g. "a platform derivation table covering the EU, North America, Latin America, Africa/Middle East and Asia-Pacific, including the RTL locales". A literal count is inherently drift-prone in a story whose own text says "adding a country is a data edit — one row in the derivation table", so re-stating it as "65" would only reset the clock on the same defect. |

## Notes for the Editor

- **Do not "fix" this by adding a 66th country.** Finding 1 is a prose defect, not
  a coverage gap. The table's contents are exactly what REQ-151 enumerated by
  region; only the arithmetic in the summary sentence is wrong.

- **Forward note for the `uat` level of this cycle (not a story-level finding).**
  Two test files cover this capability's surface with substantial overlap:
  `tests/test_UAT_FC_REQ-151_site_locale.test.ts` (9 UATs, the original
  free-coded evidence, named `test_UAT_FC_REQ-151_*`) and
  `tests/reconciliation-site-locale-identity.test.ts` (10 UATs named
  `test_UAT_AC1428`…`test_UAT_AC1437`, the matrix-linked set). They assert the
  same scenarios in the same shape — undeclared→`en`, `IE` derivation,
  independent overrides, both-render-path parity, RTL, the nine bad inputs, the
  behavior-module hand-off, and the country-table self-consistency. Only the
  reconciliation file is AC-addressable under the `test_UAT_AC{number}_` naming
  convention. This is worth an exclusivity judgment at `uat` level; it is
  deliberately *not* raised as a story-level finding here, and it is not
  obviously wrong — the FC file is the historical free-coded evidence REQ-151
  cites by name in its own body, so deleting it would orphan that citation.

- **The three Reconciliation Decisions in the story body are load-bearing and
  should survive any edit.** Each records a place where the landed code and its
  tests are *stronger* than the stated ACs (the derivation table validated as
  site config; the slug guard asserted at `editPageAdd` rather than only at the
  schema; no-regression widened from "both existing sites" to every stored
  site's draft and every published revision, with a non-vacuity assertion). All
  three were verified against the code and tests above. Removing them would
  reintroduce exactly the drift this check exists to detect.

- **No intent/code contradiction was found**, and the one the story body flags —
  REQ-151's "what to change" defaulting `country` to `US` versus its AC-1 asking
  for `en` when nothing is declared — is genuinely resolved rather than papered
  over: `resolveSiteLocale` (`locale.ts:267-282`) keys the locale off `declared`
  and the currency/timezone off `country`, so a declared `US` derives `en-US`
  while an undeclared site gets `UNDECLARED_LOCALE` (`en`) with US currency and
  clock. Both readings hold simultaneously.
