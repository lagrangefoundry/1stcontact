---
uid: report-7d6cc8e0
id: REPORT-2414
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=uat)'
created_by: xgd
created_at: '2026-08-20T09:53:10.714888+00:00'
updated_at: '2026-08-20T09:53:10.714888+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 7

## Scope

**7 stories** (all `feature`/`upgrade`), **104 ACs**: 100 `active`, 3 `pending`
(AC-719 under STORY-82; AC-1343/AC-1344 under STORY-85), 1 `deprecated` and out of
scope (AC-718). **103 live ACs, every one of them carrying at least one matching
`test_UAT_AC<n>_*` definition** — verified by a whole-`tests/` scan (225 files) that
resolves the multi-line `it.runIf(…)(\n 'name',` form as well as the single-line one,
and that separates definitions from comment cross-references. Zero `uat-add` gaps.

A scan of the 22 CAP-70 test files finds exactly one AC number defined there that is
not a CAP-70 AC — AC-932, which belongs to STORY-97 (capability-b4ac88fc). That is
file placement, not attribution drift (Info 6).

## The eight findings of REPORT-2410 are repaired — each re-verified in the tree

The fix loop (REPORT-2412 + REPORT-2413) claimed all eight. I did not take the claim
on trust; each was re-located at file:line and, where observable, re-run.

| # (REPORT-2410) | Claim | What I found |
|---|---|---|
| V1 AC-685 over-claims | ac-edit | **Confirmed.** AC-685 ¶1 now scopes the bypass guarantee to "text, colour, font-family, length, and image source" and states in terms that closed-enum axes are a **Layer-1** guarantee with no Layer-2 bypass claim; ¶2's re-derivation list is now "numeric and hex fields". Verification adds "No enum payload is exercised at the emitter … verified by AC-686 instead". `test_UAT_AC685_*` untouched and still green — the recommended shape exactly. The emitter's raw enum interpolations are unchanged and are no longer claimed against. |
| V2 AC-1012 silent skip + unproven fidelity clause | uat-edit + ac-edit | **Confirmed, both halves.** `if (!HAVE_CHROMIUM) return` no longer occurs anywhere in `reconciliation-nowrap-width-floor.test.ts` (only a header comment naming the retired anti-pattern). `const itChromium = it.runIf(HAVE_CHROMIUM)` at `:51`; the measured-box arm is `itChromium(…)` at `:506` and genuinely measures (`BOXES_PROBE`, x/y/width/height per node per rung, `:511-529`). AC-1012's Criterion no longer restates the round-trip gate and cross-references AC-683 instead. |
| V3 live test against deprecated AC-718 | uat-edit | **Confirmed.** No `test_UAT_AC718_*` exists anywhere in `tests/`. The four config-surface assertions landed inside `test_UAT_AC701_*` (`reconciliation-behavior-modules.test.ts:448-464`): closed key set `['action','fields','submitLabel','successMessage']`, five retired dial names absent, `slots === ['form']`, `meta.dials === undefined`. `reconciliation-reproduction-treatments.test.ts` is now a one-test AC-719 file whose header records where AC-718's criterion and evidence went. |
| W4 AC-1009/AC-1011 silent gates | uat-edit | **Confirmed.** Both split into a stylesheet arm and an `itChromium` measurement arm (`:249`, `:443`). Running the file with no engine present now reports **3 skipped**, not 4 silent passes. |
| W5 AC-702 internal mock | uat-edit (+ code) | **Confirmed and closed at the source.** `grep -rn "vi.doMock\|vi.mock("` over `tests/` returns **nothing**. The negative arm drives the real `cmdNew` + `cmdRender('nojs', { cwd, clientJs: () => '' })`; a third arm (`:590-599`) proves the seam is a substitution rather than a no-op by running the same command with the real catalog. Production seam reviewed — see Info 5. |
| W6 AC-930 duplicates STORY-97's AC-942 | uat-edit + ac-edit | **Confirmed.** No `cmdColors` / `cmdColorsAssign` in the AC-930 tests; the assertions run through `validateSite` + `resolveL1Color` (`:295-342`), keep the whole-byte-range exactness loop (`:334-338`) and the opaque-reference case (`:341`), and a second test (`:344`) covers the shade/alpha composition paragraph, asserting composition **against the two single-axis results** rather than re-deriving the shade maths. AC-930's Verification was edited in the same call and now names AC-942 as the owner of the retrofit drive. |
| W7 AC-686/AC-687 unexercised clauses | ac-edit | **Confirmed.** Both Verifications now say "Do **not** re-run … here", cross-referencing AC-849/AC-850, and both Criteria carry a matching ownership sentence. No new tests written, so AC-849/AC-850's evidence is not duplicated. |
| W8 AC-928 clauses proven only by FC-named tests | uat-edit (rename) | **Confirmed.** `tests/test_UAT_FC_REQ-137_palette_shade.test.ts:91` is now `test_UAT_AC928_an_entry_carrying_a_step_is_rejected` and `:109` `test_UAT_AC928_no_stored_site_carries_a_step`, each commented with the AC-928 clause it serves. The store walk still enumerates by directory and still closes on `expect(entriesSeen, …).toBe(22)`. No second store walk was added elsewhere. |

