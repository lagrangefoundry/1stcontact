---
uid: report-4433bf39
id: REPORT-2094
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=uat)'
created_by: xgd
created_at: '2026-08-16T08:33:55.486322+00:00'
updated_at: '2026-08-16T08:33:55.486322+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 2
  warnings: 5
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 5
**Needs review**: 0

Anchor report: report-7ef6a9ea · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 7

Scope: **7 stories** (all `feature`/`upgrade`), **100 live ACs** — 98 `active`, 2 `pending`
(AC-718/AC-719 under STORY-82). The set moved by +4 since the last uat cycle
(REPORT-1727, 96 ACs): **+5** new (AC-1124…AC-1128, REQ-136 phase 1, authored
2026-08-12) and **−1** relocated (AC-932 left STORY-80 for STORY-97 on 2026-08-10 —
see Info 9).

**Every one of the 100 live ACs has at least one matching `test_UAT_AC<n>_*` test.**
A sweep of `tests/` for `it('test_UAT_AC…` returns exactly one CAP-70 AC with two
tests — AC-685, whose two paragraphs are pinned in two different files, which is
legitimate split coverage, not a duplicate. The `test_UAT_AC1124_*` /
`test_UAT_AC1125_*` strings that also appear in
`reconciliation-l1-shared-axis-groups.test.ts:298` and
`reconciliation-l1-language.test.ts:38` are **comment cross-references**, not second
definitions — checked individually.

## ⚠ Execution limitation — disclosed, not worked around

**I could not run the test suite this cycle.** The session is in don't-ask mode with
no allowlist entry for a test runner: `npx vitest run …` and
`./node_modules/.bin/vitest run …` (foreground and background, single-file and
multi-file) were each denied by the permission layer. The prior cycle (REPORT-1727)
executed 18 files green (96 passed / 2 skipped, 2.93s); **I am not restating that as
a current result.**

Every finding below is therefore established by **static verification against the
working tree** — file, line, and the exact text at that line, each re-read this
cycle. That is sufficient for all seven findings, because none of them turns on a
runtime outcome: findings 1, 5 and 7 are about assertions that are *absent* from a
test body, findings 2 and 3 about a control-flow gate that is *present* in a test
body, finding 4 about a `vi.doMock` call that is *present*, and finding 6 about two
test bodies driving the same command. Greenness was never the signal for any of them
— REPORT-1727 recorded the suite as fully green while carrying six of these same
seven. What I cannot independently confirm is the suite's current pass state; if the
fix loop needs that, it must come from a runner with execution permission.

## Cumulative Intent Considered

At `uat` level the **AC body is the working reference**. Intent was consulted for one
element only — AC-685, where the criterion asserts a Layer-2 property the emitter
does not implement (Finding 1), i.e. the AC itself is suspicious rather than the
test. Ledger carried from today's ac-level cycle (`report-d0196843`, 08:24); statuses
were established there and are not re-litigated at this level.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-84 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; delete semantic layout modules and their ~20 dials | YES |
| REQ-85 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted modules | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; no back-compat alias | YES |
| **REQ-93** | free_and_reconciled | 2026-07-25 | Page-level slot binding, renderer mount, `mountInL1` | YES — **evidence exists but is unlinked (Info 10)** |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| REQ-96 | free_and_reconciled | 2026-08-06 | `control` leaf; delete `carousel.config.view`; single required `form` slot; zero-CSS obligation | YES |
| REQ-97 / REQ-98 / REQ-105 | free_and_reconciled | 2026-08-06 | Shared surface + node-level axis groups; text measure; slot sizing | YES |
| REQ-99 / REQ-100 / REQ-108 | free_and_reconciled | 2026-08-06 | Interaction state, scroll reveal, pointer accent; renderer safety floor | YES |
| REQ-103 / REQ-104 / REQ-106 / REQ-107 | free_and_reconciled | 2026-08-06 | Texture axis; per-width layout track; link role; `validateL1` on the authoring path | YES |
| BUG-28 / REQ-109 / BUG-30 | free_and_reconciled | 2026-08-06 | Enhancement isolation; relocatable document-relative URLs | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | Deletes the closed colour-role vocabulary | YES |
| **REQ-136** | free_and_reconciled | 2026-08-12 | Non-destructive image framing + typed colour adjustment + typed shape | **YES — newly covered this cycle, all 5 ACs aligned (Info 8)** |
| REQ-137 | bundled (bundle-d9226698) | 2026-08-12 | Deletes palette `steps`; Oklab `shade` on the reference | imminent — not yet enforced |

