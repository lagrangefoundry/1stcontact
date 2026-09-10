---
uid: report-f5bcf66a
id: REPORT-3751
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T15:27:10.907631+00:00'
updated_at: '2026-09-10T15:27:10.907631+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories: STORY-84
(`story-8acc338d`, the fold) with **24** ACs and STORY-86 (`story-24098299`, the
3-probe gate + cross-gate reconciliation) with **17** — **41 in total**. Thirty-four
are `active`; seven are `pending` (AC-1625, AC-1626, AC-1627, AC-1628, AC-1629,
AC-1631 under STORY-84; AC-1630 under STORY-86). None is `deprecated`.

**Working reference.** The ac-level cycle passed (REPORT-3747 / `report-645376b9`)
and the story-level cycle passed (REPORT-3744 / `report-421de5ec`). Per the level
cascade the AC body is my working reference. I did not need to escalate to intent
history for any finding: every AC body I graded against is internally coherent and
its Verification section is unambiguous about what a UAT owes it. I confirmed no AC
ticket file has changed since the previous uat check was written
(`git log e74beb8213..HEAD --name-only` names no `acceptance_criterion` file), so
the bodies I graded are the same bodies REPORT-3748 graded.

**Method.** Independently re-derived, not carried over:

1. The AC set was rebuilt from the ticket store on disk (41 ACs, with `status` and
   `story_uid` per AC) rather than from the prior report's table.
2. The `test_UAT_AC<n>_*` symbol map was rebuilt by repo-wide grep over `tests/`,
   restricted to *declarations* (`it('test_UAT_AC…`) so that comment references —
   the `test_UAT_AC733_` at `…full-language.test.ts:218` and the
   `test_UAT_AC1133_`/`AC1134_` at `:95` — are not miscounted as tests.
3. **All nine AC-traced files were executed** in this worktree via
   `npm test -- <files>`: **9 files, 41 tests, all passing** (1.36s).
4. Every UAT that the previous cycle named in a finding was read in full against
   its live AC body, and I read the untouched cross-gate and 3-probe UATs directly
   rather than accepting a prior "aligned" verdict.

**Result of the symbol map.** 41 ACs, 41 UAT declarations, **exactly one per AC** —
no AC without a test, no orphan test naming an AC that does not exist, no AC
number declared twice.

**Evidence validity.** No internal mocking in any of the nine files. The only
`vi.spyOn` uses are `console.log`/`console.error` capture and — at
`…seams-and-refold.test.ts:540` — a `globalThis.fetch` spy, which is the *external*
boundary and is there precisely to prove AC-814's "refold is offline" claim. Every
UAT drives real entry points (`cmdCapturePage`, `foldToL1`, `partitionProbes`,
`validateL1`, `renderL1Document`, `evaluateLayout`, the three probes,
`promoteToFlow`, `threeProbeGate`, `cmdRepro`, `cmdGate`, and the `1c` CLI itself).

**The headline.** REPORT-3748 (`report-7f31793a`) filed 10 violations and 4
warnings. **All 14 are closed**, and I verified each one by reading the code rather
than by reading the fix report:

- The two fifth-consecutive-offence violations on `tests/reconciliation-l1-fold.test.ts`
  are **finally repaired** — `git log -1` on that file no longer returns
  `f0367940d3` (2026-07-22) but `51fbf84507`, with `a04d29b9aa` before it.
- **AC-1630 — the criterion that had no executable evidence anywhere in the
  repository — now has the strongest UAT of the seven new ones.**

## Cumulative Intent Considered

