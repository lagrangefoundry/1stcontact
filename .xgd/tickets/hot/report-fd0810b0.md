---
uid: report-fd0810b0
id: REPORT-1047
type: report
title: 'Reconciliation Review: commits (BUNDLE-8)'
created_by: xgd
created_at: '2026-07-29T05:17:58.372595+00:00'
updated_at: '2026-07-29T05:17:58.372595+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-cceaba25
  anchor_uid: bundle-cceaba25
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Anchor**: bundle-cceaba25 (BUNDLE-8)
**Stories Reviewed**: 5

Re-review after `fix_reconciliation_review` closed the two Step 5b findings raised by REPORT-1042. Both are closed with discriminating evidence; no new gaps found.

## Behavior Inventory

9 feature areas across 11 free-coded commits, verified independently by reading `packages/site-schema/src/l1/{schema,types,validate}.ts`, `packages/framework/src/l1/render.ts`, `tools/generate/src/l1/{fold,probes}.ts`, `tools/generate/src/cli/capture/{extract,sections,types,values-diff,capture}.ts`, `tools/generate/src/cli/{repro,index}.ts`, `tools/generate/bin/1c.mjs`, `tools/generate/src/render/render.ts`.

Production footprint vs merge-base `c8de6708`: 4 files under `packages/`, 11 under `tools/`. Every one is declared by a bundled intent — no Case 3 (out-of-footprint) change.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | L1 typed pixel-mover axes (~15, structured forms; identity values omitted) | Covered | story-d0a8cfad | AC-725 asserts per-family emitted CSS incl. background layer order and the identity/no-op omission |
| 2 | Envelope rejection of malformed structured axes | Covered | story-d0a8cfad | AC-726 |
| 3 | Document font resource table + @font-face safe sink | Covered | story-d0a8cfad | AC-727/728 |
| 4 | Full-language fold: image / box / backing-surface leaves + page band | Covered | story-8acc338d | AC-729/730/731 |
| 5 | Text pixel-mover families folded + font table restricted to painted families | Covered | story-8acc338d | AC-732 |
| 6 | Signal-not-drop typed FoldResiduals + form-control behavior seam | Covered | story-8acc338d | AC-733 |
| 7 | Analytic evaluator flex-row tiling (grid conservatively a stack) | Covered | story-24098299 | AC-734 |
| 8 | Half-open breakpoint intervals `[a.at, b.at)` | Covered | story-24098299 | AC-735, differential oracle |
| 9 | Backing surface is not a sibling overlap, still clips | Covered | story-24098299 | AC-736 |
| 10 | l1-gate fold-residual channel (object, human, --json) | Covered | story-24098299 | AC-737, via the real CLI |
| 11 | Fidelity probe over non-text (image/box) leaves | **Covered (was Partial)** | story-24098299 | AC-705 — closed by the fix loop |
| 12 | Region-aware recursive structure recovery | **Covered (was Partial)** | story-24098299 | AC-709 — closed by the fix loop |
| 13 | Multi-region envelope after recovery | Covered | story-24098299 | AC-706/707 |
| 14 | Quiet 1c bootstrap (no 'Missing pages directory' on either stream) | Covered | story-e15a19ef | AC-738, real binary via spawnSync |
| 15 | Astro container constructed only for behavior-module pages | Covered | story-e15a19ef | AC-739 |
| 16 | Capture records a list marker only where one is painted | Covered | story-d5de22a5 | AC-711, real EXTRACT_SCRIPT under jsdom |
| 17 | image `src`/`alt` plumbing through Field -> ValueElement | Covered | story-8acc338d | Verified pure carry-through: comparison runs off an explicit axis list (`SUBSCALE_AXES`), so no values-diff behaviour changed. Correctly reconciled under AC-729, not as a STORY-75 change |

## Step 5b: Evidence Sufficiency

All 54 active ACs across the five stories map to a `test_UAT_AC{N}_*` UAT. Full suite: **659/659 pass, 98 files** (verified this turn, `npx vitest run`, exit 0).

The two previously-failing ACs now carry evidence that distinguishes the new behaviour from the behaviour it superseded:

- **AC-709** — `tests/reconciliation-3probe-gate.test.ts:549` adds a hero/grid/footer fixture with per-band pitches 60/90/60 plus a non-colliding survivor run. It asserts `promoted !== ['0']`, three distinct nested `0.N` paths, per-region `gapPx === [60, 90, 60]` (a single shared median gap cannot produce this), `pinnedDescendants(recovered) === []` (the survivor is flowed, not left pinned), the envelope holding at every width, `validateL1().ok`, and base fidelity byte-identical pre/post recovery. The whole-node case was also tightened from `toContain('0')` to `toEqual(['0'])`. None of these assertions can pass under single-level flat promotion.
- **AC-705** — the same file adds `mixedKindOracle` (one text run, two images at y=200/600, a painted surface, a form control, an empty run). It asserts the reproduced tree is exactly `[box, image, image, text]`; the probe gates clean — which is itself the occurrence discriminator, since a kind→single-box map would report a phantom dy of 400 on the first image at every width; drift on one image yields exactly one residual labelled `(image)` with `dy≈25`; surplus oracle occurrences yield exactly one unmatched labelled `(image)` / `(box)`; and neither the control nor the empty run produces an unmatched entry.
- **AC-706 / AC-707** — both now exercise the multi-region recovered overlay, assert per-width failing-width reporting, and assert the pinned base's collisions spread across more than two distinct children. The unverifiable "real retained capture" qualifier was narrowed to "multi-region page / fold" — correct, since `storage/references` is gitignored and absent on a clean checkout, so no UAT could ever have carried that wording.

