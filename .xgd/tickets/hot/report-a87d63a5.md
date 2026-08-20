---
uid: report-a87d63a5
id: REPORT-2415
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-08-20T10:10:34.906649+00:00'
updated_at: '2026-08-20T10:10:34.906649+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 2
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: FAIL
**AC verdicts**: 101 pass, 2 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 6 pass, 1 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 7

Scope: **7 stories**, **104 ACs** — 100 `active`, 3 `pending` (AC-719, AC-1343,
AC-1344), 1 `deprecated` (AC-718). **103 live ACs.**

## What changed since the last coverage cycle (REPORT-2095, 5 violations / 8 warnings)

All five violations and all eight findings of the intervening loop are **closed and
independently re-verified here** (not taken from the fix loop's claim). Two *new*
ACs — AC-1343 and AC-1344, authored 2026-08-20T08:04 under STORY-85 — arrived
carrying `uat_coverage: pass` set by the fix loop at 08:06. **Both are the
violations below.** Two further new ACs (AC-1144/AC-1145) carried *no* verdict at
all and are assessed here for the first time; both pass.

## ⚠ Two mechanical notes, disclosed

**1. `.xgd/uat_index.json` is empty** (`{"acs": {}}`, stamped 2026-08-20T00:43).
The prescribed Step-1b lookup therefore returns nothing for **every** AC — taken at
face value it would report 103 fabricated `uat-add` gaps. AC→test resolution was
done instead by scanning all 262 files under `tests/` for `test_UAT_AC<n>_*`
definitions. **This index has now been empty for at least two consecutive cycles
and is worth repairing at source** — an anchored `^test_UAT_` matcher does not fit
this repo's suite-prefixed vitest names.

**2. The suite WAS executed this cycle** (unlike REPORT-2095, which could not run
it). All 22 CAP-70 test files, in seven `npm test` batches:

| Batch | Result |
|---|---|
| reproduction-treatments | 1 passed |
| req93-l1-slot-mounted-behaviors | 10 passed, **1 EPERM** (AC-1344) |
| nowrap-width-floor | 4 passed, **3 skipped** |
| substrate / shared-axis-groups / language / control-and-texture / authoring-envelope / image-framing | 30 passed, 2 skipped |
| interaction-and-motion / pointer-accent / navigation / responsive-layout-track | 35 passed |
| behavior-modules / behavior-l1-composition / contact-form-enhancement-gate / relocatable-output | 18 passed, **2 EPERM** (AC-703, AC-888) |
| palette-overlay / colour-shade-axis / one-colour-system / absolute-value-literals / FC-137-shade | 28 passed |
| **Total** | **126 passed, 5 skipped, 3 EPERM** |

**The 3 EPERM are the worktree sandbox, not the code.** `test_UAT_AC703_*`,
`test_UAT_AC888_*` and `test_UAT_AC1344_*` each die on
`Error: listen EPERM: operation not permitted 0.0.0.0` thrown from `server.listen`
(`tools/generate/src/cli/serve.ts:54`, via `conformance/harness.ts:196` and
`reconciliation-l1-relocatable-output.test.ts`) **before any assertion runs**. These
are not findings — no assertion is wrong. I am not claiming those three green by
execution; their verdicts rest on their bodies.

The 5 skips are the repair working: `it.runIf(engineAvailable(...))` on AC-683/688
and the three new `itChromium` arms on AC-1009/1011/1012 now report **skipped**
rather than passing an arm that never ran.

## Cumulative Intent Considered

Ledger carried from REPORT-2410/REPORT-7d6cc8e0 with statuses re-queried; none
changed this cycle. At `uat` level the AC body is the working reference — I
escalated to intent for no element.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-63/79/82/83/84 (BUNDLE-7) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; semantic layout modules and ~20 dials deleted | YES |
| REQ-85 | free_and_reconciled | 2026-07-20 | Reframe carousel / contact-form as vetted behavior modules | YES |
| REQ-87 | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**; no back-compat alias | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | Page-level slot binding, renderer mount, `mountInL1`, `labelMode` | YES — **the source of both violations** |
| REQ-96…107 + BUG-28 (BUNDLE-11) | free_and_reconciled | 2026-07-26+ | `control` leaf + zero-CSS contract; shared axis groups; interaction/motion/texture; layout track; link role | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | Palette colour model; closed colour-role vocabulary deleted | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment | YES (AC-1124…1128) |
| BUG-34 + REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-12 | Palette `shade` replaces named `steps` | YES (AC-928, AC-1144/1145) |
| REQ-145 / REQ-148 | ready_to_reconcile | 2026-08-15 | L1 + behavior-module render move into workerd | imminent — no uat gap |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | REQ-84, REQ-114, REQ-137 | aligned | 7/7 ACs substantive. AC-1144/1145 assessed for the first time this cycle — both pass |
| STORY-81 Responsive layout track | REQ-104 | aligned | 6/6 substantive |
| STORY-82 Reproduction treatments | REQ-84, REQ-85, REQ-87, REQ-93, REQ-96 | **aligned — was `stale` for five cycles, now repaired** | Body rewritten 2026-08-20T08:03: records the REQ-96 slot replacement, the REQ-87 rename with no alias, and REQ-93's `labelMode`. AC-719 pass, AC-718 correctly deprecated |
| STORY-83 L1 layout substrate | REQ-82…REQ-136 | **aligned — was `incomplete`, now repaired** | Body now documents the `mounts` map and seam emission and delegates the *whether* half to STORY-85. 43/43 ACs substantive |
| STORY-85 Behavior modules | REQ-85, REQ-87, REQ-93, REQ-96, REQ-116 | **aligned body, FAIL on coverage** | Body now carries the page composition rule and closes its In-scope list with "conformance is exercised in both shipping shapes, standalone and mounted into an L1 seam" — a promise no test keeps (Violation 2) |
| STORY-90 Interaction / motion / pointer accent | REQ-99, REQ-100, REQ-108 | aligned | 19/19 substantive |
| STORY-91 L1 navigation | REQ-106, REQ-115 | aligned | 10/10 substantive |

## Evidence Assessment

**All 103 live ACs resolve to a real `test_UAT_AC<n>_*` definition.** Deprecated
AC-718 correctly has none. Zero `uat-add`-by-absence gaps.

Automated screen of all 22 CAP-70 files for the four disqualifying evidence shapes:

| Shape | Count |
|---|---|
| Internal mocking (`vi.mock` / `vi.doMock`) | **0** |
| Silent engine skip (`if (!HAVE_CHROMIUM) return`) | **0** |
| Existence-only assertions | **0** |
| Production-source text reads | 2 (both in `reconciliation-behavior-modules`, supplementary to behavioural assertions — the AC-722 residual-`Capability*` sweep) |

The only `vi.spyOn` inside the capability is
`reconciliation-contact-form-enhancement-gate.test.ts:187`, faking `getAttribute`
— a **DOM API**, an external boundary TEST-STRATEGY permits. Every other `vi.spyOn`
in `tests/` sits in files outside CAP-70.

Entry points are real throughout: `validateL1`, `validateSite`, `renderL1Document`
/ `renderL1Fragment`, `validateBehaviorConfig`/`Slots`/`Controls`/`Instance`,
`getModule` + the real `registry`, the real Astro SSR container, real `cmdNew` /
`cmdRender` / `cmdRepro` against the real filesystem, `foldToL1`, `captureL1`,
`serveOneModulePage`, `resolveL1Color` / `shadeHex` / `collectL1PaletteRefs`, the
real `enhanceAllContactForms` client, and JSDOM browsing contexts.

**Prior findings re-verified at file:line this cycle** (not accepted on the fix
loop's word): the `if (!HAVE_CHROMIUM) return` anti-pattern is gone from
`reconciliation-nowrap-width-floor.test.ts` (`itChromium` at `:51`, used at `:248`,
`:442`, `:506`) and the file now reports 4 passed / 3 skipped; AC-702's internal
mock is replaced by the real `cmdRender('nojs', { cwd, clientJs: () => '' })` seam
with a positive-control arm at `:589`; no `test_UAT_AC718_*` survives anywhere and
`reconciliation-reproduction-treatments.test.ts` is a one-test AC-719 file whose
header records where AC-718's criterion went.

**Scope note on breadth.** I did not re-read all 101 passing test bodies line by
line this cycle. Those verdicts rest on: my own AC→test resolution scan, the
automated four-shape screen above, actual execution, and the per-AC substantive
readings of the two preceding cycles — plus fresh full reads of every element whose
verdict I changed or that any recent finding touched (AC-719, AC-701/702, AC-723,
AC-1009…1012, AC-1144, AC-1145, AC-1343, AC-1344).

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-1344 `acceptance_criterion-78efd0d5` | uat-add | **The AC's headline claim is unexercised.** The AC is titled "Conformance is exercised in **both** shipping shapes" and its Verification opens "Run the conformance harness over a catalog behaviour **twice** — once standalone and once with `mountInL1` — and confirm both exercise the same universal AC set, and both report a per-dimension outcome." `test_UAT_AC1344_*` (`tests/req93-l1-slot-mounted-behaviors.test.ts:476`) **never calls `assertModuleConforms`**. It calls `serveOneModulePage('contact-form', fixture, { mountInL1: true })` and then asserts the *fixture* composed correctly (`page.l1` defined, `modules[0].slot === 'mount'`, markup inside `data-l1-slot="mount"`). That proves the fixture **mode** works, not that the **obligations run** against the mounted shape. I verified this independently: `mountInL1` appears at exactly three test call sites (`req93:489`, `req88-form-labelling-and-submit:195,:310`), all `serveOneModulePage`, **never** `assertModuleConforms` — while `assertModuleConforms` (`harness.ts:228`) does forward `opts` to `serveOneModulePage` (`:253`), so the production capability exists and is simply undriven. Also unexercised: the AC's closing sentence, "Confirm a behaviour that conforms standalone is still **reported as failing** when it breaks only under the mounted shape" — the defect class the AC exists to catch — and "the host's seam spans the viewport at every probed width" (true by construction at `harness.ts:145`, asserted nowhere) | Add an arm driving `assertModuleConforms('contact-form', [fixture], { dimension: <d> })` twice, once with and once without `mountInL1`, asserting both report a per-dimension outcome over the same AC set; plus a negative arm where a deliberately mount-breaking fixture conforms standalone and **fails** mounted. Note this test currently cannot execute in a sandboxed worktree (EPERM on `listen`) — the new arms inherit that constraint |
| 2 | violation | ac | AC-1343 `acceptance_criterion-1ba0dc9a` | uat-add | **Two of the eight enumerated verification cases have no test, and both are false-rejection guards the Criterion calls out explicitly.** Cases 1–6 are covered well through the real `validateSite`: the accept case at `:145-152`, and the five rejection rows as a driven table at `:158-217`, each asserting both the message and a machine-readable path. But the Criterion states "Two cases are deliberately **legal** and must not be rejected", and neither is exercised: **case 7** — an L1 tree carrying a seam **no module binds** → accepted — and **case 8** — a page with **neither modules nor an L1 tree** → accepted. `validateSite` is called exactly twice in the file (`:150`, `:212`) and every page handed to it carries a bound module. **Consequence:** an implementation that over-tightened to "every seam must be bound" would leave the entire suite green. `test_UAT_AC723_mounted_fragment_replaces_the_inert_placeholder` (`:349`) proves an unbound seam *renders* as the placeholder, but goes through `renderL1Document` and never the validator, so it does not close this | Add the two acceptance cases to `test_UAT_AC1343_slot_bound_module_accompanies_an_l1_page` (or a third sibling): `expect(validateSite({…, pages:[{…, l1: docWithSlot(), modules: []}]}).ok).toBe(true)` and the same for a page carrying neither `l1` nor `modules`. Both reuse existing fixtures, need no new infrastructure, and — unlike Finding 1 — **execute fine in this worktree** (no socket) |

## Notes for the Editor

**Both violations are in one file and one story.** `tests/req93-l1-slot-mounted-behaviors.test.ts`
holds both; STORY-85 owns both ACs. A single pass closes the capability. Finding 2
is two assertions against fixtures that already exist and runs anywhere; Finding 1
is the substantial one.

**These two ACs were authored this morning and marked `pass` by the fix loop within
two minutes, without a test being written for either.** AC-1343 and AC-1344 were
created at 08:04:08 / 08:04:16 and had `uat_coverage: pass` written at 08:06:29 /
08:06:30. The sibling alignment check (REPORT-2414, 09:53) independently reached the
same two gaps and recorded them as *warnings*; under the coverage lens they are
violations, because the Step-1b question is whether the observation could
distinguish a correct implementation from an incorrect one — and for AC-1344's
headline claim and AC-1343's two must-not-reject cases, it cannot. **Do not resolve
these by editing the ACs down to what the tests already do**: AC-1344's second
shipping shape is the whole reason REQ-93's `mountInL1` mode exists, and AC-1343's
legal cases are what keep an L1 tree declarable ahead of the behaviour that fills
it.

**Everything else in this capability is in good shape.** 101 of 103 live ACs are
substantively covered, the suite is green apart from three sandbox-blocked sockets,
and the two structural drifts that dogged the last five cycles — STORY-82's frozen
body and STORY-83's missing mount narrative — are both genuinely repaired.

**Unrelated but worth a ticket:** `.xgd/uat_index.json` has been empty across
consecutive cycles. Every coverage assessor is currently working around it by
hand-scanning `tests/`. That is a tooling defect, not a matrix defect.