At `uat` level intent is consulted only where an AC is itself suspicious. None was
this run. The three intents attached directly to the two stories were re-read live
and their statuses confirmed from the ticket store; the remainder of the ledger is
carried from REPORT-3747 / REPORT-3748, which derived it at the levels that own it.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Both stories' `intent_uid` — REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Band → card surface reconstruction (AC-731) | YES |
| BUG-17 | free_and_reconciled | 2026-07-23 | Per-side padding folds and insets (AC-1626) | YES |
| BUG-18 | free_and_reconciled | 2026-07-23 | Responsive text axes keyframed per width (AC-1625, AC-691) | YES |
| BUG-23 | free_and_reconciled | 2026-07-2x | Reproduction assets localized to the mirror (AC-1628) | YES |
| BUG-24 | free_and_reconciled | 2026-07-2x | Band scrim alpha folds onto the section-bg box (AC-1629) | YES |
| BUNDLE-8 / BUNDLE-10 | free_and_reconciled | 2026-07-29 | The full-language fold (AC-689's multi-kind clause, AC-729…AC-733) | YES |
| REQ-88 | free_and_reconciled | — | Viewport-height probe + nowrap threshold + column anchoring (AC-1627, AC-1631) | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | STORY-86's `updated_by` — BUG-27 + REQ-94 + REQ-96 + REQ-97 + REQ-98 + 10 more | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Typed framing + colour adjustment; AC-1133/AC-1134, widened AC-729 | YES |

REQ-114 and REQ-154 owe this capability nothing. REQ-82/84/85 belong to CAP-70 per
this capability's own "Out of scope" section.

## Alignment Ledger

### STORY-84 (fold) — 24 ACs, 24 UATs

| AC | UAT | Outcome |
|---|---|---|
| AC-689 | `…l1-fold.test.ts:342` | **aligned — repaired.** `signalsFor()` now carries a media element and a painted panel alongside its run (`:160-177`), and the test asserts on the `l1.json` read back from the bundle that the leaf-kind set has size > 1 and contains `text`, `image` **and** `box` (`:366-370`). The BUNDLE-8 full-language clause is now exercisable *and* exercised through the `cmdCapturePage` path the AC is about. REPORT-3748 v9 closes. |
| AC-690 | `…l1-fold.test.ts:378` | aligned |
| AC-691 | `…l1-fold.test.ts:401` | **aligned — repaired, both halves.** (a) The height rule: `kfs.every((k) => k.height === undefined)` plus a per-keyframe `not.toHaveProperty('height')` on the text leaf (`:464-465`), and a media leaf and a painted panel added to the fixture, each asserting `kf.height` equals the captured box height at all three widths (`:484-514`). (b) The constant-axis clause: a second run, `Standing Tagline`, whose typography is identical at every width, carries the scalar from the widest sample and `responsive?.fontSizePx` is asserted `toBeUndefined` (`:469-481`) — the negative form, which is AC-691's own Verification, leaving the positive track assertions to AC-1625 exactly as REPORT-3748's info 18 required. REPORT-3748 v8 closes. |
| AC-692 | `…l1-fold.test.ts:517` | aligned |
| AC-693 | `…l1-fold.test.ts:544` | aligned |
| AC-694 | `…l1-fold.test.ts:570` | **aligned — repaired.** All six sidecar dimensions are now asserted on the always-run path (`:590-618`): ancestry (root `parentId: null`, every child's parent present in the sidecar), non-null `parentLayout` with `justifyContent === 'space-between'`, both sizing axes independently, a three-valued `position` set, `repeatCount >= 1` everywhere and `> 1` somewhere, and a non-empty breakpoint list so the ascending check is not vacuous. The engine-gated branch was **retained**, re-labelled as extraction *accuracy* (see info 2). REPORT-3748 w11 closes. |
| AC-695 | `…l1-fold.test.ts:652` | aligned |
| AC-696 | `…l1-fold.test.ts:673` | aligned |
| AC-729 | `…full-language.test.ts:91` | **aligned — repaired, both warnings.** The `hero-media` fixture now paints `objectPosition: '30% 70%'` and `filter: 'saturate(0.6)'` alongside the six finishing axes (`:112-122`), and the closed `toEqual` (`:176-185`) carries all three families — the only fixture in the repo where one image element paints framing + adjustment + finishing, which is what makes the closed assertion prove AC-729's *union* claim. The bare `logo` gained the negative form (`:188-190`). The src-less residual tail is **deleted** and replaced with a boundary comment (`:216-221`), leaving that behaviour to `test_UAT_AC733`. REPORT-3748 w13 + w14 close. |
| AC-730 | `…full-language.test.ts:228` | aligned |
| AC-731 | `…full-language.test.ts:317` | aligned |
| AC-732 | `…full-language.test.ts:398` | aligned |
| AC-733 | `…full-language.test.ts:516` | aligned — now the sole owner of the residual channel |
| AC-812 | `…seams-and-refold.test.ts:101` | **aligned — repaired.** The peer half of the layering rule is now asserted twice, on node sets the fixture already built: `backdropIndex > max(heroBands index)` (`:170-174`) and the same order in the rendered HTML, where it is what actually paints (`:176-181`). REPORT-3748 w12 closes after four re-raises. |
| AC-813 | `…seams-and-refold.test.ts:249` | aligned |
| AC-814 | `…seams-and-refold.test.ts:518` | aligned — the `fetch` spy is the offline proof, not a mock of an internal |
| AC-1133 | `…framing-and-adjustment.test.ts:92` | aligned — still the standard in this capability (closes on negative space) |
| AC-1134 | `…framing-and-adjustment.test.ts:164` | aligned — same |
| **AC-1625** | `…responsive-axes.test.ts:130` | **aligned — new.** One fixture, two runs. All three numeric type axes vary, each asserted as one keyframe per sampled width equal to that width's captured value, `segments` **undefined** (so the default is `interpolate`), and the widest keyframe `toBe` the leaf's scalar (`:174-193`). Left/right padding tracks while top/bottom stay scalar **on the same element** (`:196-204`) — the pair the AC exists to separate. The constant run carries `responsive === undefined` *and* `responsivePadding === undefined` with its scalars intact (`:206-212`). The render half closes on negative space: `expect(base).not.toMatch(/font-size: 72px/)` (`:222`), and a `mediaBlock()` helper slices each breakpoint's own block so an assertion cannot drift into a neighbouring one. |
| **AC-1626** | `…responsive-axes.test.ts:244` | **aligned — new.** Four elements: an asymmetric four-side badge, a padding-free run, an all-zero-sided run, and a padded **image** (the AC names text, image and box leaves). The load-bearing assertion is the one the BUG-17 free-coded tests never made — the geometry keyframes are **unchanged** by the fold of the padding, checked per rung against the captured border box (`:304-314`). Both no-axis cases assert `padding` is `undefined` (`:317-318`); the render half asserts `box-sizing: border-box`, all four longhands, the badge's declared width still the captured border-box width, and that an absent side never emits (`:326-339`). |
| **AC-1627** | `…responsive-axes.test.ts:461` | **aligned — new.** Measured `heightFactor`/`yFactor` from a real probe pair; **a node unaffected by viewport height carries no response** (`:481`); `partitionProbes` keeps the ladder at six widths with the probe partitioned off (`:485-487`); and — swept over *every* folded node — no duplicate keyframe width, every `at` on the ladder, and `kf.atHeight` equal to that rung's captured height (`:488-499`), with the resulting identity asserted in the emitted CSS (`:502`). The reconstructed card inherits its representative row's response, with a follow-up `?.yFactor === 1` so the equality cannot be two `undefined`s (`:505-509`). The no-probe half is the strong form: `stripResponses(noProbe)` deep-equals `stripResponses(withProbe)` (`:519`). |
| **AC-1628** | `…bundle-materialization.test.ts:122` | **aligned — new.** Drives the real `cmdRepro`. Beyond node-count parity it asserts the exact "copied verbatim" claim — the written page's `l1` deep-equals the bundle's document with **only** the three media handles rebound (`:141-148`). The localized count is checked to equal the `/assets/…` handles actually in the written document, not the bundle's five assets nor its four images (`:153-157`), and the written JSON names neither the captured origin nor `fonts.gstatic.com`. Idempotence is a full recursive directory snapshot compared across two runs (`:173-180`). All four rejection paths are covered, and the failed import is asserted to leave the previously written good draft byte-for-byte intact (`:194`) — a discriminating negative. |
| **AC-1629** | `…full-language.test.ts:645` | **aligned — new.** Exactly one section-background box carries **both** axes (`:662-670`); the scrim's alpha is asserted *not* to become element `opacity` nor a plain `surfaceFill` (`:673-675`); the renderer layers it above the image within one box, matched as a `linear-gradient(#0206184d, #0206184d), url(…hero.jpg)` (`:681-684`). Both negative controls are present (`:688-707`). And it closes the clause no BUG-24 free-coded test does: each axis read from the **widest sampled width that carries it**, proven in both directions — image at the narrow rungs only, then image at the wide rungs only (`:713-758`). |
| **AC-1631** | `…responsive-axes.test.ts:359` | **aligned — new.** Single-line everywhere → **320**, the narrowest rung. The suffix case: single line at 320/375 **and** 1280/1440 but wrapping at 768/1024 → **1280**, with an explicit `not.toBe(320)` (`:371-374`). Unmeasurable line count at the widest sample breaks the suffix → no axis, document still valid (`:381-393`). Wraps-everywhere → no axis. Closes on the "width, not a flag" claim: three runs on one page resolve to three *different* thresholds (`:408-410`). Stays on the fold's side of the CAP-70 boundary — it never touches the renderer's wrapping floor. |

### STORY-86 (gate + cross-gate) — 17 ACs, 17 UATs

| AC | UAT | Outcome |
|---|---|---|
| AC-705 | `…3probe-gate.test.ts:299` | aligned |
| AC-706 | `…3probe-gate.test.ts:448` | aligned — pass and fail sides, plus the multi-region recovery case; its delegated pinned-box clause is now closed by AC-1630's UAT |
| AC-707 | `…3probe-gate.test.ts:481` | aligned — same, plus the "collisions are several piles, not one" assertion that forces region-aware recovery |
| AC-708 | `…3probe-gate.test.ts:524` | aligned — non-vacuous in both directions |
| AC-709 | `…3probe-gate.test.ts:551` | aligned |
| AC-710 | `…3probe-gate.test.ts:636` | **aligned — repaired.** The UAT now forces **all three** violation shapes. The third is a purpose-built 300px-wide pinned card (so the viewport clip cannot fire and stand in for it), asserted `toHaveLength(1)`, `detail` matching `/content height \d+px exceeds pinned box height \d+px/`, `paths` exactly `['0.0']`, and closing with `expect(clip.detail).not.toEqual(overflowClip.detail)` so the two `clip` shapes are provably distinguishable (`:676-718`). REPORT-3748 v10 closes. |
| AC-724 | `…3probe-gate.test.ts:721` | aligned |
| AC-734 | `…gate-evaluator.test.ts:118` | aligned |
| AC-735 | `…gate-evaluator.test.ts:307` | aligned |
| AC-736 | `…gate-evaluator.test.ts:386` | aligned |
| AC-737 | `…gate-evaluator.test.ts:728` | aligned — drives the real `1c` CLI |
| AC-852…AC-856 | `…cross-gate-reconciliation.test.ts:250…659` | aligned — read directly this cycle, not carried over. AC-852 drives the real `cmdGate` *and* the CLI, asserts all four signals side by side, proves the browser-free-first ordering with a `neverDriver()` whose call count must stay 0, and asserts the exit status follows the verdict in both directions. |
| **AC-1630** | `…gate-evaluator.test.ts:524` | **aligned — new, and the strongest of the seven.** Every Verification clause closes: `toHaveLength(1)` on the finding (so the horizontal viewport clip cannot satisfy it), `detail` pinned to the exact string `'content height 66px exceeds pinned box height 40px'` **and** `not.toMatch(/exceeds viewport/)`, `paths` equal to the card's index path (`:534-544`); ceiling raised → no finding; height-less node → no finding, with a follow-up asserting the interior really is 66px tall so the pass is the absent ceiling and not a shrunken interior (`:552-558`); the epsilon boundary walked at 65/64/63px (`:563-565`); the off-sample probe on a document that is clean at **every** ladder rung and fails only at 500px, clean again at 900px (`:572-591`); and the content-robustness probe passing unperturbed and failing at every captured width when grown (`:597-614`). The branch at `tools/generate/src/l1/probes.ts:410` can no longer be deleted without reddening a test. REPORT-3748 v1 — and REPORT-2090's info 9 chain, open since 2026-08-05 — close. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | all 41 ACs | — | **Every active and pending AC in this capability has exactly one substantive AC-traced UAT, and all 41 pass.** Symbol map rebuilt from declarations only: 41 ACs → 41 `it('test_UAT_AC<n>_…')` declarations, no gap, no orphan, no duplicate number. Executed this run: `npm test --` over the nine files → **9 files, 41 tests, all passing** (1.36s). Every one drives real entry points; no internal component is mocked anywhere in the nine files. | none |
| 2 | info | consistency | AC-694 (`acceptance_criterion-c8dd43d2`) | — | Recorded so it is not re-raised as new drift. AC-694's six-dimension **contract** is now proven on the always-run path, but it is proven against `CANNED_HINTS` returned verbatim by `FakeDriver` — i.e. it proves the sidecar's shape survives extraction → disk → read, not that the extraction script *computes* those six values. The accuracy half remains behind `if (!(await chromiumAvailable())) return` (`…l1-fold.test.ts:624`) and does not run in this environment (the nine files complete in 1.36s — no browser is launched). **This is exactly the repair REPORT-3748 w11 prescribed** ("move the contract assertions onto the always-run path, leaving only extraction *accuracy* engine-gated. **Do not repair by deleting the skip**"), and the skip was correctly retained. The residual is an environment bound, not matrix drift. | none |
| 3 | info | — | AC-1625…AC-1631 (7 `pending` ACs), AC-689 / AC-691 / AC-694 (`uat_coverage: fail`) | — | Ticket-field state is stale relative to the tests and is **not** this level's to repair. The seven ACs authored in the last two cycles remain `status: pending` and carry no `uat_coverage` field; AC-689, AC-691 and AC-694 still carry `uat_coverage: fail` from before their repairs landed. `uat_coverage` is owned by `check_uat_coverage` / `fix_uat_coverage`, and the fix loop was right to leave it alone rather than assert a verdict this check computes from the tests. Recorded so the downstream coverage check knows the underlying evidence now exists and is green. | none |
| 4 | info | exclusivity | AC-691 ↔ AC-1625; AC-729 ↔ AC-733; AC-1630 ↔ AC-710 | — | The three boundaries REPORT-3748's info 18 warned a UAT author could cross by accident were each held. **AC-691 vs AC-1625**: AC-691's new constant-typography run asserts the *negative* (`responsive?.fontSizePx` undefined) — its own Verification clause — while the positive per-width track assertions live only in AC-1625's test. **AC-729 vs AC-733**: the duplicated src-less residual tail was deleted from `test_UAT_AC729`, leaving one test on that behaviour. **AC-1630 vs AC-710**: rule-by-rule proof vs diagnostic-contract proof; the two build the same document shape but assert disjoint claims, and AC-710 additionally asserts the two `clip` details are distinguishable, which AC-1630 does not. Across all 41 ACs, no genuine duplicate. | none |

## Notes for the Editor

**Nothing to do at this level.** All 10 violations and all 4 warnings from
REPORT-3748 (`report-7f31793a`) are closed, verified by reading each repaired UAT
against its live AC body and by executing all nine files, not by reading the fix
reports.

Two items are worth recording for whoever picks this capability up next:

**The long-running file is finally repaired.** `tests/reconciliation-l1-fold.test.ts`
had been named in five consecutive reports without a single commit against it
(`git log -1` returned `f0367940d3`, 2026-07-22, in every one). It now carries two
commits from this cycle, and both violations it hosted — AC-689's unexercisable
full-language clause and AC-691's missing height rule plus its wrong-branch fixture
— are closed with the fixture work shared between them, as the previous report
suggested.

**AC-1630 went from the weakest position in the capability to the strongest.** It
was the only criterion with no executable evidence of any kind, and
`probes.ts:410`'s branch could have been deleted without reddening a test. Its UAT
now closes on `toHaveLength(1)` and an exact detail string rather than a permissive
`.some(…)` — which is what discriminates the pinned-box overflow from the
horizontal viewport clip that fires in the same documents — and it walks the
epsilon boundary at 65/64/63px. It is now a fair rival to `test_UAT_AC1133_*` /
`test_UAT_AC1134_*` as the model to copy in this capability.

**Method boundary.** Verified this session in this worktree
(`regression-800a17f7`, HEAD `51fbf84507`): the AC set, status and `story_uid` map
for all 41 ACs read from the ticket store on disk; the live bodies of AC-689,
AC-691, AC-694, AC-710, AC-729, AC-812, AC-1625, AC-1626, AC-1627, AC-1628,
AC-1629, AC-1630 and AC-1631; the `free_and_reconciled` status of BUNDLE-7,
BUNDLE-11 and REQ-136 from the ticket store; the full `test_UAT_AC*` declaration
set across `tests/`; a mocking sweep over all nine files; `git log` on the two
previously-untouched files and on `.xgd/tickets` since the prior report's commit;
and **an execution of all nine AC-traced files (41 tests, all passing)**. Not
performed: the free-coded suites named as adjacent evidence in the previous cycle
were not re-run this session — the consolidations no longer depend on them.