## Execution — the suite was run this cycle

All 21 CAP-70 files plus `test_UAT_FC_REQ-137_palette_shade.test.ts` (which now carries
two AC-928 UATs) and `naming.test.ts`, in five `npm test -- <files>` batches:

| Batch | Files | Result |
|---|---|---|
| behavior-modules (alone) | 1 | 9 passed, **1 EPERM** (AC-703) |
| substrate / reproduction-treatments / nowrap-floor / palette-overlay / FC-137-shade / colour-shade-axis | 6 | 34 passed, **5 skipped** |
| req93 / image-framing / language / shared-axis-groups / control-and-texture / authoring-envelope | 6 | 34 passed, **1 EPERM** (AC-1344) |
| relocatable-output / one-colour-system / absolute-value-literals / responsive-layout-track / behavior-l1-composition | 5 | 18 passed, **1 EPERM** (AC-888) |
| contact-form-enhancement-gate / interaction-and-motion / pointer-accent / navigation / naming | 5 | 33 passed |
| **Total** | **23** | **128 passed, 3 EPERM, 5 skipped** |

Plus `generate` + `req116-edit-render` (the render-path consumers of the new
`clientJs` seam): **21 passed**.

**The 5 skips are the V2/W4 repair working**: AC-683 and AC-688 (`it.runIf(engineAvailable('chromium'))`)
plus the three new `itChromium` arms for AC-1009/1011/1012. Last cycle the nowrap file
reported `✓ 4 passed (4)` with three browser arms silently not running; it now reports
4 passed / 3 skipped.

**The 3 failures are the worktree sandbox, not the code**: `test_UAT_AC703_*`,
`test_UAT_AC888_*` and `test_UAT_AC1344_*` each die on
`Error: listen EPERM: operation not permitted 0.0.0.0`, thrown from `server.listen`
(`tools/generate/src/cli/serve.ts:54`, via `conformance/harness.ts:196` and directly at
`reconciliation-l1-relocatable-output.test.ts:169`) before any assertion runs. Same three
as the last two cycles. **These are not findings** — no assertion is wrong; the three ACs
simply cannot execute here. I am not claiming them green.

## Cumulative Intent Considered

At `uat` level the **AC body is the working reference**. I escalated to intent for **no**
element this cycle: last cycle's single escalation (AC-685) was resolved by the ac-edit
verified above, and every other element's AC body is internally consistent with its test.
The ledger is carried from REPORT-2410 with each status re-queried this cycle — **none
changed**.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-63/79/82/83/84 (BUNDLE-7) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; semantic layout modules and their ~20 dials deleted | YES |
| REQ-85 | free_and_reconciled | 2026-07-20 | Reframe carousel / contact-form as vetted behavior modules | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| REQ-87 | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**; no back-compat alias | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | Page-level slot binding, renderer mount, `mountInL1`, `labelMode` | YES — **and now the source of both warnings below** |
| REQ-96…107 + BUG-28 (BUNDLE-11) | free_and_reconciled | 2026-07-26+ | `control` leaf + zero-CSS contract; shared axis groups; interaction/motion/texture; layout track; link role | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | Palette colour model; closed colour-role vocabulary deleted | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment | YES (AC-1124…1128) |
| BUG-34 + REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-12 | Palette `shade` replaces named `steps` | YES — AC-928 attribution closed this cycle |
| REQ-145 / REQ-148 | ready_to_reconcile | 2026-08-15 | L1 + behavior-module render move into workerd | imminent — no uat gap |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Alignment Ledger