**DOC-2 §2** is the other reference consulted, for Finding 1 only: it enumerates the
Layer-2 emit-time guarantees as text / colour / font-family / length / image-src.
Closed enums are **not** among them.

## Cascade precondition — NOT met (second level running blocked)

`uat` is defined to assume the ACs are aligned. **That assumption does not hold.**
The ac-level cycle ran today (`report-d0196843`, 08:24) and returned **FAIL /
3 violations**, and no AC in this capability has been edited since 2026-08-12T21:23.
The ac cycle in turn recorded the same failure against the story level
(`report-6b02087e`, 08:14, FAIL / 4 violations, unrepaired).

Where this bites at uat level is Info 10 (REQ-93 evidence exists, no AC claims it)
and Finding 5 (AC-718's test has already moved past its own AC). Both are logged
against the ac layer rather than re-litigated here.

## Alignment Ledger

One row per test file — the unit at which these UATs are organised. Every file
reaches real entry points: `validateL1`, `renderL1Document` / `renderL1Fragment` /
`renderL1Page`, `validateBehaviorConfig` / `Slots` / `Controls` / `Instance`, the
real Astro SSR container, the real `cmdNew` / `cmdRender` / `cmdColors` /
`cmdColorsAssign` against the real filesystem, `foldToL1`, and JSDOM browsing
contexts. **No test stands on a structural/AST stand-in where a behavioural probe
belongs.**

| Test file (ACs) | Intents aligned to | Outcome |
|---|---|---|
| `reconciliation-l1-substrate` (682–688, 723) | REQ-82, REQ-87 | **685 ¶1 over-claims (Finding 1)**; **686 ¶2 / 687 ¶2 unexercised (Finding 7)**; 683 + 688 engine-gated via `it.runIf` — honest |
| **`reconciliation-l1-image-framing` (1124–1128)** | **REQ-136** | **aligned — new this cycle, all five substantive (Info 8)** |
| `reconciliation-l1-language` (725–728) | REQ-90, REQ-91 | aligned |
| `reconciliation-l1-shared-axis-groups` (685 ¶2, 801–805) | REQ-97, REQ-98, REQ-105 | aligned |
| `reconciliation-l1-control-and-texture` (806, 807, 829–832) | REQ-96, REQ-103 | aligned |
| `reconciliation-l1-authoring-envelope` (849–851) | REQ-107 | aligned — owns the `/pages/N/l1/…` prefixing Finding 7 refers to |
| `reconciliation-l1-relocatable-output` (888–891) | BUG-30, REQ-109 | aligned |
| `reconciliation-l1-one-colour-system` (933–936) | REQ-114 | aligned |
| `reconciliation-colour-palette-overlay` (928–931) | REQ-114 | **930 duplicates STORY-97's AC-942 in shape (Finding 6)**; AC-932's test remains in this file though the AC has moved to STORY-97 (Info 9) |
| `reconciliation-absolute-value-literals` (716) | REQ-84 | aligned |
| `reconciliation-responsive-layout-track` (833–838) | REQ-104 | aligned |
| `reconciliation-nowrap-width-floor` (1009–1012) | REQ-115/117 | **1012 browser arm silent-skipped + fidelity clause unproven (Finding 2)**; **1009 + 1011 same gate (Finding 3)** |
| `reconciliation-behavior-modules` (697–704, 722, 809, 810) | REQ-85, REQ-87, REQ-96 | **702 mocks an internal module (Finding 4)** |
| `reconciliation-behavior-l1-composition` (808, 811) | REQ-96 | aligned |
| `reconciliation-contact-form-enhancement-gate` (877, 878) | BUG-28 | aligned — the `vi.spyOn(mounted.form, 'getAttribute')` fakes a **DOM API** (external boundary), which TEST-STRATEGY permits |
| `reconciliation-reproduction-treatments` (718, 719) | REQ-84 + REQ-96 | **the tests have moved past their ACs (Finding 5)** |
| `reconciliation-l1-interaction-and-motion` (819–828) | REQ-99, REQ-100 | aligned |
| `reconciliation-l1-pointer-accent` (879–887) | REQ-108 | aligned |
| `reconciliation-l1-navigation` (839–848) | REQ-106 | aligned |
| *`req93-l1-slot-mounted-behaviors` (no AC)* | **REQ-93** | **10 substantive UATs, unclaimed by the matrix (Info 10)** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-685 `acceptance_criterion-62adf959` ¶1 vs `packages/framework/src/l1/render.ts` | ac-edit (alt: code-issue) | **Fourth consecutive cycle** (REPORT-1316 F2 → REPORT-1674 F1 → REPORT-1727 F1). AC-685 ¶1 claims "This holds even for a value that bypassed validation — the emitter is the last line of defence", and ¶2 says a structured axis "reaches CSS only as CSS **re-derived** from its numeric, **closed-enum**, and hex fields". Closed-enum axes are still interpolated raw with no emit-time re-check: `render.ts:227` `font-style`, `:624` `mix-blend-mode`, `:676` `text-decoration-line`, `:1992` `text-transform`, `:1993` `font-style`, `:1996` `text-decoration-line`, `:2006` `list-style-type`, `:2089` `object-fit` — each a bare `${…}` interpolation of the instance value. `grep -n cssEnum packages/framework/src/l1/render.ts` returns **0 hits**; no enum guard exists anywhere in the file, in contrast to the `cssColor` / font-family / URL sanitisers that do. *(Line numbers have shifted from REPORT-1727's — REQ-136 inserted the framing and filter emitters around `:2089` — but the pattern is identical and was re-located this cycle.)* `test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised` (`tests/reconciliation-l1-substrate.test.ts:302`) renders an **unvalidated** document — exactly the AC's premise — but carries payloads only in `text`, `alt`, `src` and `fontFamily`, so the AC's strongest sentence is asserted only over the families that are in fact protected. **Exposure is bounded**: `validateL1` (Layer 1) rejects an enum breakout and is genuinely in the production path, so no shipped site is at risk. **DOC-2 §2 enumerates the Layer-2 guarantees as text / colour / font-family / length / image-src — enums are not among them**, so policy and code agree and the AC over-claims | Narrow AC-685 ¶1's "even if bypassed" claim to the value families DOC-2 §2 guarantees at Layer 2, and drop "closed-enum" from ¶2's re-derivation list, keeping enums a Layer-1 (schema) guarantee. If the operator prefers the stronger reading this becomes a `code-issue`: re-check each enum against its closed set at emit time, same shape as `cssColor`. **Decide before touching the test** — the decision determines whether `test_UAT_AC685_*` must gain an enum payload case |
| 2 | violation | coverage | `test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed` (`tests/reconciliation-nowrap-width-floor.test.ts:428`) | uat-edit | **Third cycle** (REPORT-1674 F2 → REPORT-1727 F2), re-read line by line this pass. AC-1012's Verification is browser-based *and* adds "…**and that the same document's round-trip fidelity against the original capture is unchanged**". Two gaps. **(a)** The measurement arm sits behind a bare `if (!HAVE_CHROMIUM) return` at `:460` — an early return, so when chromium is absent the test reports **pass**, not skip, and the green result overstates what was proven. What executes unconditionally is a stylesheet-equality proxy (`strip()` at `:453-459` removes `width`/`min-width` declarations and compares the rest) — a good argument, but not the AC's criterion, which is *measured bounding boxes*. **(b)** The **round-trip fidelity clause is exercised by no arm at all**, engine or not: the fixture is a synthetic `multi(LADDER.map(…))` document built inline at `:429-439` with **no original capture** to compare against, and the only occurrence of the word *fidelity* in the whole file is a comment at `:474`. The clause is unreachable as written | Either (i) add a fidelity assertion against a real folded capture — the shape `test_UAT_AC683_*` already uses — and convert the gate to `it.runIf(HAVE_CHROMIUM)` on a separate browser-arm test so an unexercised arm reports as **skipped**; or (ii) narrow AC-1012's Verification to drop the fidelity clause and state the stylesheet-equality proxy as the engine-free arm. Resolve alongside Finding 3 — same file, same gate |
| 3 | warning | consistency | `test_UAT_AC1009_*` (`tests/reconciliation-nowrap-width-floor.test.ts:228`) and `test_UAT_AC1011_*` (`:410`) | uat-edit | Same silent-gate pattern at two more sites, both still bare `if (!HAVE_CHROMIUM) return`. **Warning rather than violation** because — unlike Finding 2 — the engine-free arms here are substantive and directly prove each criterion's main clause (per-rung `min-width` with a `width: auto` reset, threshold gating, the extrapolation guard). The contrast that makes this fixable: AC-683 and AC-688 use `it.runIf(...)` (around `:498` in `reconciliation-l1-substrate.test.ts`) and correctly surface as **skipped**, so the runner reports honestly; `if (!HAVE_CHROMIUM) return` cannot | Convert all three sites to `it.runIf(HAVE_CHROMIUM)` on a separate browser-arm test, or split each UAT into an engine-free and an engine-gated half, so an unrun arm is never reported as a pass |
| 4 | warning | consistency | `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` (`tests/reconciliation-behavior-modules.test.ts:556`) | uat-edit | **Third cycle** (REPORT-1316 F3 → REPORT-1674 F4 → REPORT-1727 F6). The negative arm still mocks an **internal** module — `vi.doMock('../packages/framework/src/index', …)` at `:556`, overriding `getModuleClientJs` to `() => ''` — to prove "no client behaviour in the catalog ⇒ no asset and no script reference". TEST-STRATEGY forbids mocking internal components; the test's own comment at `:549-551` acknowledges the substitution. Mitigating and unchanged: the positive arm runs the entire real pipeline (`cmdNew` + `cmdRender`, real catalog, real filesystem) and carries every substantive claim; the test guards vacuity at `:574` with `expect(getModuleClientJs().length).toBeGreaterThan(0)`; and `cmdRender(slug, opts)` still accepts no catalog/resolver injection, so there is no unmocked route to the empty-catalog branch. This remains the **only** internal mock among the capability's 100 UATs | Add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule`, and drop the mock — or record in AC-702 that the empty-catalog arm is proven against a substituted catalog by construction. Low urgency: no claim is currently unproven. *(Note for a later reader: the `capabilities.js` filename this test asserts is **not** REQ-87 rename residue — AC-702's body pins it deliberately as a plural bundle-output filename. Do not "fix" it.)* |
| 5 | warning | consistency | `test_UAT_AC718_contact_form_presentation_via_config_and_l1_controls` (`tests/reconciliation-reproduction-treatments.test.ts:126`) vs AC-718 `acceptance_criterion-f3328e22` | defer to **ac-deprecate** (ac-level owns it) | **New framing this cycle, and it corroborates the ac-level recommendation.** The usual drift is a stale test against a current AC; here it is the reverse — **the test has moved past its own AC.** The test asserts the post-REQ-96 truth: `submitLabel` is a live config key (`:133`), the retired dials `fieldLabels` / `submitInline` / `submitColor` are gone (`:136`), the submit button is an L1 **`control` leaf** carrying `surfaceFill` (`:154`), it renders as `<button … type="submit">` painted by an L1 class (`:160`), and no `contact-form__submit` module class survives (`:164`). AC-718 still says the opposite — `intro`/`submit` **slots**, config carrying "only `action`, `fields`, `successMessage`", and the runtime type "capability" throughout. So the UAT does **not** exercise what its AC claims, and the test is the correct party. This is the fourth-cycle AC-718 drift that `report-d0196843` finding 1 documents, seen from the evidence side — and it is independent support for that report's finding 4 (**deprecate** AC-718 rather than edit it): the test already proves what **AC-701** states, which is precisely why a faithful edit of AC-718 would reproduce AC-701 clause for clause | **No test edit.** The test is correct; the AC is stale. Take `report-d0196843` finding 4: deprecate AC-718 and AC-719, folding the pivot supersession into STORY-82's body. When that lands, retarget or retire this test file with the ACs it serves, and clear the retired word "capability" from its header comment (`:9`, `:15-16`) and describe string (`:117`) |
| 6 | warning | exclusivity | `test_UAT_AC930_one_rgb_at_several_alphas_collapses_to_one_entry_exactly` (`tests/reconciliation-colour-palette-overlay.test.ts:277`) vs `test_UAT_AC942_one_rgb_at_three_opacities_becomes_one_entry` (`tests/reconciliation-colour-census-and-retrofit.test.ts:404`, STORY-97 `story-5e7eb0c5`, capability-b4ac88fc) | uat-edit (+ one-line ac-edit) | Carried from REPORT-1674 F5 / REPORT-1727 F4; both tests still present, same shape, cross-capability. Both stage a site carrying one RGB at three opacities, run the real `cmdColors` then `cmdColorsAssign`, and assert the three literals collapse to exactly one opaque palette entry with each reference resolving back to the literal it replaced. **Downgraded in confidence this cycle for two reasons the earlier reports did not weigh.** (i) AC-930's own Verification *prescribes* the conversion drive — "**Convert** a site's colour literals that share one RGB at differing alphas and confirm they collapse to a single palette entry" — so the test is faithful to its AC, and the redundancy is inherited from the AC pair, not introduced by the test. (ii) The test carries real distinct content STORY-97's does not: the whole-byte-range exactness loop at `:332-337` (all 255 alpha bytes round-trip through `resolveL1Color`) and the opaque-reference case at `:340`, which prove AC-930's third paragraph and belong to the value model rather than to the retrofit | Retarget `test_UAT_AC930_*` at the axis AC-930 uniquely owns — a reference carrying its own alpha resolves to the right literal, asserted through `validateL1` + `resolveL1Color` at the load boundary, keeping the byte-range exactness loop — and drop the `cmdColors` / `cmdColorsAssign` drive, leaving the conversion to STORY-97. Because the AC's Verification currently mandates that drive, this needs a matching one-line `ac-edit` on AC-930 |
| 7 | warning | coverage | AC-686 `acceptance_criterion-33ecc306` ¶2 and AC-687 `acceptance_criterion-c9b3f600` ¶2 (`tests/reconciliation-l1-substrate.test.ts:341`, `:451`) | ac-edit (do **not** uat-add) | Carried from REPORT-1674 F7 / REPORT-1727 F7; re-read this cycle. Both ACs carry a second Verification clause neither test exercises. AC-686 asks for a representative violation repeated "as an **authored page inside a site definition**"; the test's only entry point is `const accepts = (doc) => validateL1(doc).ok` (`:342`) — standalone `validateL1`, no `validateSite`, across all twelve of its rejection cases (`:368-440`). AC-687 asks that "every reported path is prefixed into that page's L1 body" (e.g. `/pages/0/l1/root/children/2/…`); the test asserts only the bare `/widths/1`, `/root/children/0/axes/fontSizePx`, `/root/children/1/src` (`:486-488`). **The behaviour is proven elsewhere** — `test_UAT_AC849_*` in `reconciliation-l1-authoring-envelope.test.ts` asserts `/pages/0/l1/…`, the multi-page `/pages/1/l1/…` case, and `multiPaths.every(p => p.startsWith('/pages/1/l1/'))` — so this is an **attribution gap, not an evidence gap**, which is why it stays a warning across three cycles | Do **not** write new tests — that would duplicate AC-849/AC-850. Delete the site-definition clause from AC-686's Verification and the page-prefix clause from AC-687's, cross-referencing AC-849/AC-850 which own them |
| 8 | info | consistency + coverage | AC-1124…AC-1128 (STORY-83, REQ-136) → `tests/reconciliation-l1-image-framing.test.ts` | — | **The only new matrix surface since the last uat cycle, and it lands clean.** Five ACs authored 2026-08-12, five substantive UATs, one per AC, no duplicates. Each drives the **real** `validateL1` and `renderL1Document` / `renderL1Fragment` — no mocks, no AST stand-ins, no engine gate. Spot-checked against the criteria: AC-1124's test proves the pair-or-nothing rule, the 0–100 bound with a located field path, absence meaning the browser's own centre rather than a recorded default, and refusal on all four non-image kinds with a positive control that the boundary is the *kind* not the shape (`:140-188`); AC-1125 proves exactly one `filter:` declaration in the renderer's own order, byte-identical across a key-reversed input, CSS-canonical ratios, and coverage of every kind including the `control` leaf via a mounted roster (`:211-258`); AC-1126 proves the identity is per-function (1 for the scaling functions, 0 for the rest) and that each opposing extreme still reaches the page (`:269-319`); AC-1127 proves clip-path geometry is renderer-built, seed-deterministic, bounded, and that an unknown key such as an authored `points` list is refused (`:330-398`); AC-1128 proves the bounds apply identically to interaction states and to every kind (`:449-469`). Nothing to repair | none |
| 9 | info | exclusivity | `test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours` (`tests/reconciliation-colour-palette-overlay.test.ts:467`) | — | **REPORT-1727 finding 5 is resolved — closing it explicitly so a later cycle does not re-open it.** That finding flagged AC-932's UAT as duplicating STORY-97's AC-941/AC-944. AC-932 (`acceptance_criterion-9f1e7baf`) was **moved to STORY-97** (`story-5e7eb0c5`, capability-b4ac88fc) on 2026-08-10 and now carries `uat_coverage: pass` there. It is no longer a CAP-70 element, so the exclusivity conflict is gone — resolved by relocation, which was the correct repair. The test body remaining in a file named `reconciliation-colour-palette-overlay` is cosmetic file placement, not matrix drift, and needs no action | none |
| 10 | info | coverage | `tests/req93-l1-slot-mounted-behaviors.test.ts` (10 UATs) | — (ac-level owns it) | **Logged, not double-counted.** REQ-93 (free_and_reconciled, 2026-07-25) has live code, 10 substantive UATs, and **no AC anywhere in CAP-70**. The tests are named `test_UAT_FC_REQ-93_*` — the free-coded form — so no AC claims them and this level cannot credit them. Confirmed present and unchanged: 10 `it(…)` blocks at `:145`, `:154`, `:222`, `:249`, `:272`, `:334`, `:349`, `:365`, `:396`, `:415`, covering each validation rejection, the two-form clustering on the real capture, config derivation, the mounted render replacing the inert placeholder, and the conformance mount. **This is `report-d0196843` finding 3 (ac-level, `ac-add`), not a separate uat finding** — uat cannot cover an AC that does not exist. It becomes a uat-level violation only if the ACs are authored and these tests are left unrenamed | none at this level — renaming these to `test_UAT_AC<n>_*` closes the ac gap and the uat gap in one pass, once the ACs exist |

## Notes for the Editor

**1. Seven attempts; the findings are older than the attempts.** Finding 1 dates to
REPORT-1316 (2026-08-05) and is now on its fourth cycle; findings 4 and 7 to the same
report; findings 2, 3 and 6 to REPORT-1674. Each was re-located in the working tree
this cycle at the exact file:line cited. **Five of the seven are text edits** — three
`ac-edit` (1, 7, and the one-line half of 6), two `uat-edit` (2/3, and the retarget
half of 6) — and one (5) is a *decision already made at the ac level* that needs
executing rather than re-deciding. Only Finding 1 has a branch that touches
production code, and that branch is explicitly the operator's call.

**2. The suite being green has never been the signal here, and this cycle I could
not check it at all.** REPORT-1727 ran all 18 files green while carrying six of these
same seven findings; the suite will stay green through every one of the repairs
above, because each is about an assertion that is missing, a gate that hides a skip,
or a mock that shouldn't be there. A fix loop that re-runs the suite and reports
success will not converge. See the execution-limitation section — I did not run the
suite and am not claiming its current state.

**3. Finding 1 needs an operator decision before any test edit.** It is the one
finding where the AC and the code genuinely disagree, and DOC-2 §2 sides with the
code. Editing `test_UAT_AC685_*` to add an enum payload would turn a green test red
against behaviour that policy does not require. Narrow the AC first, or accept the
`code-issue` reading and add the emit-time enum guard — but decide before touching
either. Note the AC over-claims in **two** places, not one: ¶1's "even if bypassed"
sentence and ¶2's inclusion of "closed-enum" in the re-derivation list.

**4. Finding 5 is the useful new signal this cycle.** AC-718's *test* is already
correct post-REQ-96 while its *AC* is not. That is independent evidence for the
ac-level cycle's changed recommendation (deprecate AC-718/AC-719 rather than edit
them): the evidence layer has already voted, and it voted for AC-701's wording. Four
ac cycles prescribed `ac-edit` and produced no edit; the fifth should not repeat it.

**5. Archived ACs remain a trap for this capability.** A raw filesystem walk of
`.xgd/tickets/**` returns far more ACs for these 7 stories than are live: the
AC-660…AC-681 and AC-717 block is **archived**, being precisely the module-dial ACs
REQ-84 and REQ-85 retired, and their tests were removed by commits `47aba3435` and
`d37af07ca`. A scan that misses the archived split will report ~21 ACs with no UAT
and propose `uat-add` for behaviour whose implementation no longer exists — an
unsatisfiable instruction. **The retirement is correctly recorded; do not re-open
it.** Use `xgd ticket list` / `query`, which exclude archived by default. AC-932
(Info 9) is the inverse trap: still `active`, but no longer this capability's.

**6. Sequencing.** Findings 1, 2, 3, 6 and 7 are independent of the story/ac cascade
and can be repaired now. Finding 5 waits on the ac-level deprecation of AC-718/719.
Info 10 waits on ac-level `ac-add` for REQ-93 — and when those ACs are authored,
rename the 10 existing tests rather than writing new ones.
