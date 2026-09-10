---
uid: report-6de02f6a
id: REPORT-3734
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=uat)'
created_by: xgd
created_at: '2026-09-10T12:57:20.140053+00:00'
updated_at: '2026-09-10T12:57:20.140053+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 1
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

Anchor report: report-e37a6b4a (regression 800a17f7) · Capability: capability-ae9d65d6
(CAP-70) · Previous attempts: 7

Scope: **7 stories** (all `feature` / `upgrade`), **108 ACs** — **105 `active`**, 3
`pending` (AC-1622, AC-1623, AC-1624). The set has not moved since the last uat cycle
(report-96284e49, 12:33 today): same 108, same 3 pending. What moved is the evidence
layer — attempt 7 landed 13 mutations across two calls (REPORT-3732, REPORT-3733).

**All seven findings from report-96284e49 are verified closed** (Info 8 below records
the evidence for each, individually re-checked rather than accepted on the fix
report's word). **Coverage remains complete by count**: every one of the 105 active
ACs has at least one `test_UAT_AC<n>_*` definition, by a whole-repo walk of
`.ts`/`.tsx`/`.js`/`.mjs`/`.jsx` excluding `node_modules`, `dist`, `dist-assets*`.

The one violation is **new this cycle and introduced by attempt 7's own AC-685 edit**:
that edit moved the closed-enum guarantee from the emitter to the envelope validator
and delegated its evidence to two named ACs — neither of whose tests exercises it. The
three warnings are two further instances of the silent-engine-gate defect attempt 7
repaired in one file but not the other two, plus one word of retired vocabulary its
verification grep could not match.

## ⚠ Execution: what I ran, and what the sandbox refused

I ran **21 of the capability's 22 test files**; the 22nd (`*.workers`) cannot start
here.

| Run | Outcome |
|---|---|
| 5-file batch (nowrap-width-floor, colour-palette-overlay, reproduction-treatments, behavior-modules, l1-substrate) | **26 passed / 5 skipped / 1 failed** — the 5 skips are AC-683, AC-688 (pre-existing `it.runIf`) and AC-1009, AC-1011, AC-1012's newly split browser arms; the failure is AC-703, sandbox |
| 15-file batch (l1-language, l1-shared-axis-groups, l1-authoring-envelope, l1-control-and-texture, l1-image-framing, colour-shade-axis, behavior-l1-composition, behavior-module-escaping, contact-form-enhancement-gate, absolute-value-literals, l1-navigation, l1-one-colour-system, l1-pointer-accent, l1-interaction-and-motion, responsive-layout-track) | **73 passed / 0 skipped**, 1.52 s — see Findings 2 and 3; `0 skipped` **is** the evidence |
| `reconciliation-l1-relocatable-output` | 3 passed / **1 failed** — AC-888, sandbox |
| `reconciliation-behavior-edge-runtime.workers` | **could not start** — sandbox |

**The three failures/non-starts are one sandbox restriction, not a code or test
defect**, and none is raised as a finding — same verdict, same reasoning, as the last
cycle. `test_UAT_AC703_*` dies in `startServe` → `serveOneModulePage`
(`tools/generate/src/conformance/harness.ts:196`) with `listen EPERM … 0.0.0.0`;
`test_UAT_AC888_*` at `tests/reconciliation-l1-relocatable-output.test.ts:169` with the
same on `0.0.0.0`; the workerd project dies before vitest starts, `listen EPERM …
127.0.0.1`. Each of the first two then times out at 60 s. All three are substantive
tests against real entry points and need only a runner with socket-bind permission.

Chromium is likewise unavailable (a known Mach-bootstrap sandbox refusal, not a missing
browser). As last cycle, **that absence is what makes Findings 2 and 3 measurable**:
the 15-file batch reporting `73 passed | 0 skipped` in 1.52 s is a suite in which two
browser arms silently did not run and nothing said so.

## Cumulative Intent Considered

At `uat` level the **AC body is the working reference**. The ac-level cycle closed
**PASS / 0 violations** (report-3d016242, 12:20 today), so the cascade precondition is
met and the ledger below is **inherited from report-96284e49 and re-checked for
movement — there is none** (no story's `updated_at` is later than 12:00 today; no
`intent_uid` / `updated_by` on any story changed).

Intent was consulted for one element only: **AC-685**, where attempt 7 rewrote the
criterion's layer assignment. DOC-2 §2 and the Security Policy (§2 "Layer 1 — the
schema + envelope validator … Every axis is a typed scalar or a **closed enum**") are
the references that settle Finding 1.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`: REQ-79/82/83/84/85 + 2) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; behavior modules with typed config + named L1 slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; no back-compat alias | YES — see Finding 4 |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-schema slot binding; `mountInL1`; contact-form `labelMode` | YES — evidence exists, still unclaimed (Info 9) |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Resource table + `@font-face`; captured pixel-mover axes | YES — see Finding 2 |
| BUNDLE-11 (`bundle-ee56a66e`: REQ-96/97/98 + 12) | free_and_reconciled | 2026-08-05 | `control` leaf; contact-form single required `form` slot; shared axis groups; zero-CSS obligation | YES |
| REQ-99 / REQ-100 / REQ-108 | free_and_reconciled | 2026-08-06 | Typed interaction state, scroll reveal, pointer accent; renderer safety floor | YES |
| REQ-103…REQ-107 | free_and_reconciled | 2026-08-06 | Texture + radial gradients; per-width layout track + wrapping row; typed link role; `validateL1` on the authoring path | YES |
| BUG-28 / REQ-109 / BUG-30 | free_and_reconciled | 2026-08-06 | Enhancement isolation; relocatable document-relative URLs | YES |
| REQ-114 / REQ-117 | free_and_reconciled | 2026-08-07 | L1 palette colour model, closed colour-**role** vocabulary deleted; nowrap width becomes a floor | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape vocabulary / colour adjustment | YES |
| REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-13 | Palette entry is one colour: continuous Oklab `shade` | YES |
| REQ-148 (BUNDLE-20) | free_and_reconciled | 2026-08-15 | Behavior modules are plain functions rendering in workerd; module chrome into the page stylesheet | YES |
| BUNDLE-6 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-17 | Pre-pivot reproduction treatments (superseded in place by the pivot) | YES (superseded) |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |
| REQ-154 / BUG-39 | bundled | 2026-08-31 | Browser Rendering driver; node chat-host streaming | NO — other capabilities |

## Alignment Ledger

One row per test file — the unit at which these UATs are organised. Every file reaches
real entry points: `validateL1` / `validateSite` / `loadSite`, `renderL1Document` /
`renderL1Fragment` / `renderL1Page`, `validateBehaviorConfig` / `Slots` / `Controls` /
`Instance`, the real `getModule` registry, the real `cmdNew` / `cmdRender` /
`cmdColors` / `cmdColorsAssign` against the real filesystem, `foldToL1`,
`resolveL1Color` / `shadeHex`, real workerd, and JSDOM browsing contexts. **No test in
this capability stands on a structural/AST stand-in where a behavioural probe belongs**
— the one file that reads source text (`reconciliation-behavior-modules.test.ts:730`,
`:752`) does so for AC-722's *type names*, which erase at runtime and have no other
observable form, and drives the runtime registry, the real validators and a real failed
import alongside.

| Test file (ACs) | Intents aligned to | Outcome |
|---|---|---|
| `reconciliation-l1-substrate` (682–688, 723) | REQ-82, REQ-87, REQ-93 | **685's enum delegation lands nowhere (Finding 1)**; **684's browser block silently skipped (Finding 3)**; 686 / 687 repaired and aligned (Info 8); 683 + 688 `it.runIf`-gated, observed **skipped** — honest |
| `reconciliation-l1-language` (725–728) | REQ-90, REQ-91 | **727's browser arm reports pass, not skip (Finding 2)**; **726 carries no enum case (Finding 1)**; 725, 728 aligned |
| `reconciliation-nowrap-width-floor` (1009–1012) | REQ-115/117 | **repaired — all three arms split, observed 3 skipped (Info 8)** |
| `reconciliation-colour-palette-overlay` (928–931) | REQ-114, REQ-137 | **repaired — 930 retargeted, cross-capability duplicate gone, net-additive (Info 8)** |
| `reconciliation-reproduction-treatments` (718, 719) | REQ-84, REQ-96, REQ-93 | 718 repaired (`slots.form.required` asserted); **one vocabulary word left (Finding 4)**; 719 aligned |
| `reconciliation-behavior-modules` (697–704, 722, 809, 810) | REQ-85, REQ-87, REQ-96 | 702's teardown repaired and the substitution declared in the AC (Info 8); 703 unverifiable here (sandbox) |
| `reconciliation-behavior-edge-runtime.workers` (1412, 1413) | REQ-148 | aligned by inspection; **could not execute (sandbox)** |
| `reconciliation-behavior-module-escaping` (1414) | REQ-148 | aligned — real `getModule(...).Component`, payloads in both sinks, escape and refusal paths held apart |
| `reconciliation-colour-shade-axis` (1144, 1145) | REQ-137 | aligned |
| `reconciliation-l1-image-framing` (1124–1128) | REQ-136 | aligned |
| `reconciliation-l1-shared-axis-groups` (685 ¶2, 801–805) | REQ-97, REQ-98, REQ-105 | aligned |
| `reconciliation-l1-control-and-texture` (806, 807, 829–832) | REQ-96, REQ-103 | aligned |
| `reconciliation-l1-authoring-envelope` (849–851) | REQ-107 | aligned — owns the `/pages/N/l1/…` prefixing AC-686/AC-687 now cross-reference |
| `reconciliation-l1-relocatable-output` (888–891) | BUG-30, REQ-109 | aligned; **888 unverifiable here (sandbox `listen` EPERM)** |
| `reconciliation-l1-one-colour-system` (933–936) | REQ-114 | aligned |
| `reconciliation-absolute-value-literals` (716) | REQ-84 | aligned |
| `reconciliation-responsive-layout-track` (833–838) | REQ-104 | aligned |
| `reconciliation-behavior-l1-composition` (808, 811) | REQ-96 | aligned |
| `reconciliation-contact-form-enhancement-gate` (877, 878) | BUG-28 | aligned — the one `vi.spyOn` fakes a **DOM API** (external boundary), which TEST-STRATEGY permits |
| `reconciliation-l1-interaction-and-motion` (819–828) | REQ-99, REQ-100 | aligned |
| `reconciliation-l1-pointer-accent` (879–887) | REQ-108 | aligned |
| `reconciliation-l1-navigation` (839–848) | REQ-106 | aligned |
| *`req93-l1-slot-mounted-behaviors` (no active AC)* | REQ-93 | 10 substantive UATs, still FC-named and unclaimed (Info 9) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-685 `acceptance_criterion-62adf959` (Verification, final sentence) → `test_UAT_AC686_envelope_boundary_is_the_range_not_the_property` (`tests/reconciliation-l1-substrate.test.ts:341`) and `test_UAT_AC726_structured_axis_violations_rejected_with_offending_path` (`tests/reconciliation-l1-language.test.ts:178`) | uat-add | **New this cycle, and created by attempt 7's own repair.** Closing the 5-cycle Finding 1 was correct in substance — DOC-2 §2 does not list enums among the Layer-2 guarantees — but the edit did two things: it moved the closed-enum guarantee onto Layer 1 ("A **closed-enum** axis is bounded by the schema instead … the envelope validator — not the emitter — is what stands between a free-typed enum value and the stylesheet"), and it delegated the evidence, closing the Verification with "an out-of-vocabulary enum is a validator rejection, pinned by the envelope-rejection criteria (AC-686 and the structured-axis rejection criterion)". **Neither named test carries an enum case.** AC-686's `rejected` map (`:368-440`) has 11 entries — font-size and font-weight range, out-of-range geometry coordinate, non-finite number, non-hex colour, disallowed image scheme, unknown key, undeclared keyframe width, non-ascending keyframes, non-ascending ladder, depth cap, node-count cap — plus the `behavior`/`capability` unknown-key pair; no enum. AC-726's cases (`:181+`) are non-hex gradient stop, non-hex border colour, `javascript:` and `data:` background image, and three shadow ranges; no enum. A repo-wide search for an out-of-vocabulary enum payload (`objectFit`/`textTransform`/`mixBlendMode`/`layout`/`shape` set to a non-member) returns **nothing**; the nearest miss, `tests/reconciliation-l1-shared-axis-groups.test.ts:366`, rejects `objectFit` on a *text* node — a wrong-node-kind rule, not a vocabulary rule. **The code side is sound** — `packages/site-schema/src/l1/schema.ts` declares these as `z.enum` (`:271` layout mode, `:546` blend mode, `:959` text-transform, `:960` font-style, `:1025` object-fit, and ~15 more) — so this is `uat-add`, **not** `code-issue`. But it is now the *only* line holding for enum axes (`render.ts` still interpolates them raw, 0 hits for an enum guard), it is what the Security Policy §2 names as the Layer-1 invariant, and **no UAT in this capability proves it fires** | Add one entry to AC-686's `rejected` map — e.g. `outOfVocabularyEnum: { widths: WIDTHS, root: { kind: 'text', text: 'x', axes: { textTransform: 'rotate(1deg);color:red' } } }` — and, if AC-687's path list is extended alongside, assert its reported path is `/root/axes/textTransform`. One entry closes it; no AC edit is needed, because AC-685's delegation becomes true the moment the case exists |
| 2 | warning | consistency | `test_UAT_AC727_resource_table_emits_font_face_rules_ahead_of_use_and_binds_the_face` (`tests/reconciliation-l1-language.test.ts:486`, gate at `:562`) | uat-edit | The **same silent-gate defect** attempt 7 repaired in `reconciliation-nowrap-width-floor`, still live here: a bare `if (!chromiumReady || !FONT_ASSET) return` tail, so with no engine the test *returns* and the runner reports **pass**. My 15-file run is the evidence — `73 passed`, **`0 skipped`**, 1.52 s, with this file among them. It is worse than the AC-1009 case in one respect: **both the AC and the file promise a skip that never happens.** AC-727's Verification ends "Skips cleanly where no engine or font asset is available", and the file's own comment at `:449` says "the probe skips cleanly when none is present". What the gated arm alone proves is the criterion's second paragraph — "a text leaf naming a bound family paints in that face at that face's own glyph metrics, rather than falling back to a generic serif" — measured as a Range run-width delta against the no-table render. **Warning, not violation**, on the same calibration report-96284e49 applied to AC-1009/AC-1011: the engine-free arm is substantive and proves the criterion's main clauses directly (one `@font-face` per entry, quoted sanitised family, allowlisted escaped URL, derived `format()`, `font-display: swap`, rules emitted ahead of use, and five distinct unsafe entries each producing no rule with the brace count still balanced) | Convert to `it.runIf(chromiumReady && FONT_ASSET !== null)` on a separate browser-arm test, exactly as attempt 7 did for AC-1009/1011/1012 — the fixture and `serveWithFont` helper are already hoisted, so the split is mechanical. Then the AC's and the comment's "skips cleanly" become true |
| 3 | warning | consistency | `test_UAT_AC684_geometry_keyframes_interpolate_and_snap_per_viewport` (`tests/reconciliation-l1-substrate.test.ts`, gate at `:263`) | uat-edit | Third instance of the same class, in a slightly different shape: not a bare `return` but `if (chromiumReady) { … }` wrapping ~30 lines of assertions, so the block silently does not run and the test reports **pass**. AC-684's Verification does not hedge — "**Confirm with a real-browser capture** that an interpolate wordmark moves and widens across the ladder while endpoints match the authored keyframes within ~2px" — and that confirmation ran in neither of my batches. **Warning, not violation**, same calibration: the engine-free arm proves each clause of the criterion directly off the emitted stylesheet (base rule holds the smallest keyframe, the interpolate band emits `calc(300px + (300 * (100vw - 320px) / 448))`, the snap band holds `600px` with no `100vw` term, the next breakpoint jumps with no `calc(`). **The tool is already in the file**: `const itChromium = it.runIf(chromiumReady)` at `:164`, used by AC-683 — which is why that same file honestly reported 2 skips in my run while this block passed in silence | Move the `if (chromiumReady)` block into a separate `itChromium('test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser', …)`, hoisting `heroDoc()` as attempt 7 hoisted `uneditedFixture()`. Resolve alongside Finding 2 — same defect, two files |
| 4 | warning | consistency | `tests/reconciliation-reproduction-treatments.test.ts:33` | uat-edit | One word of retired REQ-87 vocabulary survived attempt 7's sweep: the comment reads "the module catalog holds only the two survivor **capabilities**". REPORT-3732 reported the file clean on the strength of `grep -n capability` → 0 hits — a case-sensitive search for the singular, which cannot match `capabilities`. Cosmetic and assertion-free (the line below it asserts the real registry keys), raised only so the closure is honest and the sweep is not re-run with the same too-narrow pattern. Verified this is the file's **only** residue, and that the other `capabilit*` hits in the capability are all deliberate: `reconciliation-behavior-modules.test.ts` pins the `capabilities.js` bundle filename AC-702 mandates and asserts the absence of every `Capability*` identifier; `reconciliation-l1-substrate.test.ts:357-365` asserts the legacy `capability` slot key is *rejected*, and `:588` that no `data-l1-capability` attribute survives | Replace "capabilities" with "behavior modules" at `:33`. Sweep with `grep -in capabilit`, not `grep -n capability` |
| 5 | info | consistency + coverage | All 7 findings of report-96284e49 | — | **Each re-verified independently, not accepted on the fix report's word.** (1) **AC-685** narrowed: ¶1's bypass claim is now scoped to "text, colour, font-family, length and image source" citing DOC-2 §2, ¶2's re-derivation list drops "closed-enum" — correct in substance, but see Finding 1 for what the delegation left behind. (2) **AC-1012** — the fidelity clause is gone from the AC and cross-referenced to AC-683; the test is split at `:498` (engine-free stylesheet-equality) and `:525` (`it.runIf(HAVE_CHROMIUM)`, per-node box comparison at every ladder width). (3) **AC-1009 / AC-1011** split the same way at `:213`/`:252` and `:429`/`:453`; `grep "if (!.*) return"` over the file returns **0 hits**, and the file reported 3 skips in my run. (4) **AC-702** — `vi.doUnmock('../packages/framework/src/worker')` at `:471` now names the path the arm actually mocks, and the AC declares the substituted-catalog premise plus the seam that would retire it; the substitution spreads `importOriginal()` and overrides only `getModuleClientJs`, with the whole pipeline, CLI and filesystem real and a vacuity guard at the end. Accepting the "record it" option as sufficient, per the last cycle's own offer. (5) **AC-930** retargeted and renamed — the `cmdColors`/`cmdColorsAssign` drive that duplicated STORY-97's `test_UAT_AC942_*` is gone; what replaced it authors the shape through the real `validateSite` / `loadSite` / `resolveL1Color` / `shadeHex`, keeps the whole-byte-range exactness loop, and adds the criterion's ¶4 (neither reference axis displaces the other), which no arm previously reached. Its residual overlap with AC-931's load-boundary assertion is a vehicle, not a duplicate scenario. (6) **AC-686 / AC-687** — the site-definition and page-prefix clauses are out of both Verifications, retained as context with ownership assigned to AC-849/AC-850, whose test does assert `/pages/0/l1/…` and the multi-page case; no duplicate tests were written. (7) **AC-718** — `expect(contactFormMeta.slots.form.required).toBe(true)` present at `:141` | none |
| 6 | info | coverage | 105 active ACs vs `test_UAT_AC<n>_*` definitions | — | Coverage is complete by count, unchanged from last cycle. Six ACs now carry two definitions each: AC-685 (two payload families in two files), and AC-1009 / AC-1011 / AC-1012 (engine-free + engine-gated halves, created by attempt 7). **All are legitimate splits, not duplicates** — the engine-gated halves assert what only a browser can measure. AC-683 and AC-688 remain the two a naive `it('test_UAT_AC…` sweep misses; both are `it.runIf`-declared and were observed skipped | none |
| 7 | info | coverage | `tests/req93-l1-slot-mounted-behaviors.test.ts` (10 UATs) vs AC-1622 / AC-1623 / AC-1624 | — (ac-level owns it) | Unchanged watch item, carried from report-96284e49 Info 9. All three ACs are still `pending`, so this level neither requires nor can credit them, and the tests are still FC-named (`test_UAT_FC_REQ-93_*`), so no AC claims them. **This becomes a uat-level violation the moment those three ACs go `active` while the tests stay unrenamed** — the evidence already exists and needs no new assertions, only the rename | none at this level |
| 8 | info | — | `uat_coverage` fields across the capability's ACs | — | Stale and inconsistent with what the tests actually show: AC-1012 reads `fail` though both its arms now exist and the engine-free one passes; AC-1144, AC-1145, AC-1412, AC-1413, AC-1414 read `None` though each has a substantive test (and three of them ran green in my batches). Recorded as an observation only — **that field is owned by check/fix_uat_coverage and must not be set from this level** | none |

## Notes for the Editor

**1. Attempt 7 converged on everything it was given.** All 13 mutations across
REPORT-3732 and REPORT-3733 verify clean, and the two structural predictions the last
cycle made both came true: `reconciliation-nowrap-width-floor` reports *fewer* passes
(4 passed / 3 skipped, where it reported `4 passed (4)` in 14 ms), and AC-930's
retarget was net-additive. That is real progress; three of the four findings below are
smaller than anything in the previous report.

**2. Finding 1 is what a correct repair left behind, and it is the only violation.**
Closing the enum question by narrowing AC-685 was the right call — DOC-2 §2 and
`schema.ts` both back it. But the narrowing relocated a guarantee onto a layer whose
enforcement no UAT exercises, and then cited two ACs as its evidence. Adding one entry
to AC-686's existing `rejected` map makes the citation true and pins the Security
Policy §2 invariant that currently stands unproven. **Do not** reach for `code-issue`:
the enums genuinely are `z.enum` and genuinely do reject.

**3. Findings 2 and 3 are the same defect attempt 7 already knows how to fix.** The
silent-gate repair was applied to one file; three arms in two other files have the same
shape. `test_UAT_AC684_*` is the easy one — `itChromium` is defined nine lines above
the offending block and already in use by AC-683 in the same file. As last cycle,
**the success condition is a lower pass count**: after these two splits the 15-file
batch should report 73 passed / 2 skipped, and `reconciliation-l1-substrate` 3 skips
rather than 2.

**4. Greenness is still the counter-signal.** `73 passed | 0 skipped` in 1.52 s across
15 files is the number that produced Findings 2 and 3. A fix loop that re-runs the
suite and reports success will not converge on either; both survive a green suite by
construction.

**5. Three UATs cannot be verified in this sandbox, and none is a finding.**
`test_UAT_AC703_*`, `test_UAT_AC888_*` and the whole `*.workers.test.ts` project each
bind a local socket and are refused with `listen EPERM` (`0.0.0.0`, `0.0.0.0`,
`127.0.0.1`). All three are well-written tests against real entry points. If a future
cycle sees these failures, **do not repair them** — check the environment first. Nor
should a green run elsewhere be read as having covered them.