One row per test file. Every file reaches real entry points — `validateL1` /
`validateSite`, `renderL1Document` / `renderL1Fragment`, `validateBehaviorConfig` /
`Slots` / `Controls`, the real Astro SSR container, the real `cmdNew` / `cmdRender` /
`cmdRepro` against the real filesystem, `foldToL1`, `serveOneModulePage`, and JSDOM
browsing contexts. **No test stands on a structural/AST stand-in where a behavioural
probe belongs, and no internal component is mocked anywhere in the capability.**

| Test file (ACs) | Intents | Outcome |
|---|---|---|
| `reconciliation-l1-substrate` (682–688, 723) | REQ-82, REQ-87 | **aligned — V1 and W7 both closed**; 683/688 `it.runIf` → honestly skipped |
| `reconciliation-nowrap-width-floor` (1009–1012) | REQ-117 | **aligned — V2 and W4 closed**; each criterion split into a proxy arm and an engine-gated measurement arm |
| `reconciliation-reproduction-treatments` (719) | REQ-84, REQ-96 | **aligned — V3 closed**; AC-718's test retired, its criterion now under `test_UAT_AC701_*` |
| `reconciliation-behavior-modules` (697–704, 722) | REQ-85, REQ-87, REQ-96 | **aligned — W5 closed at the source** (mock replaced by the `clientJs` seam + a positive control); 703 EPERM here (environment) |
| `reconciliation-colour-palette-overlay` (928–931) | REQ-114, REQ-137 | **aligned — W6 closed**; AC-930 retargeted at the model claim, no command drive |
| `test_UAT_FC_REQ-137_palette_shade` (928 ×2) | REQ-137 | **aligned — W8 closed**; the entry-side step rejection and the store walk now carry AC-928 names |
| `req93-l1-slot-mounted-behaviors` (723, 1343, 1344) | REQ-93 | **two clause-level gaps — Warnings 1 and 2**; the criteria's main claims are substantively proven |
| `reconciliation-colour-shade-axis` (1144, 1145) | REQ-137 | aligned — independently re-derived oracles, no mocks |
| `reconciliation-l1-image-framing` (1124–1128) | REQ-136 | aligned |
| `reconciliation-l1-language` (725–728) | REQ-90, REQ-91 | aligned |
| `reconciliation-l1-shared-axis-groups` (685 ¶2, 801–805) | REQ-97, REQ-98, REQ-105 | aligned — AC-802's sweep drives the schemas and `validateL1` on every kind, with a guard that fails if a group is added and not sampled |
| `reconciliation-l1-control-and-texture` (806, 807, 829–832) | REQ-96, REQ-103 | aligned |
| `reconciliation-l1-authoring-envelope` (849–851) | REQ-107 | aligned — owns the `/pages/N/l1/…` prefixing W7 hands off to |
| `reconciliation-l1-relocatable-output` (888–891) | BUG-30, REQ-109 | aligned — AC-890 resolves each emitted href through a real `URL` against the carrying page; 888 EPERM here |
| `reconciliation-l1-one-colour-system` (933–936) | REQ-114 | aligned |
| `reconciliation-absolute-value-literals` (716) | REQ-84 | aligned |
| `reconciliation-responsive-layout-track` (833–838) | REQ-104 | aligned |
| `reconciliation-behavior-l1-composition` (808–811) | REQ-96 | aligned |
| `reconciliation-contact-form-enhancement-gate` (877, 878) | BUG-28 | aligned — the only `vi.spyOn` fakes a **DOM API** (external boundary), which TEST-STRATEGY permits |
| `reconciliation-l1-interaction-and-motion` (819–828) | REQ-99, REQ-100 | aligned |
| `reconciliation-l1-pointer-accent` (879–887) | REQ-108 | aligned |
| `reconciliation-l1-navigation` (839–848) | REQ-106 | aligned — AC-843 drives real keyboard focus in JSDOM across all three linkable kinds |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1343 `acceptance_criterion-1ba0dc9a` (`pending`) vs `tests/req93-l1-slot-mounted-behaviors.test.ts:145`, `:154` | uat-add | **New this cycle.** AC-1343's Verification enumerates **eight** cases; the two UATs cover six. Case 1 (a module bound to a seam present exactly once → accepted) is `:145`; cases 2–6 (the five rejection rows, each with its machine-readable path) are the table at `:158-210`, driven through the real `validateSite`. The two cases the Criterion marks **"deliberately legal and must not be rejected"** are exercised by neither: **case 7** — an L1 tree carrying a seam **no module binds** → accepted — and **case 8** — a page with **neither modules nor an L1 tree** → accepted. `validateSite` is called exactly twice in the file (`:150`, `:212`) and every page it is handed carries a bound module. These are false-rejection guards, and the Criterion states why they matter: "Requiring every seam to be filled would make an L1 tree undeclarable ahead of the behaviour that fills it." As written, an implementation that over-tightened to "every seam must be bound" would keep the whole suite green — `test_UAT_AC723_mounted_fragment_replaces_the_inert_placeholder` (`:349`) proves the unbound seam **renders** as the placeholder but goes through `renderL1Document`, never the validator, and the nearest neighbours (`req102-scaffold-l1.test.ts:96`, `req88-l1-repro-pipeline.test.ts:177`) are FC-named tests in other stories whose fixtures carry no unbound seam. **Warning, not violation**: the criterion's substance — that binding is validated rather than best-effort — is fully proven, and the gap is in its negative space | Add the two acceptance cases to `test_UAT_AC1343_slot_bound_module_accompanies_an_l1_page` (or a third sibling): `expect(validateSite({…, pages:[{…, l1: docWithSlot(), modules: []}]}).ok).toBe(true)` and the same for a page carrying neither `l1` nor `modules`. Both run through the existing fixtures with no new infrastructure and execute fine in this worktree (no socket needed) |
| 2 | warning | coverage | AC-1344 `acceptance_criterion-78efd0d5` (`pending`) vs `test_UAT_AC1344_mounted_behavior_carries_its_conformance_obligations` (`tests/req93-l1-slot-mounted-behaviors.test.ts:476`) | uat-edit | **New this cycle.** The test proves the fixture **mode** works: `serveOneModulePage('contact-form', fixture, { mountInL1: true })` really produces the slot-bound composition (`page.l1` defined, `modules[0].slot === 'mount'`), the page is schema-validated on the way in, and the behaviour's markup lands **inside** the seam (`data-l1-slot="mount">\s*<section class="contact-form"`). What the AC asks for beyond that is unexercised: (a) "**Run the conformance harness over a catalog behaviour twice** — once standalone and once with `mountInL1` — and confirm **both exercise the same universal AC set, and both report a per-dimension outcome**". The test never calls `assertModuleConforms`; `grep -rn mountInL1 tests/ tools/` returns only this call site, `req88-form-labelling-and-submit.test.ts:195,:310` (also bare `serveOneModulePage`), and the harness itself — **so no test anywhere runs the obligation set against the mounted shape**, which is the AC's headline claim. (b) "the host's seam **spans the viewport at every probed width**" — true by construction in `harness.ts:145` (`l1HostDocument([...RESPONSIVE_WIDTHS])`) but asserted nowhere, and it is the clause that makes a mounted-mode overflow attributable to the behaviour rather than the wrapper. (c) "Confirm a behaviour that conforms standalone is **still reported as failing when it breaks only under the mounted shape**" — the discriminating case, absent; without it the mode could report conformant unconditionally. **Warning, not violation**, for two reasons: the mount itself is genuinely proven, and the repair **cannot be verified in this worktree** — this test is one of the three EPERM casualties, so any added arm would be unrunnable here | Extend the existing test (not a new file) with a two-mode `assertModuleConforms` run asserting the same dimension keys and a per-dimension outcome in both, an assertion that the host seam's rect equals the viewport at each probed width, and a negative arm using the harness's own `resolveModule` seam to substitute a behaviour that passes standalone and breaks mounted. **Execute this where sockets are permitted** — see Info 4; do not land it green-untested here |
| 3 | info | consistency | REPORT-2410's eight findings | — | All eight re-verified in the working tree at file:line, as tabulated above; five are additionally observable in a run (the 3 new skips, the mock-free AC-702 arms, AC-930's command-free drive). Two carried for five cycles (AC-685) and four (AC-702's mock) and are now genuinely closed rather than re-deferred | none |
| 4 | info | — | AC-703, AC-888, AC-1344 | — | `EPERM` on `server.listen` in this regression worktree, thrown before any assertion. **Not findings, and must not be "repaired" by removing the server** — the socket is the boundary those three tests exist to cross. Their pass state must come from a runner with socket permission; Warning 2's repair belongs to that same runner | none |
| 5 | info | consistency | `tools/generate/src/render/render.ts:35-47,:268,:298`, `tools/generate/src/cli/commands.ts:133,:153` | — | The W5 repair added **production** code — an optional `clientJs?: () => string` on `RenderSiteOptions`/`RenderOptions`. I reviewed it rather than accepting the fix report's claim: it mirrors the pre-existing `resolveModule` seam on the same options object (itself consumed by the conformance harness at `harness.ts:184`, so this is an established pattern, not one invented for a test); it is optional, so every existing caller is unchanged; and `edit ? '' : (opts.clientJs ?? getModuleClientJs)()` reproduces the previous `!edit && getModuleClientJs()` truth table while removing one redundant catalog read. Verified by running the render-path consumers (`generate`, `req116-edit-render`): **21 passed** | none |
| 6 | info | exclusivity | `test_UAT_AC932_*` in `tests/reconciliation-colour-palette-overlay.test.ts` | — | Closing this explicitly for the third time so a later cycle does not re-open it. AC-932 moved to STORY-97 (`story-5e7eb0c5`, capability-b4ac88fc) on 2026-08-10 and is the **only** AC number defined in a CAP-70 file that is not a CAP-70 AC. Its test remaining in a file named for this capability is cosmetic placement, not matrix drift | none |
| 7 | info | — | AC-1144, AC-1145 (`acceptance_criterion-51c333aa`, `-c288a7c7`) | — | Both carry **no `uat_coverage` field at all**, where every other live AC in the capability carries `pass`/`deprecated`. Their UATs exist and pass (`reconciliation-colour-shade-axis.test.ts`), so this is matrix bookkeeping rather than an evidence gap — but the separate `check_uat_coverage` workflow reads that field, and the capability still sits at `uat_coverage: fail`. Flagged for whoever runs that check, not repairable at this level | none |
| 8 | info | consistency | `tests/reconciliation-reproduction-treatments.test.ts:35` | — | The REQ-87 scrub of the retired word "capability" cleared the header and describe string but left one comment — "the module catalog holds only the two survivor **capabilities**". Cosmetic; affects no assertion. Sweep it opportunistically if the file is touched again | none |

## Notes for the Editor

**1. This is the first clean cycle for this capability, and the reason is that the last
fix loop repaired *both* sides of each finding.** REPORT-2410's Note 1 warned that "an
`ac-deprecate` or an AC rewrite is not complete until the `test_UAT_AC<n>_*` names that
point at it have moved too" — that is exactly what attempts 7 and 7-continuation did:
AC-718's deprecation and its test's retirement travelled together, AC-930's Verification
edit landed in the same call as its test's retarget, and AC-928's rewrite pulled two
FC-named tests onto its own name. Nothing was annotated around; W5 in particular was
closed by deleting the mock, not by excusing it.

**2. Both warnings are in one file and both are REQ-93 surface.** `req93-l1-slot-mounted-behaviors.test.ts`
was renamed onto AC names only last cycle (REPORT-2410 Info 10), and the rename was done
faithfully — but a rename inherits whatever the FC-era test happened to assert, and these
two ACs were authored *after* the tests they now claim. That is a different drift species
from anything in the previous eight findings, and it is worth checking the next time an
`ac-add` closes a gap by renaming existing tests: **the new AC's Verification is not
automatically what the renamed test proves.**

**3. Warning 1 is repairable here; Warning 2 is not.** Warning 1 is two `validateSite`
acceptance assertions over fixtures the file already defines — pure schema work, no
socket, verifiable in this worktree in seconds. Warning 2 needs `assertModuleConforms`,
which needs `server.listen`, which this worktree denies. Do not let the fix loop land
Warning 2 unrun; if it cannot be executed, leave it open and say so rather than
reporting a green it did not observe.

**4. Neither warning blocks the level.** Result is PASS. Both are coverage of clauses in
the negative space of `pending` ACs whose primary criteria are substantively proven; they
are recorded here so that the next cycle inherits them as known, not as new discoveries.

**5. Two scanning traps persist, unchanged.** (a) AC-683, AC-688 and AC-727 are declared
as `it.runIf(...)(\n 'test_UAT_AC…',` — the name is on the *following* line, so a
single-line grep reports three phantom `uat-add` gaps. (b) The AC-660…AC-681 and AC-717
block is **archived** (the module-dial ACs REQ-84/REQ-85 retired, tests removed by
`47aba3435` and `d37af07ca`); a raw walk of `.xgd/tickets/**` will propose ~21 `uat-add`s
for behaviour whose implementation no longer exists. Use `xgd ticket list`/`query`, which
exclude archived by default.
