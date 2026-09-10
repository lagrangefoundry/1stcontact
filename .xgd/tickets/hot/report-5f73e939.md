---
uid: report-5f73e939
id: REPORT-3655
type: report
title: 'Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And
  What The Page Declares (level=uat)'
created_by: xgd
created_at: '2026-09-10T03:57:01.120256+00:00'
updated_at: '2026-09-10T03:57:01.120256+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-bcbcdaf1
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Locale Identity: Where A Business Is, And What The Page Declares
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

This is attempt 2 at the `uat` level. Attempt 1 (REPORT-3653) failed with 2
violations and 1 warning; the fix loop landed `be9df43d1f` ("Workflow
fix_uat_validation completed", 2026-09-10T03:51:25Z) against
`tests/reconciliation-site-locale-identity.test.ts`. All three findings are
verified repaired below, and the level was re-checked from scratch rather than
assumed from the fix report.

Per the level cascade, the **AC bodies are the working reference** here. The
`story` level passed at REPORT-3649 and the `ac` level at REPORT-3652; intent was
consulted only to date the ledger and to confirm nothing was retired. No AC was
edited after the fix commit (the two ACs the fix loop chased, AC-1428 and
AC-1433, carry `updated_at` 03:37:57 and 03:38:01 — both before 03:51:25), so the
repaired tests cannot have gone stale against a moving AC.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-151 (`request-4fcbd354`) — Site locale identity, and rendered `lang`/`dir` | free_and_reconciled | created 2026-08-20; completed 2026-08-31 | Four optional config fields; the `COUNTRY_DEFAULTS` derivation table; both renderers emitting `lang`/`dir` from one resolution; `BehaviorProps.locale`; refusal-with-path over silent fallback; undeclared → region-free `en` | YES |
| REQ-153 (`request-94e93caa`) — Reserve locale-shaped page slugs | free_and_reconciled | created 2026-08-20; completed 2026-08-31 | Whole-registry ISO 639-1 match, anchored and case-insensitive; numeric region reserved, four-letter script subtag deliberately not; self-justifying refusal carrying two alternatives | YES |
| BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | `merged_at_commit eef7a8b4` | Carrier for both of the above; STORY-122's `intent_uid` | YES (carrier) |
| REQ-152 — Money and time representation | free_and_reconciled | 2026-08-20 | The `intl.ts` formatting seam — a *consumer* of this capability | YES, but out of scope (story and capability both exclude formatting) |
| REQ-7 (`request-9b70eeca`) — D1 schema … slug validation | abandoned | 2026-06-30 | Proposed a different home for slug validation | NO — retired, cited by nothing in this tree |

A repo-wide sweep of ticket bodies for `resolveSiteLocale` / `COUNTRY_DEFAULTS` /
`site_locale_identity` returns no request ticket other than REQ-151 (plus REQ-153
for the slug half): no later intent retires or amends anything here. Step 2.5 was
not reached — no AC or test names a ticket as the delivery vehicle for a
behaviour.

## Alignment Ledger

Verified this turn, executed not inferred:
`npm test -- tests/reconciliation-site-locale-identity.test.ts` → **10 passed /
10**, 504ms. All ten UATs exercise real entry points (`validateSite`,
`resolveSiteLocale`, `localeDirection`, `renderSiteFiles`, `renderL1Page`,
`loadSite`, `readHistory`, `editPageAdd`, `editPageList`) with no internal
mocking. Ten ACs, ten AC-named UATs, one file, exactly one test per AC — checked
by grep, not by reading the file's own claims.

| Element (test, `tests/reconciliation-site-locale-identity.test.ts`) | AC | Outcome |
|---|---|---|
| `test_UAT_AC1428_undeclared_locale_renders_region_free_en_and_stored_sites_still_validate` (:134) | AC-1428 | aligned — **repaired**. The whole-resolution clause the AC gained at 03:37 is now asserted at :150-161 (`toEqual` over all five fields, plus the literal `US`/`USD`/`America/New_York` restatement), and the negative "not the default country's locale" at :164. The rendered `lang="en"`/`dir="ltr"` half (:140) and the stored-sites half — drafts *and* every published revision, behind a non-empty guard (:170-182) — are unchanged and still hold. Fixture confirmed genuinely undeclared: `starterSiteJson` (`tools/generate/src/cli/scaffold.ts:29-40`) carries only `businessName` and `tagline`. |
| `test_UAT_AC1429_country_alone_derives_locale_currency_timezone_and_reaches_rendered_lang` (:185) | AC-1429 | aligned — full IE resolution, rendered `lang="en-IE"`, GB compared against IE on currency and timezone with the shared language subtag. Matches the AC's Verification exactly. |
| `test_UAT_AC1430_locale_currency_and_timezone_each_override_independently` (:209) | AC-1430 | aligned — all three configurations from the AC (`IE`+`USD`, `US`+`America/Los_Angeles`, `IE`+`ga-IE`), plus the locale override read off the rendered artifact at :234. |
| `test_UAT_AC1431_both_render_paths_declare_the_same_lang_and_dir` (:240) | AC-1431 | aligned — the AC's four configurations, both paths actually rendered and compared, non-empty `lang` asserted per case. |
| `test_UAT_AC1432_a_right_to_left_locale_renders_dir_rtl_decided_by_script_when_present` (:255) | AC-1432 | aligned — **repaired**. `IL`→`he-IL`/`rtl` and `AE`→`ar-AE`/`rtl` off rendered artifacts; `az-Arab`/`az-Latn`/`en-IE` for the script-over-language rule; and the previously-unevidenced criterion sentence now covered by `localeDirection('qz-XX') === 'ltr'` at :271. |
| `test_UAT_AC1433_a_bad_locale_field_is_a_validation_error_at_a_machine_readable_path` (:274) | AC-1433 | aligned — **repaired**. The nine refusals with `/config/<field>` paths, each paired with its corrected value and the field-removed control (:280-304), and the permissive complement the AC gained at 03:38 now present at :312-316 over `qz`, `qz-IE`, `zxx`, `tlh-Latn-US` — with and without a region, asserting both `ok` and that resolution returns the tag unchanged. A later tightening to registry membership would now fail this UAT, which is what the AC clause exists to guarantee. |
| `test_UAT_AC1434_a_behavior_module_is_handed_the_resolved_locale_identity` (:319) | AC-1434 | aligned — asserts the exact five-field object handed to the module and that the emitted `EUR` reached `index.html`. See Finding 2 on the injected module. |
| `test_UAT_AC1435_every_country_row_is_valid_config_and_resolves_back_to_itself` (:350) | AC-1435 | aligned — enumerates every row of `COUNTRY_DEFAULTS` (65 as landed), validates each as site config, resolves each back to its row plus the direction its locale implies, and asserts `IE`/`GB`/`US` present. |
| `test_UAT_AC1436_a_locale_shaped_slug_is_refused_with_a_reason_and_two_alternatives` (:375) | AC-1436 | aligned — all four reserved forms plus both case variants (`de`, `fr`, `en`, `ga`, `pt-BR`, `es-419`, `pt-br`, `DE`) at `/pages/0/slug` with the slug, the locale reason and both alternatives in the message; then the authoring surface (`editPageAdd`) with `SCHEMA_INVALID`, `/pages/1/slug`, the no-half-written-page re-read, and the successful qualified-slug retry. |
| `test_UAT_AC1437_slugs_that_resemble_or_extend_a_language_code_still_validate` (:428) | AC-1437 | aligned — the AC's fourteen slugs verbatim, plus the stored sites' own page slugs discovered at verification time behind a non-empty guard. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | REPORT-3653 findings 1, 2 and 3 | — | All three verified repaired against the current file, not taken from the fix report: AC-1428's whole-resolution assertions at :150-164, AC-1433's permissive complement at :312-316, AC-1432's unrecognised-locale direction at :271. The fix commit (`be9df43d1f`, 03:51:25Z) postdates both AC edits (03:37:57, 03:38:01), so no repaired test is chasing a stale AC. | none |
| 2 | info | consistency | `echoLocaleResolver` (:115-131), AC-1434 | — | The injected behavior module is not internal mocking. `resolveModule` is a production seam — `tools/generate/src/render/render.ts:288` defaults it to `getModule` and the conformance harness passes it too — so the whole render path under test is real; only the *consumer* is a stand-in. It has to be: the AC describes "a module that emits its received currency", and neither shipping behavior module (`carousel`, `contact-form`) does that. The claim under test is the seam at `render.ts:107-126,153-154`, which is real code exercised end-to-end into `index.html`. | none |
| 3 | info | coverage | AC-1429 second criterion sentence | — | "Two countries sharing a currency differ in locale" has no direct assertion in AC-1429's own UAT (which asserts the converse pair: GB and IE share a language and differ in currency and timezone — exactly what the AC's Verification section asks for). It is not unevidenced, though: AC-1435's UAT enumerates every row of `COUNTRY_DEFAULTS` and asserts each resolves back to itself, and the table holds `IE`/`DE`/`FR` all on `EUR` with `en-IE`/`de-DE`/`fr-FR` (`packages/site-schema/src/locale.ts:54,60,65`). Recorded rather than raised, because the evidence exists and sits under the AC whose Verification asks for it. | none |
| 4 | info | exclusivity | `tests/reconciliation-site-locale-identity.test.ts` vs `tests/test_UAT_FC_REQ-151_site_locale.test.ts` + `tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts` | — | The AC-named file re-derives most of the two intent-era FC files in the same shape. Unchanged from REPORT-3653 finding 4 and still not raised: it is the repo's standing pattern (121 `reconciliation-*.test.ts` alongside 52 `test_UAT_FC_*.test.ts`), and the two files serve different traceability chains — FC tests trace to REQ-151/REQ-153, AC-named tests are the matrix evidence. Within the matrix evidence itself there is no duplication: grep confirms exactly ten `test_UAT_AC14{28..37}` functions, one per AC, all in one file. | none |
| 5 | info | consistency | all ten UATs | — | Executed this turn: `npm test -- tests/reconciliation-site-locale-identity.test.ts` → 10 passed / 10, 504ms. Live green evidence against the landed implementation. | none |

