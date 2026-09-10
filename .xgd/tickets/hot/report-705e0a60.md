---
uid: report-705e0a60
id: REPORT-3737
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-09-10T13:24:13.135285+00:00'
updated_at: '2026-09-10T13:24:13.135285+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 3
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: FAIL
**AC verdicts**: 105 pass, 3 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 5 pass, 2 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-e37a6b4a · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 6

Scope: **7 stories**, **108 live ACs** (44 STORY-83, 20 STORY-85, 19 STORY-90,
10 STORY-91, 7 STORY-80, 6 STORY-81, 2 STORY-82). The set moved by **+8** since
the last coverage cycle (REPORT-2095, 100 ACs): +2 STORY-80 (AC-1144/1145,
REQ-137), +3 STORY-85 (AC-1412/1413/1414, REQ-148), and +3 authored **today** in
direct response to REPORT-2095 Finding 4 (AC-1622 under STORY-83; AC-1623/1624
under STORY-85).

## Headline: the prior cycle's five violations are four-fifths closed

This is the first cycle in six where the report is not mostly a restatement.
Between 2026-08-16 and today the editor closed **Findings 1, 2, 3, 5** and
**Warnings 6, 7, 9, 10, 11, 12, 13** outright, and closed the *first two thirds*
of Finding 4. Verified individually:

| Prior finding | State now | Evidence |
|---|---|---|
| **F1** STORY-82 body stale for 5 cycles | **closed** | Body rewritten (`updated 2026-09-10T11:59:59`). REQ-96 `form` slot ¶10, REQ-87 behavior-module naming throughout + ¶21, REQ-93 `labelMode` ¶11 |
| **F2** AC-718 every claim retired | **closed, by rewrite not deprecation** | AC-718 rewritten to the post-REQ-96/87/93 surface with an explicit scope note delimiting it from AC-701. This resolves the "the edit has no destination" deadlock the prior cycle deprecated around — the destination turned out to be `labelMode` |
| **F3** STORY-83 denied the REQ-93 mount | **closed** | New §"What a `slot` emits: placeholder, or a mounted fragment" states the verbatim insertion **and** both trust preconditions |
| **F5** AC-1012 silent gate + unreachable fidelity clause | **closed** | AC narrowed (option ii): fidelity clause deferred to AC-683 in the AC's own text. Test split into an engine-free arm (`:498`) and `it.runIf(HAVE_CHROMIUM)` (`:525`) |
| **W6** AC-719 "named overlay role" | **closed** | Now reads "(or a reference to a site palette entry)" |
| **W7** AC-702 internal mock | **closed as ac-edit** | AC-702 now records the catalog substitution as the arm's premise, with the condition for retiring it |
| **W8** silent chromium gates ×2 | **closed** | AC-1009 `:252` and AC-1011 `:453` are now `it.runIf`; each retains a substantive engine-free arm (`:213`, `:429`) |
| **W9** AC-685 enum over-claim | **closed** | ¶1 narrowed to the five DOC-2 §2 families; enum payloads explicitly excluded from this criterion's verification |
| **W10** AC-686/687 unexercised clauses | **closed** | Both clauses cross-referenced to AC-849/850 and removed from own verification |
| **W11** AC-930 duplicates AC-942 | **closed** | AC-930 rewritten; `test_UAT_AC930_*` retargeted to `validateSite`/`loadSite`/`resolveL1Color`, `cmdColors` drive dropped, byte-range loop kept |
| **W12** REQ-137 imminent | **closed** | REQ-137 reconciled 2026-08-17. STORY-80's body and AC-928 both repointed to shade-not-steps; AC-1144/1145 authored |
| **W13** STORY-83 called STORY-81 archived | **closed** | Merge note now says STORY-81 "**is live on this capability**" |
| **F4** REQ-93 unclaimed by the matrix | **⅔ closed — the remaining violation** | Story bodies admit the binding + mount; the three ACs are authored. **The tests were not renamed**, so the matrix still cannot see the evidence |

## Execution — the suite ran this cycle

