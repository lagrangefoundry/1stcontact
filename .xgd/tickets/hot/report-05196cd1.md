---
uid: report-05196cd1
id: REPORT-2410
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=uat)'
created_by: xgd
created_at: '2026-08-20T08:39:44.723233+00:00'
updated_at: '2026-08-20T08:39:44.723233+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 3
  warnings: 5
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: uat

**Result**: FAIL
**Violations**: 3
**Warnings**: 5
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 9

## Scope and what moved since the last uat cycle

**7 stories** (all `feature`/`upgrade`), **103 live ACs** — 99 `active`, 3 `pending`
(AC-719 under STORY-82; AC-1343/AC-1344 under STORY-85), 1 `deprecated` and therefore
out of scope (AC-718).

**Every one of the 103 live ACs has at least one matching `test_UAT_AC<n>_*` test.**
Three of them (AC-683, AC-688, AC-727) are defined in the multi-line
`it.runIf(...)(\n 'name',` form and are invisible to a single-line grep — they exist
at `reconciliation-l1-substrate.test.ts:168`, `:502` and
`reconciliation-l1-language.test.ts:487`. A scan that misses that form will report
three phantom `uat-add` gaps; there are none.

The set moved by +3 since REPORT-2094 (100 live ACs), and every one of those moves was
a repair the last three cycles asked for:

| Move | Source | Effect on this level |
|---|---|---|
| AC-718 **deprecated**, criterion folded into AC-701 | ac cycle attempts 8–9 | REPORT-2094 finding 5 was resolved *at the ac layer* — but its test was not retired. **Now Violation 3.** |
| AC-1343 + AC-1344 **authored** (REQ-93) | ac cycle | REPORT-2094 Info 10 is **closed**: `req93-l1-slot-mounted-behaviors.test.ts` is renamed and claimed. No gap remains. |
| AC-723 **widened** with per-instance class namespacing | fix attempt 9 | Covered by `req93-…:365`, substantive. Aligned. |
| AC-928/AC-931 **rewritten**, AC-1144/AC-1145 **added** (REQ-137 / BUG-34) | BUNDLE-18 | AC-1144/1145 land clean (Info 9). **AC-928 is Warning 8.** |

## Execution — the suite was run this cycle

Unlike REPORT-2094, I executed every CAP-70 test file: **21 files, three runs**
(`npm test -- <files>`).

| Run | Files | Result |
|---|---|---|
| L1 substrate group | 6 | 30 passed, **2 skipped** |
| behavior-module group | 6 | 28 passed, **2 failed (EPERM)** |
| axes / colour / responsive group | 9 | 53 passed, **1 failed (EPERM)** |
| **Total** | **21** | **111 passed, 3 failed, 2 skipped (116)** |

**The 2 skips are honest**: AC-683 and AC-688 are `it.runIf(engineAvailable(…))` and
correctly surface as *skipped* because no browser engine is installed here. They are
the contrast case that makes Violation 2 / Warning 4 fixable.

**The 3 failures are the worktree sandbox, not the code**: `test_UAT_AC703_*`,
`test_UAT_AC888_*` and `test_UAT_AC1344_*` each die on
`Error: listen EPERM: operation not permitted 0.0.0.0` — an uncaught exception thrown
from `server.listen` before any assertion runs
(`tools/generate/src/cli/serve.ts:54` via `conformance/harness.ts:196`, and directly at
`reconciliation-l1-relocatable-output.test.ts:169`). This regression worktree denies
socket binding. The ac cycle recorded the same EPERM for AC-1344. **These are not
findings** — no assertion is wrong and no evidence is invalid; the three ACs simply
could not be executed *here*. I am not claiming them green, and I am not counting them
against the matrix.

**Execution paid for itself.** Running the suite converted Violation 2 / Warning 4 from
a static reading into a demonstrated defect: with no chromium installed,
`reconciliation-nowrap-width-floor.test.ts` reports **`✓ 4 passed`** — all four,
including AC-1012 — while three of those four tests' browser arms never executed. A
verbose run is in the finding.