Evidence-quality checks on the newly-added and modified UATs:
- **No internal mocking.** The only spies are on `console.log`/`console.error` (CLI stdout observation) and on `experimental_AstroContainer.create` in AC-739 — the latter only *observes*, never stubs, and its positive case (`toHaveBeenCalled` on a module page) proves the spy is wired to the real production path, making the negative cases meaningful.
- **No source-inspection tests.** Every assertion observes runtime output — emitted CSS, probe reports, CLI stdout/stderr, exit codes, extracted capture values.
- **Real entry points.** AC-737 drives `cmdL1Gate` and the real `run(argv)` CLI in both human and `--json` form; AC-738 spawns the real `1c` binary as a subprocess; AC-711 evaluates the real `EXTRACT_SCRIPT` under jsdom.
- **Differential oracles where a superseded behaviour exists.** AC-735 reimplements the closed-upper-bound resolution locally (`resolveClosedUpperBound`) and asserts it returns the stale 375 keyframe (x=48, y=2028, w=279) while the production evaluator returns the post-reflow frame (x=299, y=1831, w=171) — the two candidates provably differ.

## Intent Fidelity

All three implementation-time corrections recorded in the ticket bodies are reflected in the stories rather than silently absorbed:

- **BUG-8** — the stories document the *evaluator's* half-open interval semantics, and STORY-86's Technical Context states explicitly that the closed upper bound "was diagnosed as an *evaluator* defect, not a fold defect: capture and fold were always emitting a keyframe at the reflow breakpoint. No fold change was required." The ticket's disproven fold-drop hypothesis is not documented as behaviour.
- **REQ-89** — the stories document the launcher's Astro logger and the conditional container. No story claims the abandoned lazy module-registry / `getModule`-async change.
- **BUG-6** — its behaviour shipped inside REQ-92's commit; its contract is reconciled as ACs on the fold (AC-733) and the gate (AC-737) rather than as a test-only story.

STORY-86 also flags its own approximations rather than overclaiming: the row width model and grid-as-stack are recorded as "deliberate approximations of the renderer, not claims of fidelity to it", and the ACs pin the observable guarantee (a well-formed row raises no false overflow; genuine overflow still clips) rather than the share formula.

## Ungrounded Stories

None. No story claims behaviour absent from the code.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. L1 substrate — pixel-mover axes + resource table | story-d0a8cfad (STORY-83) | OK — AC-725/726/727/728 added; AC-685/686 modified |
| 2. Capture-to-L1 fold — full language + residuals | story-8acc338d (STORY-84) | OK — AC-729/730/731/732/733 added; AC-689/691 modified |
| 3. 3-probe gate — evaluator + recovery + residual channel | story-24098299 (STORY-86) | OK — AC-734/735/736/737 added; AC-705/706/707/709 modified and now evidenced |
| 4. 1c CLI output hygiene | story-e15a19ef (STORY-79) | OK — AC-738/739 added; AC-658 modified |
| 5. Capture list-marker gate | story-d5de22a5 (STORY-75) | OK — AC-711 modified, active, passing UAT |

No plan items dropped. All 5 stories carry `updated_by: bundle-cceaba25` and `uat_coverage: pass`.

## Judgment Calls

- **`fontResourcesFromTheme`'s weight heuristic** (a single-weight family pins its weight; a multi-weight family leaves it unset) is not separately pinned by an AC. Accepted as an internal detail: AC-732 covers the observable contract (the table binds only families a folded text leaf paints), and a developer would not be surprised by the aggregation rule.
- **`src`/`alt` plumbing through `values-diff.ts`** accepted under AC-729 rather than as a STORY-75 change. Verified directly: `fieldToElement` only copies the fields, and the diff engine compares via an explicit axis list, so no comparison behaviour changed.
- **AC-685/686/689/691/658 extensions accepted** without their own UATs changing, because each extended claim is proven by a passing UAT on a newly-added sibling AC in the same story. AC-to-test attribution tightness is structural validation's concern; the behaviour is genuinely proven.
- **AC-706/707's narrowed wording accepted.** Replacing "real retained capture" with "multi-region page / fold" removes an unverifiable qualifier rather than weakening the criterion — the substantive claim (a single flat pile is insufficient) is retained and now asserted.

## Verdict

**PASS**. Stories accurately and completely document the behaviour surface, and they document the operator's *intent* — including the two disproven root-cause hypotheses, which are flagged as corrections rather than absorbed. All five plan items produced output. Every active AC has a passing UAT that enters through a real interface, mocks nothing repository-owned, and asserts an observable outcome a broken implementation would fail. A developer reading these stories would have a correct mental model of what this code does and why.