---
uid: report-e5696e70
id: REPORT-3658
type: report
title: 'UAT Coverage: Site Locale Identity: Where A Business Is, And What The Page
  Declares'
created_by: xgd
created_at: '2026-09-10T04:10:49.960239+00:00'
updated_at: '2026-09-10T04:10:49.960239+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-bcbcdaf1
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Locale Identity: Where A Business Is, And What The Page Declares

**Result**: PASS
**AC verdicts**: 11 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Attempt 2. The single violation pair from attempt 1 (report-801f3867 — registry
completeness unstated and untestable) is closed: AC-1618 now states the claim as
membership, and `test_UAT_AC1618_the_reservation_consults_the_whole_iso_639_1_registry`
makes it falsifiable. Verified independently this round rather than taken from the
fix report: the suite was re-run (**11 passed / 11**, 583ms), the new UAT was read
in full, and the shipped registry was counted directly out of
`packages/site-schema/src/locale.ts` (184 unique codes — exactly the list the test
transcribes and asserts set-equality against). The test does **not** import the
module's list, so it cannot agree with a curated subset; and it sweeps all 676
two-letter segments through the real `validateSite`, so equality holds in both
directions.

No new violation was found on an independent re-walk of both intents against all
eleven ACs and the story body. Two warnings, both informational and neither
actionable-as-a-blocker, are recorded below.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-151 (request-4fcbd354) | free_and_reconciled | 2026-08-20 | Four optional locale fields on `siteConfigSchema`; `COUNTRY_DEFAULTS` derivation table; both renderers emit `lang`/`dir` from `resolveSiteLocale`; resolved locale reaches behavior modules as `BehaviorProps.locale`; invalid field = validation error at `/config/<field>`; undeclared → region-free `en` (`UNDECLARED_LOCALE`) | YES |
| REQ-153 (request-94e93caa) | free_and_reconciled | 2026-08-20 | `pageSchema.slug` `superRefine` reserving exact locale segments; `ISO_639_1_LANGUAGES` as the **whole** registry, "not a curated subset"; numeric region form reserved, script subtag deliberately not; refusal names the reason and two alternatives | YES |
| REQ-152 | free_and_reconciled | 2026-08-20 | Money/time formatting seam — a *consumer* of this capability, its own capability | YES (context only) |

Both governing intents are carried by BUNDLE-20 (`merged_at_commit eef7a8b4`).
**No later intent retires any behavior here** — re-verified this round by scanning
the bodies of all 195 `request`/`bug` tickets in the store for
`resolveSiteLocale` / `ISO 639` / `COUNTRY_DEFAULTS` / `UNDECLARED_LOCALE` /
locale-slug references with `created_at >= 2026-08-20`: the only hits are REQ-151
and REQ-153 themselves. Every AC is active; none is deprecated.

