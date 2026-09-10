---
uid: report-735ce8ed
id: REPORT-3736
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=uat)'
created_by: xgd
created_at: '2026-09-10T13:12:13.155406+00:00'
updated_at: '2026-09-10T13:12:13.155406+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a (regression 800a17f7) · Capability: capability-ae9d65d6
(CAP-70) · Previous attempts: 8

Scope: **7 stories** (all `feature` / `upgrade`), **108 ACs** — **105 `active`**, 3
`pending` (AC-1622, AC-1623, AC-1624). The set has not moved since report-6de02f6a:
same 108, same 3 pending, and **no AC ticket has an `updated_at` later than 12:44
today** — attempt 8 (13:02) edited no AC and no story body, exactly as it reported.

**All four findings of report-6de02f6a are verified closed**, each re-derived from the
diff and from a live run rather than accepted on the fix report's word (Info 1). The
one violation of the last cycle — AC-685's enum delegation landing nowhere — is closed
by a substantive probe, not a token map entry. **Coverage remains complete by count**:
every one of the 105 active ACs has at least one `test_UAT_AC<n>_*` definition, by a
whole-repo walk of `.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs` excluding `node_modules`,
`dist`, `dist-assets*`, `.git`, `.xgd` (134 files carry such names; 22 carry this
capability's).

I found **nothing new**. The silent-engine-gate defect class that produced three
findings across the last two cycles is now **swept clean across all 22 files** (Info 2)
— this is the first cycle in which that sweep returns nothing.

## ⚠ Execution: what I ran, and what the sandbox refused

I ran **21 of the capability's 22 test files**; the 22nd (`*.workers`) cannot start here.

| Run | Outcome |
|---|---|
| 5-file batch (l1-substrate, l1-language, reproduction-treatments, nowrap-width-floor, colour-palette-overlay) | **21 passed / 7 skipped (28)**, 1.08 s |
| 14-file batch (l1-shared-axis-groups, l1-authoring-envelope, l1-control-and-texture, l1-image-framing, colour-shade-axis, behavior-l1-composition, behavior-module-escaping, contact-form-enhancement-gate, absolute-value-literals, l1-navigation, l1-one-colour-system, l1-pointer-accent, l1-interaction-and-motion, responsive-layout-track) | **69 passed / 0 skipped (69)**, 1.60 s |
| behavior-modules + l1-relocatable-output | **12 passed / 2 failed** — AC-703 and AC-888, both sandbox |
| `reconciliation-behavior-edge-runtime.workers` | **could not start** — sandbox |

Totals: **102 passed / 7 skipped / 2 failed** across 21 files.

**The 7 skips are the whole point of the last two cycles' repairs, and they are the
verification that attempt 8 landed.** The 15-file set the last cycle ran reported
`73 passed | 0 skipped`; the identical tests now report **73 passed / 1 skipped** (my
14-file batch's 69 plus l1-language's 4 passed and 1 skipped), and
`reconciliation-l1-substrate` reports **3** skips where it reported 2. That is exactly
the structural prediction report-6de02f6a made ("the success condition is a lower pass
count"), realised. The 7 gated arms, each `it.runIf`-declared and each observed
skipping rather than passing: AC-683, AC-684-browser, AC-688 (l1-substrate),
AC-727-browser (l1-language), AC-1009/1011/1012-browser (nowrap-width-floor).

**The two failures and the one non-start are one sandbox restriction, not a code or
test defect** — third consecutive cycle with the same verdict, re-measured not
inherited. `test_UAT_AC703_*` dies in `startServe` → `serveOneModulePage`
(`tools/generate/src/conformance/harness.ts:196`) with `listen EPERM … 0.0.0.0`;
`test_UAT_AC888_*` at `tests/reconciliation-l1-relocatable-output.test.ts:169` with the
same; the workerd project dies before vitest starts. Each then times out at 60 s. All
three are substantive tests against real entry points (Info 5) and need only a runner
with socket-bind permission. Chromium is likewise unavailable (Mach-bootstrap sandbox
refusal, not a missing browser) — which is precisely why the 7 skips are observable.

## Cumulative Intent Considered

At `uat` level the **AC body is the working reference**. The ac-level cycle closed
**PASS / 0 violations** (report-3d016242), so the cascade precondition is met. The
ledger below is inherited from report-6de02f6a and **re-checked for movement — there is
none**: no story's `updated_at` is later than 12:00 today, no AC later than 12:44, and
no `intent_uid` / `updated_by` on any story changed.

Intent was consulted for two elements only: **AC-685** (whose delegation sentence is
what the closed violation turned on) and **AC-726** (its named delegate). DOC-2 §2 and
the Security Policy §2 ("Layer 1 — the schema + envelope validator … Every axis is a
typed scalar or a **closed enum**") are the references that settle Info 3.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`: REQ-79/82/83/84/85 + 2) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; behavior modules with typed config + named L1 slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; no back-compat alias | YES — closed, see Info 1(4) |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-schema slot binding; `mountInL1`; contact-form `labelMode` | YES — evidence exists, still unclaimed (Info 4) |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Resource table + `@font-face`; captured pixel-mover axes | YES — closed, see Info 1(3) |
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
`Instance`, the real `getModule` registry, the real `cmdNew` / `cmdRender` / `cmdColors`
/ `cmdColorsAssign` against the real filesystem, `foldToL1`, `resolveL1Color` /
`shadeHex`, real workerd, and JSDOM browsing contexts. **No test in this capability
stands on a structural/AST stand-in where a behavioural probe belongs** — the one file
that reads source text (`reconciliation-behavior-modules.test.ts:749`, `:757`) does so
for AC-722's *type names*, which erase at runtime and have no other observable form, and
drives the runtime registry, the real validators and a real failed import alongside.
**Evidence validity re-swept this cycle** (Info 6): nine mock sites across the 22 files,
eight of them platform/DOM/network boundaries, one declared internal substitution.

| Test file (ACs) | Intents aligned to | Outcome |
|---|---|---|
| `reconciliation-l1-substrate` (682–688, 723) | REQ-82, REQ-87, REQ-93 | **all three of last cycle's items closed** — 685's enum delegation now lands (Info 1.1), 684's browser arm split and observed skipping (Info 1.2), 686/687 aligned; 683 + 688 `it.runIf`-gated, observed skipped |
| `reconciliation-l1-language` (725–728) | REQ-90, REQ-91 | **repaired — 727's browser arm split, observed skipping; the AC's and the file's "skips cleanly" are now literally true (Info 1.3)**; 725, 726, 728 aligned |
| `reconciliation-reproduction-treatments` (718, 719) | REQ-84, REQ-96, REQ-93 | **repaired — last REQ-87 vocabulary residue gone; whole-capability `grep -in capabilit` sweep clean (Info 1.4)** |
| `reconciliation-nowrap-width-floor` (1009–1012) | REQ-115/117 | aligned — 3 arms split, observed 3 skipped |
| `reconciliation-colour-palette-overlay` (928–931) | REQ-114, REQ-137 | aligned — 930's retarget holds; the two `if (!loaded.ok) return` tails are TS narrowing behind `expect(...).toBe(true)`, not silent gates (Info 2) |
| `reconciliation-behavior-modules` (697–704, 722, 809, 810) | REQ-85, REQ-87, REQ-96 | aligned; 702's substitution declared in the AC and vacuity-guarded at `:579` (Info 6); 703 unverifiable here (sandbox) |
| `reconciliation-behavior-edge-runtime.workers` (1412, 1413) | REQ-148 | aligned by inspection — real worker `fetch`, real D1 via `cloudflare:test`, real `renderSiteFiles` / `getModule`; **could not execute (sandbox)** |
| `reconciliation-behavior-module-escaping` (1414) | REQ-148 | aligned — ran green |
| `reconciliation-colour-shade-axis` (1144, 1145) | REQ-137 | aligned — ran green |
| `reconciliation-l1-image-framing` (1124–1128) | REQ-136 | aligned — ran green |
| `reconciliation-l1-shared-axis-groups` (685 ¶2, 801–805) | REQ-97, REQ-98, REQ-105 | aligned — ran green |
| `reconciliation-l1-control-and-texture` (806, 807, 829–832) | REQ-96, REQ-103 | aligned — ran green |
| `reconciliation-l1-authoring-envelope` (849–851) | REQ-107 | aligned — owns the `/pages/N/l1/…` prefixing AC-686/687 cross-reference |
| `reconciliation-l1-relocatable-output` (888–891) | BUG-30, REQ-109 | aligned; **888 unverifiable here (sandbox `listen` EPERM)** |
| `reconciliation-l1-one-colour-system` (933–936) | REQ-114 | aligned — the three `if (!x.ok) return` tails are narrowing guards behind assertions |
| `reconciliation-absolute-value-literals` (716) | REQ-84 | aligned — ran green |
| `reconciliation-responsive-layout-track` (833–838) | REQ-104 | aligned — ran green |
| `reconciliation-behavior-l1-composition` (808, 811) | REQ-96 | aligned — ran green |
| `reconciliation-contact-form-enhancement-gate` (877, 878) | BUG-28 | aligned — its four mock sites are `FormData`, `fetch`, and one DOM `getAttribute`: external boundaries TEST-STRATEGY permits |
| `reconciliation-l1-interaction-and-motion` (819–828) | REQ-99, REQ-100 | aligned — ran green |
| `reconciliation-l1-pointer-accent` (879–887) | REQ-108 | aligned — ran green |
| `reconciliation-l1-navigation` (839–848) | REQ-106 | aligned — ran green |
| *`req93-l1-slot-mounted-behaviors` (no active AC)* | REQ-93 | 10 substantive UATs, still FC-named and unclaimed (Info 4) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency + coverage | All 4 findings of report-6de02f6a | — | **Each re-verified from the diff and a live run, not accepted on the fix report's word.** `git show 7a13ea79a6 --stat` confirms attempt 8 touched **three test files and nothing else** — no production code, no ticket body, no `uat_coverage` write. (1) **AC-685's enum delegation now lands.** `tests/reconciliation-l1-substrate.test.ts:379-391` adds a real probe inside AC-686's test: `transformDoc('uppercase')` is **accepted** (positive control, so the assertion is about the vocabulary and not the property), `transformDoc('rotate(1deg);color:red')` is **rejected**, and the rejection's reported path is asserted to be `/root/axes/textTransform` with the message required to name a declared member. Two further map entries at `:427` and `:428-436` cover the family on two distinct leaf kinds (`textTransform` on text, `objectFit` on image, the latter carrying `cover;}@import "evil.css";p{`), taking the `rejected` map from 11 to 14. It passes green in my run. AC-685's Verification sentence — "an out-of-vocabulary enum is a validator rejection, pinned by the envelope-rejection criteria (AC-686 and …)" — is now true of AC-686, which is what it needed. (2) **AC-684** — the `if (chromiumReady) { … }` block is gone; `itChromium('test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser', …)` at `:265` uses the `it.runIf(chromiumReady)` binding at `:164`. The diff is a **verbatim relocation** — every assertion survives, including the `at(1440)` ceiling pair, and `1440` is in the file's `WIDTHS` at `:33`, so the arm will not throw when an engine appears. (3) **AC-727** — the bare `if (!chromiumReady \|\| !FONT_ASSET) return` tail is gone; `it.runIf(chromiumReady && FONT_ASSET !== null)` at `:567` carries `test_UAT_AC727_bound_face_paints_at_its_own_glyph_metrics_in_a_real_browser` at `:570`. Verbatim relocation again, with `FONT_ASSET` narrowed to a local `fontAsset` for the `serveWithFont` call; the engine-free arm keeps all 20 stylesheet assertions. AC-727's "Skips cleanly where no engine or font asset is available" and the file comment at `:449` are now literally true — **observed skipping in my run**. (4) **The vocabulary residue is gone** — `reconciliation-reproduction-treatments.test.ts:33-34` now reads "the two survivor **behavior modules**". Re-swept with `grep -in capabilit` across all 22 files: every surviving hit is one of the deliberate ones — the `capabilities.js` bundle filename AC-702's body explicitly protects, the rejected legacy `capability` slot key, the absent `data-l1-capability` attribute, the `Capability*` absence assertions, and two uses of "capability" in the XGD-matrix sense in `colour-palette-overlay:18`/`:296` | none |
| 2 | info | consistency | The silent-engine-gate defect class, all 22 files | — | **First cycle in which this sweep is clean.** I swept every one of the 22 files for `if (!… ) return`, `if (…Ready) {`, `=== null) return`, `if (!HAVE_`, `if (!FONT_ASSET`, `this.skip()`, `ctx.skip()`. Six hits survive and **none is a silent gate**: `colour-palette-overlay:336`/`:424` and `l1-one-colour-system:136`/`:214`/`:239` are TypeScript narrowing tails each **preceded on the line above by `expect(<the same>.ok).toBe(true)`**, so a false condition fails the test before the `return` is reached; `responsive-layout-track:69`, `l1-interaction-and-motion:102` and `behavior-l1-composition:120` are `return []` inside parser helpers. The only remaining textual matches to the old pattern are the three **comments** that document its removal (`l1-substrate:264`, `nowrap-width-floor:21`, `:248`). Empirically confirmed: 7 skips where the same tests reported 0 two cycles ago | none |
| 3 | info | coverage | AC-685 ¶2 (structured-axis closed-enum clause) vs `packages/site-schema/src/l1/schema.ts` | — | **Recorded so a future cycle need not re-derive it. Not a finding, and it must not trigger a repair.** The new probes cover *leaf-axis* enums (`textTransform` at `schema.ts:959`, `objectFit` at `:1025`). Ten further `z.enum`s sit **inside structured forms**: gradient origin `:353` and extent `:366`, border `style` `:431`/`:809`, mask/scrim `shape` `:451`, blend mode `:546`, texture `shape` `:595`, easing `:762`, `textDecoration` `:822`/`:988`, `fontVariantCaps` `:992`, font-face `style` `:1315`. No UAT drives an out-of-vocabulary value into one of those nested fields. This is **not** a gap that any active AC asks to be closed: AC-685's Verification explicitly excludes enum payloads from its own scope and delegates them, and AC-726 — the criterion it delegates the structured half to — lists no enum item anywhere in its "Rejected specifically" set. The mechanism is also covered from both sides already: AC-686 proves `z.enum` rejects and names its path, and AC-726 proves the enclosing `.strict()` structured objects (gradient, stop, shadow, border, mask, transform, scrim) are genuinely validated by rejecting a freeform key on each. Raising it would fail a 10th cycle on a sub-clause no AC requires | none — and do **not** open one. If a future cycle judges the nested case worth pinning, it is an `ac-edit` on AC-726's rejection list first, and only then a `uat-add` |
| 4 | info | coverage | `tests/req93-l1-slot-mounted-behaviors.test.ts` (10 UATs) vs AC-1622 / AC-1623 / AC-1624 | — (ac-level owns it) | Unchanged watch item, third cycle carried. All three ACs are still `pending`, so this level neither requires nor can credit them, and the tests are still FC-named (`test_UAT_FC_REQ-93_*`), so no AC claims them. **This becomes a uat-level violation the moment those three ACs go `active` while the tests stay unrenamed** — the evidence already exists and needs no new assertions, only the rename | none at this level |
| 5 | info | — | AC-703, AC-888, `*.workers` (AC-1412 / AC-1413) | — | Three UATs cannot be verified in this sandbox and **none is a finding** — same verdict for the third consecutive cycle, re-measured this cycle rather than inherited. Each binds a local socket and is refused with `listen EPERM` (`0.0.0.0`, `0.0.0.0`, `127.0.0.1`); the first two then time out at 60 s. I read all three for substance instead: AC-703 drives the real `assertModuleConforms` isolation harness, AC-888 the real render + serve path, and the workers file the real worker `fetch` against `cloudflare:test` D1 with real `renderSiteFiles` / `getModule`. **If a future cycle sees these three failures, do not repair them — check the environment first.** Nor should a green run elsewhere be read as having covered them | none |
| 6 | info | — | Evidence validity across the 22 files | — | Re-swept for `vi.mock` / `doMock` / `doUnmock` / `spyOn` / `fn` / `stubGlobal`. **Nine sites, eight at external boundaries** TEST-STRATEGY permits: `stubGlobal('setInterval', undefined)` (`behavior-modules:375`, a platform global, simulating a constrained runtime), and `FormData` / `fetch` ×2 / one DOM `getAttribute` (`contact-form-enhancement-gate:80`, `:100`, `:106`, `:180`). **The ninth is the one internal-module substitution in the capability** — `vi.doMock('../packages/framework/src/worker', …)` at `behavior-modules:561` — and it remains legitimate on the terms the last cycle settled: it spreads `importOriginal()` and overrides only `getModuleClientJs`, it is `doUnmock`-scoped at `:476`, the render pipeline / CLI / filesystem are all real, a vacuity guard at `:579` asserts the *real* catalog does ship client behaviour, and **AC-702's body declares the substitution, its premise, and the seam that would retire it**. No new mock appeared this cycle | none |
| 7 | info | — | `uat_coverage` fields across the capability's ACs | — | Unchanged from report-6de02f6a Info 8 and still stale: AC-1012 reads `fail` though both its arms exist and the engine-free one passes; AC-1144, AC-1145, AC-1412, AC-1413, AC-1414 read `None` though each has a substantive test (three of them ran green in my batches). Recorded as an observation only — **that field is owned by check/fix_uat_coverage and must not be set from this level.** The capability's own `uat_coverage: fail` is the same field and the same rule | none |

## Notes for the Editor

**1. There is nothing to fix. Do not open a fix call on this report.** Zero violations,
zero warnings, zero needs_review. Attempt 8 converged on all four findings it was given,
with no collateral: three test files touched, five mutations, no production code, no
ticket body, no field write. Every one of the five was independently re-derived here from
the diff plus a live run.

**2. The counter-signal finally points the right way.** For two cycles the finding that
mattered was produced by *greenness* — `73 passed | 0 skipped` in 1.52 s was the evidence
of a defect, because arms were silently not running and the runner said pass. This cycle
the same tests report **73 passed / 1 skipped**, `reconciliation-l1-substrate` reports 3
skips where it reported 2, and the whole capability reports **7 skips where it reported
0**. Each of the 7 is an `it.runIf`-declared browser arm. The suite now tells the truth
about what it did not run, which is what the last three cycles were actually about.

**3. The one thing a future cycle might be tempted by is already ruled out — read Info 3
before acting on it.** The enum question that drove five consecutive Finding 1s is
closed, but a reader who greps `z.enum` in `schema.ts` will notice ten declarations
inside structured forms with no out-of-vocabulary probe. That is deliberately not a
finding: no active AC asks for it, AC-726's rejection list contains no enum item, and the
mechanism is pinned from both sides (AC-686 proves `z.enum` rejects and names its path;
AC-726 proves the enclosing `.strict()` objects are validated). Escalating it would be
the ninth cycle's version of exactly the drift this check exists to prevent — a correct
repair re-opened as a technicality. If it is ever judged worth pinning, the order is
`ac-edit` on AC-726 first, `uat-add` second.

**4. The sandbox floor is unchanged and is not the capability's problem.** Three UATs
(AC-703, AC-888, and the two in the workers project) need socket-bind permission, and
every browser arm needs a Chromium the sandbox refuses at the Mach-bootstrap layer. All
are well-written against real entry points. A runner with those two permissions would
take this capability's observed count from 102 passed / 7 skipped / 2 failed to a full
111 executed.

**5. The `uat_coverage` fields are stale and are not mine to fix.** Six of them
(Info 7) disagree with what the tests now show, including the capability's own. That
field belongs to check/fix_uat_coverage; a fix call reading this report should not write
it to manufacture progress.