## Notes for the Editor

- **Nothing to fix.** Every active AC has exactly one substantive UAT, each test
  exercises the behaviour its AC claims, and no two tests verify the same
  scenario in the same shape.

- **Do not delete the FC test files** to tidy Finding 4. REPORT-3653's repair
  worked by lifting assertions out of them; they remain the intent-side
  traceability chain for REQ-151 and REQ-153.

- **Observed while enumerating the table, out of level and not a finding here**:
  STORY-122's Description and REQ-151's "what changed" both say the derivation
  table covers **66** countries; `COUNTRY_DEFAULTS`
  (`packages/site-schema/src/locale.ts`) holds **65** unique rows as landed
  (counted, deduplicated). Nothing at the `uat` level turns on it — AC-1435 asks
  for "at least `IE`, `GB` and `US`" and its UAT enumerates whatever the table
  holds, so the count cannot go stale against the evidence. Raised only so a
  future `story`-level pass has the number rather than re-deriving it.

- **The one thing a future check should re-date rather than re-derive**: AC-1428
  and AC-1433 were sharpened by the AC-level fix loop hours before this ran, and
  that is what attempt 1 caught. If either is edited again, compare its
  `updated_at` against the last commit touching
  `tests/reconciliation-site-locale-identity.test.ts` before trusting this
  ledger — that single comparison is what distinguishes real drift here from a
  repaired one.