Unlike REPORT-2095 I could execute. `npm test -- <files>` ran, on the eight files
carrying every verdict I changed or re-verified:

- `reconciliation-colour-shade-axis` + `reconciliation-behavior-module-escaping`
  + `reconciliation-reproduction-treatments`: **3 files, 5 tests, all passed.**
- `reconciliation-nowrap-width-floor` + `req93-l1-slot-mounted-behaviors` +
  `reconciliation-colour-palette-overlay`: **18 passed, 3 skipped, 1 failed.**
- `reconciliation-behavior-modules` + `reconciliation-behavior-l1-composition`:
  **13 passed, 1 failed.**

**The 3 skips are the fix working.** They are exactly AC-1009/1011/1012's
`it.runIf(HAVE_CHROMIUM)` browser arms reporting as *skipped* rather than as a
pass — the outcome Finding 5 and Warning 8 asked for, now observed rather than
inferred.

**Both failures are one sandbox limitation, not a defect.** Every test routed
through `serveOneModulePage` dies at `tools/generate/src/conformance/harness.ts:196`
with `Error: listen EPERM: operation not permitted 0.0.0.0` — the sandbox
forbids binding a loopback port. It takes down `test_UAT_AC703_*` and
`test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations`. Neither
is a coverage finding and **the fix loop must not chase either**; AC-703 keeps
its `pass`. Note the consequence for Finding 4 below: AC-1624's would-be evidence
is precisely a test that cannot execute here.

Two mechanical notes carried forward: `.xgd/uat_index.json` is **still empty**
(`acs: {}`), so the prescribed index lookup returns nothing for every AC —
AC→test resolution was done by scanning `tests/` for `test_UAT_AC<n>_*`
definitions directly. And 99 of the 108 ACs already carried the correct
`uat_coverage`; I wrote the 9 that changed rather than re-committing 99 identical
values.

## Cumulative Intent Considered