## Cumulative Intent Considered

At `uat` level the **AC body is the working reference**. The cascade precondition holds
this cycle for the first time: the story level passed (`report-cdc26db2`, 07:52) and the
ac level passed (`report-5235c57a`, 08:28) today. I escalated to intent for **one**
element — AC-685, where the criterion asserts a Layer-2 property the emitter does not
implement (Violation 1), i.e. the AC is the suspicious party, not the test. Ledger
carried from `report-5235c57a` and re-checked for status changes; none.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-63/79/82/83/84 (BUNDLE-7, `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; semantic layout modules and their ~20 dials deleted | YES |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted behavior modules | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; no back-compat alias | YES |
| REQ-93 (`request-f26cbe32`, BUNDLE-10) | free_and_reconciled | 2026-08-05 | Page-level slot binding, renderer mount, `mountInL1`, `labelMode` | YES — **now fully claimed (Info 10)** |
| REQ-96…107 + BUG-28 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | `control` leaf + zero-CSS contract; shared axis groups; interaction/motion/texture; layout track; link role | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | 2026-08-06 | Palette colour model; closed colour-role vocabulary deleted | YES |
| REQ-117 | free_and_reconciled | 2026-07-31+ | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment | YES (AC-1124…1128) |
| BUG-34 + REQ-137 (BUNDLE-18, `bundle-d9226698`) | free_and_reconciled | 2026-08-17 | Palette `shade` replaces named `steps` | YES — **AC-928 under-covered (Warning 8)** |
| REQ-145 / REQ-148 | ready_to_reconcile | — | L1 + behavior-module render move into workerd | imminent — no uat gap |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

**DOC-2 §2** is the other reference consulted, for Violation 1 only: it enumerates the
Layer-2 emit-time guarantees as text / colour / font-family / length / image-src.
Closed enums are **not** among them.

## Alignment Ledger

One row per test file — the unit at which these UATs are organised. Every file reaches
real entry points: `validateL1` / `validateSite`, `renderL1Document` /
`renderL1Fragment`, `validateBehaviorConfig` / `Slots` / `Controls` / `Instance`, the
real Astro SSR container, the real `cmdNew` / `cmdRender` / `cmdColors` /
`cmdColorsAssign` against the real filesystem, `foldToL1`, and JSDOM browsing contexts.
**No test stands on a structural/AST stand-in where a behavioural probe belongs.**

| Test file (ACs) | Intents aligned to | Outcome |
|---|---|---|
| `reconciliation-l1-substrate` (682–688, 723) | REQ-82, REQ-87 | **685 ¶1/¶2 over-claim (Violation 1)**; **686 ¶2 / 687 ¶2 unexercised (Warning 7)**; 683 + 688 `it.runIf`-gated → reported **skipped** — honest |
| `reconciliation-reproduction-treatments` (719 + a **deprecated** 718) | REQ-84, REQ-96 | **AC-718's test is live against a deprecated AC and duplicates AC-701 (Violation 3)**; AC-719's test is substantive and aligned on all three Verification clauses |
| `reconciliation-nowrap-width-floor` (1009–1012) | REQ-117 | **1012 browser arm silent-skipped + fidelity clause unproven (Violation 2)**; **1009 + 1011 same gate (Warning 4)** |
| `reconciliation-behavior-modules` (697–704, 722) | REQ-85, REQ-87, REQ-96 | **702 mocks an internal module (Warning 5)**; 703 EPERM here (environment) |
| `reconciliation-colour-palette-overlay` (928–931) | REQ-114, REQ-137 | **928's step-rejection + store-walk clauses proven only by FC-named tests (Warning 8)**; **930 duplicates STORY-97's AC-942 in shape (Warning 6)** |
| **`req93-l1-slot-mounted-behaviors` (723, 1343, 1344)** | **REQ-93** | **aligned — the AC-add landed and the tests are renamed; REPORT-2094 Info 10 is closed** |
| **`reconciliation-colour-shade-axis` (1144, 1145)** | **REQ-137** | **aligned — new this cycle, independent oracles, no mocks (Info 9)** |
| `reconciliation-l1-image-framing` (1124–1128) | REQ-136 | aligned |
| `reconciliation-l1-language` (725–728) | REQ-90, REQ-91 | aligned |
| `reconciliation-l1-shared-axis-groups` (685 ¶2, 801–805) | REQ-97, REQ-98, REQ-105 | aligned — legitimate split coverage of AC-685's two paragraphs |
| `reconciliation-l1-control-and-texture` (806, 807, 829–832) | REQ-96, REQ-103 | aligned |
| `reconciliation-l1-authoring-envelope` (849–851) | REQ-107 | aligned — owns the `/pages/N/l1/…` prefixing Warning 7 refers to |
| `reconciliation-l1-relocatable-output` (888–891) | BUG-30, REQ-109 | aligned; 888 EPERM here (environment) |
| `reconciliation-l1-one-colour-system` (933–936) | REQ-114 | aligned |
| `reconciliation-absolute-value-literals` (716) | REQ-84 | aligned |
| `reconciliation-responsive-layout-track` (833–838) | REQ-104 | aligned |
| `reconciliation-behavior-l1-composition` (808–811) | REQ-96 | aligned |
| `reconciliation-contact-form-enhancement-gate` (877, 878) | BUG-28 | aligned — `vi.spyOn(mounted.form, 'getAttribute')` fakes a **DOM API** (external boundary), which TEST-STRATEGY permits |
| `reconciliation-l1-interaction-and-motion` (819–828) | REQ-99, REQ-100 | aligned |
| `reconciliation-l1-pointer-accent` (879–887) | REQ-108 | aligned |
| `reconciliation-l1-navigation` (839–848) | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-685 `acceptance_criterion-62adf959` ¶1/¶2 vs `packages/framework/src/l1/render.ts` | ac-edit | **Fifth consecutive cycle** (REPORT-1316 F2 → REPORT-1674 F1 → REPORT-1727 F1 → REPORT-2094 F1), re-located line-by-line this pass. AC-685 ¶1 claims "This holds even for a value that bypassed validation — the emitter is the last line of defence", and ¶2 that a structured axis "reaches CSS only as CSS **re-derived** from its numeric, **closed-enum**, and hex fields". Closed-enum axes are still interpolated raw with no emit-time re-check: `render.ts:227` `font-style`, `:624` `mix-blend-mode`, `:676` `text-decoration-line`, `:1992` `text-transform`, `:1993` `font-style`, `:1996` `text-decoration-line`, `:2006` `list-style-type`, `:2089` `object-fit` — each a bare `${…}` interpolation of the instance value, at the exact lines REPORT-2094 cited. `grep -n cssEnum packages/framework/src/l1/render.ts` returns **0 hits**; no enum guard exists anywhere in the file, in contrast to the `cssColor` / font-family / URL sanitisers that do. `test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised` (`tests/reconciliation-l1-substrate.test.ts:302`) renders an **unvalidated** document — exactly the AC's premise — but carries payloads only in `text`, `alt`, `src` and `fontFamily`. Note the AC's own **Verification** paragraph never asks for an enum payload either: it enumerates text / src / alt / font-family, then gradient stop / border colour / background-image URL / mask / transform / font-face. So the Verification and the test agree with the code, and it is the **Criterion** alone that over-claims. **Exposure is bounded**: `validateL1` (Layer 1) rejects an enum breakout and is genuinely in the production path, so no shipped site is at risk. **DOC-2 §2 enumerates the Layer-2 guarantees as text / colour / font-family / length / image-src — enums are not among them**, so policy, code, Verification and test all agree against the Criterion, 4-to-1 | **Take the ac-edit; do not open the code branch.** Narrow AC-685 ¶1's "even if bypassed" sentence to the value families DOC-2 §2 guarantees at Layer 2, and drop "closed-enum" from ¶2's re-derivation list, keeping enums a Layer-1 (schema) guarantee. **No test edit is needed or wanted** — `test_UAT_AC685_*` already matches the narrowed criterion and the AC's existing Verification. (The `code-issue` reading — add an emit-time enum re-check shaped like `cssColor` — remains available as an operator override, but four cycles of offering it as a co-equal branch is what has stalled this finding; it is not the recommendation.) |
| 2 | violation | coverage | `test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed` (`tests/reconciliation-nowrap-width-floor.test.ts:428`) | uat-edit | **Fourth cycle** (REPORT-1674 F2 → REPORT-1727 F2 → REPORT-2094 F2) — and the first with runtime proof. AC-1012's Verification is browser-based *and* adds "…**and that the same document's round-trip fidelity against the original capture is unchanged**". Two gaps. **(a)** The measurement arm sits behind a bare `if (!HAVE_CHROMIUM) return` at `:460` — an early return, so with no engine present the test reports **pass**, not skip. I verified this by running it: `npm test -- tests/reconciliation-nowrap-width-floor.test.ts --reporter=verbose` prints `✓ … test_UAT_AC1012_… 1ms` and `Tests 4 passed (4)` on a machine where `engineAvailable('chromium')` is false (proven by AC-683/AC-688 reporting *skipped* in the same session). A 1ms "pass" is the whole browser criterion not running. What does execute unconditionally is a stylesheet-equality proxy (`strip()` at `:453-459` removes `width`/`min-width` declarations and compares the rest) — a good argument, but not the AC's criterion, which is *measured bounding boxes*. **(b)** The **round-trip fidelity clause is exercised by no arm at all**, engine or not: the fixture is a synthetic `multi(LADDER.map(…))` document built inline at `:429-439` with **no original capture** to compare against, and the only occurrence of the word *fidelity* in the whole file is a comment at `:474` | Either (i) add a fidelity assertion against a real folded capture — the shape `test_UAT_AC683_*` already uses — and move the measurement into a separate `it.runIf(HAVE_CHROMIUM)` test so an unexercised arm reports as **skipped**; or (ii) narrow AC-1012's Verification to drop the fidelity clause and state the stylesheet-equality proxy as the engine-free arm. Resolve alongside Warning 4 — same file, same gate |
| 3 | violation | consistency + exclusivity | `test_UAT_AC718_contact_form_presentation_via_config_and_l1_controls` (`tests/reconciliation-reproduction-treatments.test.ts:126`) vs AC-718 `acceptance_criterion-f3328e22` (**status: `deprecated`**) | uat-edit | **New this cycle — the predicted consequence of a repair that only went half-way.** REPORT-2094 finding 5 said: deprecate AC-718, and "when that lands, retarget or retire this test file with the ACs it serves". The ac cycle **landed the deprecation** — AC-718 is now `deprecated`, and STORY-82's body states it explicitly: "its **criterion** moved to AC-701 under STORY-85 when AC-718 was deprecated … restating them here would duplicate that criterion clause for clause rather than add coverage." **The test did not move.** `test_UAT_AC718_*` is still defined, still collected, and still ran green in this cycle's suite. Two consequences. **(a) Consistency**: a live test is attributed by the `test_UAT_AC<n>_*` convention to a matrix element that no longer exists, so any AC↔UAT index credits evidence to a retired AC. **(b) Exclusivity**: `test_UAT_AC701_*` (`tests/reconciliation-behavior-modules.test.ts:416`) is a strict superset of it in substance — same real Astro SSR render of the same module, and it already asserts the L1-painted submit (`:430`), the absence of `contact-form__submit` (`:446`), and the `for`↔`id` label bindings (`:434-436`), plus honeypot/Turnstile and an unauthored-form arm that AC-718's test lacks. Exactly the story body's "clause for clause" prediction. **Retiring it outright would lose two assertions, so this is not a plain delete**: `:130-140` is the only place in the suite asserting contact-form's *closed config key set* (`['action','fields','submitLabel','successMessage']`), the absence of the retired dials `fieldLabels`/`submitInline`/`submitColor`, `slots === ['form']`, and `meta.dials === undefined`. `grep` for `Object.keys(contactFormMeta` returns this site only; `reconciliation-behavior-modules.test.ts:266,270` carries the *carousel* equivalent, not contact-form's | Fold `:130-140`'s four config-surface assertions into `test_UAT_AC701_*` (which owns the criterion per STORY-82's body) or into `test_UAT_AC722_*`, then **delete `test_UAT_AC718_*`**. Since AC-719's test is the only other occupant of `reconciliation-reproduction-treatments.test.ts`, that leaves a one-test file — fine, or fold AC-719's test in beside it. Also clear the retired REQ-87 word "capability" from the file header (`:9`, `:15`), the section comment (`:115`) and the describe string (`:117`) |
| 4 | warning | consistency | `test_UAT_AC1009_*` (`tests/reconciliation-nowrap-width-floor.test.ts:184`, gate at `:228`) and `test_UAT_AC1011_*` (`:374`, gate at `:410`) | uat-edit | Same silent-gate pattern at two more sites, both still bare `if (!HAVE_CHROMIUM) return`, and both demonstrated green-without-the-arm in this cycle's verbose run (8ms and 1ms respectively, engine absent). **Warning rather than violation** because — unlike Violation 2 — the engine-free arms here are substantive and directly prove each criterion's main clause (per-rung `min-width` with a `width: auto` reset, threshold gating, the extrapolation guard at `:407`). The contrast that makes this fixable sits in the same test session: AC-683 and AC-688 use `it.runIf(...)` (`reconciliation-l1-substrate.test.ts:167`, `:498`) and correctly surface as **skipped**; `if (!HAVE_CHROMIUM) return` cannot | Convert all three sites to a separate `it.runIf(HAVE_CHROMIUM)` browser-arm test — splitting each UAT into an engine-free and an engine-gated half — so an unrun arm is never reported as a pass |
| 5 | warning | consistency | `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` (`tests/reconciliation-behavior-modules.test.ts:480`, mock at `:556`) | uat-edit | **Fourth cycle** (REPORT-1316 F3 → REPORT-1674 F4 → REPORT-1727 F6 → REPORT-2094 F4). The negative arm still mocks an **internal** module — `vi.doMock('../packages/framework/src/index', …)`, overriding `getModuleClientJs` to `() => ''` — to prove "no client behaviour in the catalog ⇒ no asset and no script reference". TEST-STRATEGY forbids mocking internal components. Confirmed still the **only** internal mock among the capability's 103 UATs: `grep -rl 'vi\.(doMock|mock)\('` over the 21 CAP-70 test files returns this file alone. Mitigating and unchanged: the positive arm runs the entire real pipeline (`cmdNew` + `cmdRender`, real catalog, real filesystem) and carries every substantive claim; the test guards vacuity with `expect(getModuleClientJs().length).toBeGreaterThan(0)`; and `cmdRender(slug, opts)` still accepts no catalog/resolver injection, so there is no unmocked route to the empty-catalog branch | Add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule`, and drop the mock — or record in AC-702 that the empty-catalog arm is proven against a substituted catalog by construction. Low urgency: no claim is currently unproven. *(Note for a later reader: the `capabilities.js` filename this test asserts is **not** REQ-87 rename residue — AC-702's body pins it deliberately as a plural bundle-output filename. Do not "fix" it.)* |
| 6 | warning | exclusivity | `test_UAT_AC930_one_rgb_at_several_alphas_collapses_to_one_entry_exactly` (`tests/reconciliation-colour-palette-overlay.test.ts:286`) vs `test_UAT_AC942_*` (`tests/reconciliation-colour-census-and-retrofit.test.ts:416` **and** `tests/reconciliation-colour-retrofit-shade-model.test.ts:519`, both STORY-97 `story-5e7eb0c5`, capability-b4ac88fc) | uat-edit (+ one-line ac-edit) | Carried from REPORT-1674 F5 / REPORT-1727 F4 / REPORT-2094 F6; all still present, same shape, cross-capability. AC-930's test stages a site carrying one RGB at three opacities, runs the real `cmdColors` (`:306`) then `cmdColorsAssign` (`:315`), and asserts the three literals collapse to exactly one opaque palette entry. Confidence unchanged from last cycle: (i) AC-930's own Verification *prescribes* the conversion drive, so the test is faithful to its AC and the redundancy is inherited from the AC pair, not introduced by the test; (ii) the test carries real distinct content STORY-97's does not — the whole-byte-range exactness loop at `:341-346` (all 255 alpha bytes round-trip through `resolveL1Color`) and the opaque-reference case at `:347`, which prove AC-930's third paragraph and belong to the value model rather than to the retrofit | Retarget `test_UAT_AC930_*` at the axis AC-930 uniquely owns — a reference carrying its own alpha resolves to the right literal, asserted through `validateSite` + `resolveL1Color` at the load boundary, keeping the byte-range exactness loop — and drop the `cmdColors` / `cmdColorsAssign` drive, leaving the conversion to STORY-97. Because the AC's Verification currently mandates that drive, this needs a matching one-line `ac-edit` on AC-930 |
| 7 | warning | coverage | AC-686 `acceptance_criterion-33ecc306` ¶2 and AC-687 `acceptance_criterion-c9b3f600` ¶2 (`tests/reconciliation-l1-substrate.test.ts:341`, `:451`) | ac-edit (do **not** uat-add) | Carried from REPORT-1674 F7 / REPORT-1727 F7 / REPORT-2094 F7; re-read this cycle. Both ACs carry a second Verification clause neither test exercises. AC-686 asks for a representative violation repeated "as an **authored page inside a site definition**"; the test's only entry point is `const accepts = (doc) => validateL1(doc).ok` (`:342`) — standalone `validateL1`, no `validateSite`, across every one of its rejection cases. AC-687 asks that "every reported path is prefixed into that page's L1 body" (e.g. `/pages/0/l1/root/children/2/…`); the test asserts only the bare `/widths/1`, `/root/children/0/axes/fontSizePx`, `/root/children/1/src` (`:486-488`). **The behaviour is proven elsewhere** — `test_UAT_AC849_*` / `test_UAT_AC850_*` in `reconciliation-l1-authoring-envelope.test.ts` assert `/pages/0/l1/…`, the multi-page `/pages/1/l1/…` case, and the prefix-holds-for-all check — so this is an **attribution gap, not an evidence gap**, which is why it stays a warning across four cycles | Do **not** write new tests — that would duplicate AC-849/AC-850. Delete the site-definition clause from AC-686's Verification and the page-prefix clause from AC-687's, cross-referencing AC-849/AC-850 which own them |
| 8 | warning | coverage | AC-928 `acceptance_criterion-1663c20c` vs `test_UAT_AC928_palette_entries_and_every_colour_axis_accepts_either_form` (`tests/reconciliation-colour-palette-overlay.test.ts:111`) | uat-edit | **New this cycle — the REQ-137 AC rewrite outran its test.** BUNDLE-18 rewrote AC-928 around the shade model, adding two clauses the test does not exercise. **(a)** Criterion: "The entry object is closed, so a definition carrying a **step** is *rejected* rather than read-and-ignored"; Verification: "Confirm an **entry** carrying a step is rejected". The test covers the *entry-carrying-alpha* rejection (`:187-191`) but asserts nothing about an entry-side step. The only step rejection in the file is at `:227` — a **reference**-side `{ ref: 'brand-teal', step: '300' }`, and it sits under AC-929's describe, not AC-928's. **(b)** Criterion: "The claim holds of **the store**, not only of the schema: no site definition on disk declares an entry carrying anything beyond its value"; Verification spells out the shape — "walk every stored site … enumerate the store by directory … assert the walk actually examined the stored entries — the count is part of the assertion." The test performs **no store walk at all**; `grep -n readdirSync tests/reconciliation-colour-palette-overlay.test.ts` returns nothing. **Both clauses are in fact proven, but by FC-named tests the matrix cannot credit**: `tests/test_UAT_FC_REQ-137_palette_shade.test.ts:87` `…_an_entry_is_one_colour_and_a_step_is_not_a_field` (rejects `{ value, steps: { '500': … } }`) and `:102` `…_no_stored_site_carries_a_step`, which walks `readdirSync(SITES, { withFileTypes: true })` by directory and closes with `expect(entriesSeen, 'no stored palette entry was examined at all').toBe(22)` — a near-verbatim match to AC-928's Verification paragraph, count assertion included. So this is an **attribution gap of the same species as Warning 7**, but with the opposite repair, because on-point tests already exist | **Rename, do not author.** Retarget `tests/test_UAT_FC_REQ-137_palette_shade.test.ts:87` and `:102` to `test_UAT_AC928_an_entry_carrying_a_step_is_rejected` and `test_UAT_AC928_no_stored_site_carries_a_step` — they were written for the same intent that rewrote the AC and already match its Verification wording. Do **not** add a second store walk to `reconciliation-colour-palette-overlay.test.ts`; that would duplicate working evidence. Leave the rest of the FC file alone — its retrofit/derivation/fixpoint tests are STORY-97 territory, not AC-928's |
| 9 | info | consistency + coverage | AC-1144 / AC-1145 (STORY-80, REQ-137) → `tests/reconciliation-colour-shade-axis.test.ts` | — | **The new colour surface lands clean.** Two ACs, two substantive UATs, no duplicates. Both drive real entry points — `validateSite` (not the narrower `validateL1`), `renderL1Document`, and the published `resolveL1Color` / `shadeHex` / `collectL1PaletteRefs` — with nothing mocked. Notably the file measures the claims against **independently re-derived oracles** (`luminance`, `chroma`, and Ottosson's Oklab `L` matrices, `:72-94`) rather than the implementation's own helpers, with the reasoning stated at `:65-70`: "measuring them with the implementation's own helpers would only prove it agrees with itself." That is exactly the standard this level exists to enforce. The file also declares it "touches nothing in the repo's own `storage/` tree", which is why the store-walk half of AC-928 legitimately lives elsewhere (Warning 8). Nothing to repair | none |
| 10 | info | coverage | `tests/req93-l1-slot-mounted-behaviors.test.ts` → AC-1343, AC-1344, AC-723 | — | **REPORT-2094 Info 10 is resolved — closing it explicitly so a later cycle does not re-open it.** That entry logged 10 substantive REQ-93 UATs carrying `test_UAT_FC_REQ-93_*` names that no AC claimed, and predicted "renaming these closes the ac gap and the uat gap in one pass, once the ACs exist". Both halves happened: the ac cycle authored AC-1343 and AC-1344, fix attempt 9 widened AC-723, and the tests are renamed — `test_UAT_AC1343_slot_bound_module_accompanies_an_l1_page` (`:145`), `test_UAT_AC1343_unresolvable_bindings_fail_with_a_machine_readable_path` (`:154`, four distinct rejection cases each asserting a `pages/0/modules/0/slot` path), `test_UAT_AC723_mounted_fragment_replaces_the_inert_placeholder` (`:349`), `test_UAT_AC723_two_instances_of_one_behavior_keep_disjoint_class_namespaces` (`:365`), `test_UAT_AC1344_mounted_behavior_carries_its_conformance_obligations` (`:476`). Real `validateSite` / `renderL1Fragment`, no mocks. AC-1343's two tests are distinct scenarios (acceptance vs the rejection matrix), not duplicates; AC-723's three tests across two files split its three paragraphs. **AC-1344 could not execute here** — EPERM on `server.listen`, the worktree sandbox, not a defect | none |
| 11 | info | exclusivity | AC-685's two tests (`reconciliation-l1-substrate.test.ts:302`, `reconciliation-l1-shared-axis-groups.test.ts:131`) | — | Logged so a scan does not misread them as duplicates. AC-685 has two paragraphs — content values (text/alt/src/font-family) and structured axes + the resource table — and each is pinned in the file that owns its surface. Legitimate split coverage. The same is true of AC-723's three tests (Info 10) | none |

## Notes for the Editor

**1. Two of the three violations are new *because* the last cycle's repairs landed
half-way.** Violation 3 exists only because AC-718's deprecation was applied to the
ticket and not to the test that names it; Warning 8 exists only because REQ-137's AC
rewrite outran the test that serves it. Neither is a regression in the code — both are
a matrix edit and an evidence edit that need to travel together. The general lesson for
this fix loop: **an `ac-deprecate` or an AC rewrite is not complete until the
`test_UAT_AC<n>_*` names that point at it have moved too.**

**2. The suite is green and that has never been the signal here.** I ran all 21 files
(111 passed / 3 EPERM / 2 skipped) and every finding below survives a green run,
because each is about an assertion that is missing, a gate that hides a skip, a mock
that shouldn't be there, or a name pointing at a retired AC. **A fix loop that re-runs
the suite and reports success will not converge.** The one thing execution *did* settle
is Violation 2/Warning 4: those three tests demonstrably report `✓ passed` while their
browser arms do not run. That is no longer an inference.

**3. Violation 1 needs executing, not re-deciding.** Five cycles have offered it as a
branch (`ac-edit` vs `code-issue`) and five cycles have produced no edit. This report
makes the single recommendation: **narrow the AC**. The evidence is 4-to-1 — DOC-2 §2,
the emitter, AC-685's own Verification paragraph, and the test all describe the same
narrower guarantee; only the Criterion's prose is wider. Editing the *test* to add an
enum payload would turn a green test red against behaviour that policy does not
require, so do not touch the test. If the operator prefers the stronger guarantee, that
is an override and a `code-issue`, but it should not be re-presented as an open
question to a sixth cycle.

**4. Three ACs could not be executed in this worktree** — AC-703, AC-888, AC-1344, all
`EPERM` on `server.listen`. These are **not findings** and must not be fixed: no
assertion is wrong. If the fix loop needs their pass state, it must come from a runner
with socket permission. Do not "repair" them by removing the server, which is the real
boundary those three tests exist to cross.

**5. Three ACs are invisible to a naive grep.** AC-683, AC-688 and AC-727 are declared
as `it.runIf(...)(\n  'test_UAT_AC…',` — the name is on the *following* line. A
single-line scan reports them as uncovered and proposes three `uat-add`s for tests that
already exist. They are at `reconciliation-l1-substrate.test.ts:168`, `:502` and
`reconciliation-l1-language.test.ts:487`.

**6. Archived ACs remain a trap for this capability.** A raw filesystem walk of
`.xgd/tickets/**` returns far more ACs for these 7 stories than are live: the
AC-660…AC-681 and AC-717 block is **archived**, being precisely the module-dial ACs
REQ-84 and REQ-85 retired, and their tests were removed by commits `47aba3435` and
`d37af07ca`. A scan that misses the archived split will report ~21 ACs with no UAT and
propose `uat-add` for behaviour whose implementation no longer exists — an
unsatisfiable instruction. **The retirement is correctly recorded; do not re-open it.**
Use `xgd ticket list` / `query`, which exclude archived by default. AC-932 is the
inverse trap: still `active`, but it belongs to STORY-97 / capability-b4ac88fc, not
here — its test body remaining in a file named `reconciliation-colour-palette-overlay`
is cosmetic file placement, resolved by relocation in a previous cycle, and needs no
action.

**7. Sequencing.** All eight findings are independent of each other and of the
story/ac cascade — the story and ac levels both passed today, so nothing here is
blocked. Violations 1 and 3 and Warning 8 are the highest value: 1 unblocks a five-cycle
stall, 3 closes the loop the ac cycle opened, and 8 is a two-line rename of tests that
already pass.