Three behaviors are **reconciliation-decided** rather than intent-stated, each
recorded under the story's `## Reconciliation Decisions` (2026-08-31) — grounded
decisions, treated as active and not reopened: AC-1435 (the derivation table
validated as site configuration), AC-1436 (the reservation asserted at an
authoring entry point, not only at the schema), and the published-revision half of
AC-1428.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-122 | REQ-151, REQ-153 (+ REQ-152 as downstream consumer) | aligned | Every behavioral claim in the body traces to REQ-151/REQ-153 or to a recorded `## Reconciliation Decisions` entry, and every one now reaches an AC and a substantive UAT. The attempt-1 gap (registry completeness) is closed by AC-1618. One non-behavioral prose detail is inaccurate — see warning 1 — which is a story-body-edit, not a coverage gap. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-122 | story-body-edit | The Description says the derivation table covers "**66 countries**". `COUNTRY_DEFAULTS` carries **65** rows (counted this round; 65 also at the landing commit `bbce12ddd4`, so no row was ever lost — REQ-151's prose miscounted and the story inherited it). Nothing behavioral depends on the number: AC-1435 holds *every* row, however many there are, and deliberately does not pin the count. | Drop the number rather than correcting it to 65 — "covering the EU, the Americas, Africa/the Middle East and Asia-Pacific" stays true across the one-row data edits the table is designed for. Do **not** add a 66th country to satisfy the prose, and do **not** add a count assertion to AC-1435. |
| 2 | warning | — | (tooling, not this capability) | — (informational) | `.xgd/uat_index.json` is `{"acs": {}}` (written 2026-09-09T22:50) — globally empty, not missing these ACs specifically. The prescribed `uat_index.json` lookup returns nothing for every AC in the store, so test discovery this round was done by reading `tests/reconciliation-site-locale-identity.test.ts` directly and running it. | No capability-level action. Flagged for the operator because any later stage that trusts the index will read all-zero coverage for the whole matrix. |
| 3 | warning | ac | AC-1428 | — (informational, unchanged from attempt 1) | The published-revision half remains **vacuous**: both stored sites (`storage/sites/gigabytealchemy`, `storage/sites/xgd`) still have `history.json` = `{"revisions": []}`, so the revision loop iterates zero times. Correct-as-written — REQ-151 records zero published revisions at implementation time, which is the whole reason the capability was built then. The AC guards vacuity where it can (asserts the site set is non-empty) and cannot invent a revision. | No change. It becomes live at the first publication with no edit required. |

**Counts**: 0 violations, 3 warnings, 0 blocking `needs_review`, 0
`needs_review-default`. The impact screen (BUG-1306) was never reached — no
behavior in the story body is intent-silent-and-undecided.

## Evidence Notes (per-AC)

All eleven UATs live in `tests/reconciliation-site-locale-identity.test.ts` and use
real entry points throughout — `validateSite`, `resolveSiteLocale`, `localeDirection`,
`renderSiteFiles` (generator path), `renderL1Page` (framework path), `loadSite`,
`readHistory`, `editPageAdd` / `editPageList`. Nothing internal is mocked. Rendering
claims are read off **rendered artifacts**, not off the resolver's return value.

| AC | Test (line) | Why it substantively covers |
|---|---|---|
| AC-1428 | `…_undeclared_locale_…` (:134) | Asserts the whole resolution object and explicitly pins `locale !== COUNTRY_DEFAULTS[US].locale`, so the two halves of the asymmetry drift independently; enumerates real stored sites at verification time behind a non-empty guard. |
| AC-1429 | `…_country_alone_derives_…` (:185) | `IE`/`GB` resolved field-by-field; the `lang` claim read off a rendered `<html>` tag. |
| AC-1430 | `…_each_override_independently` (:209) | Three override configurations, each asserting the two non-overridden fields still derive; the locale override additionally observed in the artifact. `America/Los_Angeles` is not a `COUNTRY_DEFAULTS` value, so this also refutes a "valid zone = a zone in the table" implementation. |
| AC-1431 | `…_both_render_paths_…` (:240) | Two genuine emitters (`tools/generate/src/render/render.ts`, `packages/framework/src/l1/render.ts`) each render, and the tags are compared across four configurations — agreement observed, not inferred from a shared import. |
| AC-1432 | `…_right_to_left_…` (:255) | `IL`/`AE` read off rendered tags; `az-Arab` vs `az-Latn` pins script-over-language, which a language-only table gets wrong by construction; unknown locale pinned `ltr`. |
| AC-1433 | `…_validation_error_at_a_machine_readable_path` (:274) | Nine bad values, each paired with its corrected form so the refusal is attributable to the field, not the fixture; plus the permissive side (`qz`, `zxx`, `tlh-Latn-US` validate *and* survive resolution unchanged), which makes the list a boundary rather than an allowlist. Confirmed against `schema.ts:966` — `timezone` refines through `isKnownTimezone` (the runtime tz database), not a pattern. |
| AC-1434 | `…_behavior_module_is_handed_…` (:319) | A probe module injected through the real `resolveModule` seam of the real `renderSiteFiles`; the observed party is the *external* one (payments/calendar do not exist yet), so this is a probe, not a mock of the thing under test. Checked twice — on the props received and on the markup emitted. |
| AC-1435 | `…_every_country_row_…` (:350) | Enumerates every `COUNTRY_DEFAULTS` row, validates each as site config, and asserts each resolves back to itself including derived `dir`. |
| AC-1436 | `…_locale_shaped_slug_is_refused_…` (:375) | Schema refusal at `/pages/0/slug` carrying slug, locale reason and both alternatives; then the real `editPageAdd`, asserting `SCHEMA_INVALID`, `/pages/1/slug`, that no half-written page survives, and that the qualified slug then succeeds. The AI toolbox's `add_page` delegates to this same `editPageAdd` (`tools/generate/src/cli/ai/toolbox-core.ts:270`), so the story's "reaches every writer" claim is covered at the schema, the CLI, the assistant surface and the store loader (the latter via `loadSite` in AC-1428/AC-1437). |
| AC-1437 | `…_slugs_that_resemble_or_extend_…` (:428) | Fourteen near-miss slugs plus every page slug the real stored sites use, read at verification time behind a non-empty guard; `zh-Hans` pins the deliberately-unreserved script form. |
| AC-1618 | `…_the_whole_iso_639_1_registry` (:467) | **New this round, verified independently.** Sweeps all 676 `aa`–`zz` segments through the real validator and asserts the refused set is *set-equal* to a registry transcribed in-test from the standard (not imported — an imported list would agree with a curated subset). `size === 184` anchors the closed registry; five rare codes (`ki`, `nv`, `io`, `cu`, `za`), none exercised elsewhere, are held to `de`'s exact refusal and paired against same-shaped non-codes (`kx`, `nq`, `iq`, `cq`, `zq`) that validate — so the assertion attributes refusal to *membership*, not shape. The shipped `ISO_639_1_LANGUAGES` was counted directly: 184 unique codes. |

## Notes for the Editor

**Nothing blocks.** Zero violations and zero `needs_review`; the capability passes.
The only editor-actionable item is warning 1, a one-line prose correction in
STORY-122's Description, and the safest form of it is to delete the count rather
than restate it — the table is explicitly designed to grow by a one-row data edit,
so any number in prose is a number that goes stale.

**The asymmetry from attempt 1 still holds and should not be revisited.** ISO 639-1
is closed and frozen, so AC-1618 pins its completeness at no maintenance cost. The
country table is an open surface, so AC-1435 pins *every row, however many there
are* and leaves the breadth unpinned. Warning 1 is the prose catching up with that
decision, not a reason to reverse it.