Statuses re-derived this cycle. Rows through REQ-136 are unchanged from
REPORT-2095 and are compressed; the post-2026-08-16 rows are the new work.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58/59/61/62) | free_and_reconciled | 2026-07-17 | Pre-pivot capture/diff value work; original home of STORY-80/81/82 | YES |
| BUNDLE-7 (REQ-79/82/84/85) | free_and_reconciled | 2026-07-22 | **The pivot.** L1 typed substrate + envelope + sole renderer; deletes semantic layout modules and their ~20 dials | YES (retires module dials) |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**, no alias | YES |
| **REQ-93** (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-level slot binding + five rejections, renderer mount, `mountInL1`, `fields[].labelMode` | YES — **`labelMode` and the story bodies landed this cycle; the tests are still unclaimed (Finding 1)** |
| BUNDLE-8 (REQ-90/91) | free_and_reconciled | 2026-07-29 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| BUNDLE-11 (REQ-96/97/98/103…107) | free_and_reconciled | 2026-08-05 | `control` leaf; `intro`/`submit` → one required `form` slot; shared axis groups; per-width layout track | YES (retires the two slots) |
| BUNDLE-13 (REQ-99/100/108…111, BUG-28/30) | free_and_reconciled | 2026-08-06 | Interaction state, scroll reveal, pointer accent, safety floor; relocatable URLs | YES |
| BUNDLE-14 (REQ-114/116) | free_and_reconciled | 2026-08-06 | Deletes the closed colour-role vocabulary; edit-channel carve-out | YES |
| BUNDLE-16 (REQ-115/117) | free_and_reconciled | 2026-08-07 | Navigation/link role; nowrap width floor | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Non-destructive image framing + typed colour adjustment + typed shape | YES |
| **REQ-137** (`request-d2980a95`, BUNDLE-18) | **free_and_reconciled** (was `reconciling`) | reconciled 2026-08-17 | Deletes palette `steps`; continuous Oklab `shade` on the reference | **YES — Warning 12 discharged, not escalated** |
| **REQ-148** (`request-7ae3c2cc`, BUNDLE-20) | free_and_reconciled | 2026-08-31 | Behavior modules render in workerd; contact-form precompiled from template to props-to-markup function | **YES — newly covered, AC-1412/1413/1414 all clean** |
| REQ-151 / REQ-152 (BUNDLE-20) | free_and_reconciled | 2026-08-31 | Site locale identity → rendered `lang`/`dir` in `renderL1Page`; money/time seam | YES, but **claimed outside this capability** — see note |
| REQ-154 (BUNDLE-22) | free_and_reconciled | 2026-09-01 | Browser Rendering driver behind the headless-browser port | YES (capture capability, not this one) |
| REQ-155…166 | `draft` | 2026-08-20 … 08-31 | Capture in workerd, image layer, KB work, product ticket store | NO (not yet active) |

**On REQ-151 — checked, and it is not a gap here.** REQ-151 edits
`packages/framework/src/l1/render.ts` (`renderL1Page`), which is this
capability's own sole emitter, so it was worth confirming it had a home. It does:
AC-1428…AC-1433 claim it on another story, and `test_UAT_AC1431_both_render_paths_declare_the_same_lang_and_dir`
covers the `renderL1Page` half specifically. Locale identity is a site-config
concern that reaches the renderer, not an L1 substrate axis — the boundary is
drawn correctly and no AC is owed here.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | BUNDLE-6 → REQ-114 → **REQ-137** | **aligned** (was aligned-with-warning) | Body §"Steps → shade is a replacement, not a widening" and AC-928 both repointed after REQ-137 reconciled. 7/7 ACs substantive |
| STORY-81 Responsive layout track | BUNDLE-6 → REQ-104 | aligned | 6/6 ACs substantive; unchanged this cycle |
| STORY-82 Reproduction treatments | BUNDLE-7 → REQ-87, REQ-93, REQ-96 | **aligned** (was **stale**, 5 cycles) | All three missed intents now recorded. 2/2 ACs substantive and green |
| STORY-83 L1 layout substrate | BUNDLE-7 → REQ-93, REQ-136 | **aligned**, coverage gap | Body now states the mount and its two preconditions. 43/44 ACs pass; AC-1622 has no AC-named test |
| STORY-85 Behavior modules | BUNDLE-7 → REQ-116, **REQ-148** | **aligned**, coverage gap | Body now carries the page-level binding rule, its five rejections and `mountInL1`. 18/20 ACs pass; AC-1623/1624 have no AC-named test |
| STORY-90 Interaction / motion / pointer accent | BUNDLE-13 | aligned | 19/19 ACs substantive; unchanged |
| STORY-91 L1 navigation | REQ-106 / REQ-115 | aligned | 10/10 ACs substantive; unchanged |

No story required the BUG-1306 impact screen this cycle: every behavior either
story body describes traces to a reconciled intent. **needs_review_count = 0.**

## Evidence Assessment

**105 of 108 ACs resolve to a real `test_UAT_AC<n>_*` definition.** The three that
do not are the ACs authored today. Newly verified this cycle, at real entry points:

- **AC-1144 / AC-1145** (`reconciliation-colour-shade-axis.test.ts:99`, `:188`) —
  real `resolveL1Color`, real `validateSite`, real `renderL1Document`. Strong
  evidence: monotonicity sampled in 201 steps; Oklab step-evenness asserted with
  a **positive control** that a straight sRGB lerp lands elsewhere (`:141-147`);
  out-of-range rejected rather than clamped at four points *and* nine in-range
  values accepted, so the boundary is pinned from both sides; chroma
  non-increase sampled across six bases spanning hue and saturation.
- **AC-1412 / AC-1413** (`reconciliation-behavior-edge-runtime.workers.test.ts:98`,
  `:145`) — real workerd fetch against `/preview/<slug>/draft/` and `/edit/`. The
  parity clause is the strong part: it calls `getModule(...).Component` *inside
  workerd*, slices to the module root's interior, and asserts those exact bytes
  appear in both the served page and the filesystem host's render — so two
  host-specific implementations that merely agree today would fail.
- **AC-1414** (`reconciliation-behavior-module-escaping.test.ts:26`) — real
  `getModule` Component. Holds the two failure modes apart precisely: payloads
  escaped-and-present (asserted on the *tags*, never on the word `onerror`), and
  an unsafe scheme **refused** with a throw plus an explicit assertion that no
  escaped-fallback branch emits anything.

Screened for the four disqualifying shapes across the capability:

- **Existence-only assertions**: none.
- **Source-text-only tests**: none.
- **Internal mocking**: exactly one, AC-702's negative arm
  (`reconciliation-behavior-modules.test.ts:561`,
  `vi.doMock('../packages/framework/src/worker')`). It is **no longer a finding**:
  AC-702's body now names that substitution as the arm's premise and states the
  condition under which it should be dropped. The `vi.spyOn(mounted.form, 'getAttribute')`
  in AC-877/878 fakes a DOM API — an external boundary.
- **Engine gating**: now honest everywhere. All three former bare
  `if (!HAVE_CHROMIUM) return` tails are `it.runIf`, observed skipping in this
  run alongside AC-683/AC-688.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-1622 (`acceptance_criterion-b796e4c7`) | **uat-relink** (+ small uat-add) | No `test_UAT_AC1622_*` exists. The evidence does: `tests/req93-l1-slot-mounted-behaviors.test.ts:349` (`test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder`) drives the real `renderL1Document` and proves the unmounted placeholder (`:352-353`), the mounted fragment inserted intact (`:356-359`), and no cross-talk from an unmatched key (`:361-362`) — the criterion's three main clauses. **It is invisible to the matrix only because of its name.** Two clauses are genuinely unproven: that the seam's `data-l1-slot`/`data-l1-behavior` attributes **and its emitted CSS rule** are identical in both states, and that the fragment lands *inside* the slot element rather than replacing it (asserted today only incidentally, in a different test at `:390`) | Rename `:349` to `test_UAT_AC1622_*`. Then add two assertions to it: compare the slot's emitted rule between the mounted and unmounted renders, and assert the fragment appears **inside** `data-l1-slot="form-0"`'s own element — the `/data-l1-slot="…"[^>]*>\s*<…/` shape `:390` already uses |
| 2 | violation | ac | AC-1623 (`acceptance_criterion-5334b71f`) | **uat-relink** (+ small uat-add) | No `test_UAT_AC1623_*` exists. `:145` proves the accepted bound page and `:154` proves **all five** rejections, each with its machine-readable path, against the real `validateSite` — a table-driven case per shape, exactly matching the criterion's list. Unproven: the criterion's **two legal states**. Its Verification requires that "both empty" (the starter page) and an **orphan seam** (a `slot` no module binds) each validate. Neither is asserted anywhere in the file — `grep -n orphan` returns only a comment at `:16`. The orphan case is load-bearing, not decorative: it is what makes the rule *one-directional*, and without it a future change could start rejecting orphan seams with every test still green | Rename `:145`/`:154` to `test_UAT_AC1623_*`. Add two accept-cases: a page with neither `modules` nor `l1`, and a page whose L1 tree carries a `slot` that no module binds — both asserting `result.ok === true` |
| 3 | violation | ac | AC-1624 (`acceptance_criterion-26894f8d`) | **uat-relink + uat-add** | No `test_UAT_AC1624_*` exists. `:415` (`test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations`) proves the mode *really mounts* rather than silently ignoring the flag — it reads back the served `home.json`, asserts `page.l1` is defined and `modules[0].slot === 'mount'`, and finds the module's markup inside the seam in the output. That covers the Verification's first clause only. **Three clauses have no arm at all**: (a) that the host's slot carries a keyframe at *each probed width* — the code does this at `harness.ts:145` (`l1HostDocument([...RESPONSIVE_WIDTHS])`) but nothing asserts it, and it is the whole reason a mounted failure is attributable to the module; (b) that the five dimensions applied are the **same set** as standalone — the criterion's headline claim of non-weakening; (c) the discriminating case, a fixture clean standalone that **overflows once pinned**, which is the defect class the mode exists to catch. Without (c) the mode could pass everything and the test would not notice | Rename `:415` to `test_UAT_AC1624_*` and add the three arms. **Sequencing warning**: see Warning 5 — this test cannot execute in a sandboxed run, so author (a) and (b) as assertions over `oneModulePage(...)`'s returned object and the dimension list, which need no loopback server, and keep only (c) behind the served harness |
| 4 | warning | ac | AC-1622, AC-1623, AC-1624 | field-hygiene | All three carry `status: pending` while the other 105 ACs in the capability are `status: active`. Left as-is — `pending` is the honest state for an AC whose evidence has not landed, and I did not want to manufacture activation | Flip to `active` in the same pass that lands the relink, so the three do not linger as permanently-pending rows |
| 5 | warning | uat | AC-703, AC-1624 (`conformance/harness.ts:196`) | — (no edit; environment) | Every test routed through `serveOneModulePage` fails in this sandbox with `listen EPERM: operation not permitted 0.0.0.0` — it binds a loopback port. This hit `test_UAT_AC703_*` and the REQ-93 conformance test in today's run. **Not a coverage defect and not a code defect**: AC-703's body is substantive and keeps its `pass`. It matters only because Finding 3's evidence lives behind exactly this gate | No repair. Recorded so a fix loop does not read `EPERM` as a regression and "fix" a working test. If the mounted-conformance arms must be provable in a sandboxed run, that is an infrastructure ask (an in-process handler instead of a real listener), not an AC edit |
| 6 | warning | uat | AC-702 (`reconciliation-behavior-modules.test.ts:561`) | — (no edit now) | The internal mock survives, now of `../packages/framework/src/worker`. **Downgraded from the prior cycle's warning to informational**: AC-702's body was rewritten to declare the substitution as the arm's premise and to name its retirement condition ("should the render path ever gain a catalog/resolver seam of the shape `assertModuleConforms` uses"). AC and test now agree, and the positive arm still carries every substantive claim against the real pipeline | No action. Listed so the retirement condition stays visible — it is the only internal mock in 108 UATs and should not quietly become precedent |

## Notes for the Editor

**This is one small, mechanical pass — do not re-plan it.** All three violations
are the same act on the same file, `tests/req93-l1-slot-mounted-behaviors.test.ts`:
rename four `test_UAT_FC_REQ-93_*` definitions (`:145`, `:154`, `:349`, `:415`) to
`test_UAT_AC<n>_*`, then add seven assertions. No new test file, no new fixture,
no production change. REPORT-2095 estimated Finding 4 at "90% done"; the editor
has since done the two hard halves — the story bodies and the ACs — and left the
cheapest one.

**Prefer renaming over authoring.** These four tests are better evidence than
anything written fresh against a month-old criterion: `:154` is table-driven over
all five rejection shapes with paths, and `:415` inspects the *served page* to
prove the harness is not ignoring its own flag. Writing new tests beside them
would duplicate that and leave the free-coded ones as orphans.

**One asymmetry worth respecting when you add arms.** Finding 3's three missing
arms are not equally cheap. (a) keyframe-per-width and (b) same-five-dimensions
can be asserted against `oneModulePage(...)` and the dimension list directly —
pure data, no server. Only (c), the overflow-when-pinned fixture, needs the
served harness, which is exactly what `EPERM` blocks in a sandbox. Splitting them
that way means two of the three arms stay executable everywhere; bundling all
three behind the server means AC-1624 is unverifiable in every sandboxed run.

**The prose is finally ahead of nothing.** For five cycles this report's refrain
was "matrix prose lagging behind code that is already correct and already
tested." That is no longer the shape of this capability: the bodies are current,
AC-718's four-cycle deadlock resolved once `labelMode` was recognised as its
destination, REQ-137 discharged its warning instead of escalating, and REQ-148
arrived already covered by three clean ACs. What is left is a `rename` and seven
`expect`s. If the next cycle still reports these three, the obstacle is not
comprehension — check whether the fix loop is treating the sandbox `EPERM` as the
blocker and stopping short.
