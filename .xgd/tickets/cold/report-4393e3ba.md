---
uid: report-4393e3ba
id: REPORT-1042
type: report
title: 'Reconciliation Review: commits (BUNDLE-8)'
created_by: xgd
created_at: '2026-07-29T04:58:00.897950+00:00'
updated_at: '2026-07-29T04:58:00.897950+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-cceaba25
  anchor_uid: bundle-cceaba25
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Anchor**: bundle-cceaba25 (BUNDLE-8)
**Stories Reviewed**: 5

## Summary

Intent fidelity is strong and plan-item accounting is complete. The review fails on
**Step 5b (evidence sufficiency)**: two acceptance criteria on STORY-86 were *broadened
in text* by plan item 3 but received no new or updated UAT, and their existing UATs
cannot distinguish the new behaviour from the behaviour it superseded.

## Behavior Inventory

9 feature areas identified in the code across 11 free-coded commits (see plan
report-fea0d724). Independently verified by reading
`packages/site-schema/src/l1/{schema,validate}.ts`, `packages/framework/src/l1/render.ts`,
`tools/generate/src/l1/{fold,probes}.ts`, `tools/generate/src/cli/capture/extract.ts`,
`tools/generate/bin/1c.mjs`, `tools/generate/src/render/render.ts`.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | L1 typed pixel-mover axes (~15, structured forms) | Covered | story-d0a8cfad | AC-725/726 |
| 2 | Document font resource table + @font-face sink | Covered | story-d0a8cfad | AC-727/728 |
| 3 | Full-language fold (image/box/surface leaves, band) | Covered | story-8acc338d | AC-729/730/731/732 |
| 4 | Signal-not-drop typed FoldResiduals + field seam | Covered | story-8acc338d | AC-733 |
| 5 | Analytic evaluator flex-row model | Covered | story-24098299 | AC-734 |
| 6 | Half-open breakpoint intervals | Covered | story-24098299 | AC-735, differential oracle |
| 7 | Backing surface is not a collision | Covered | story-24098299 | AC-736 |
| 8 | l1-gate fold-residual channel | Covered | story-24098299 | AC-737 |
| 9 | Region-aware recursive structure recovery | **Partial** | story-24098299 | AC-709 text updated; **no distinguishing UAT** |
| 10 | Fidelity probe over non-text (image/box) leaves | **Partial** | story-24098299 | AC-705 text updated; **UAT is text-only** |
| 11 | Quiet 1c bootstrap (no 'Missing pages directory') | Covered | story-e15a19ef | AC-738, verified against real binary |
| 12 | Astro container only for behavior-module pages | Covered | story-e15a19ef | AC-739 |
| 13 | Capture list marker gated on display:list-item | Covered | story-d5de22a5 | AC-711, real EXTRACT_SCRIPT |

## Evidence Sufficiency Failures (Step 5b)

### 1. AC-709 (story-24098299) — UAT passes under the superseded implementation

AC-709 now claims recovery is **region-aware and recursive**: colliding direct children
form connected components, each promoted to its own flow stack with its own interior gap;
a recovering node flows *all* its children so no pinned sibling is left behind; and
`promoted` reports **nested region paths**.

Its only covering UAT, `test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups`
(`tests/reconciliation-3probe-gate.test.ts:307`), asserts only:

- `expect(promoted).toContain('0')`
- envelope holds after recovery; result validates; a roomy page promotes nothing

`promoted == ['0']` is **exactly what the superseded single-level implementation produced**
— BUG-9's ticket body records the defect as `promoted == ['0']`. The UAT therefore passes
with the AC's new behaviour entirely removed, which is a Step 5b disqualifier.

The distinguishing assertions exist **only** in the free-coded test
`tests/bug9-region-aware-promote.test.ts:95-98`
(`expect(promoted).not.toEqual(['0'])`, `expect(promoted.length).toBe(3)`,
`expect(p).toMatch(/^0\.\d+$/)`) — an FC test with no AC behind it. Plan item 3's own
justification names this as the gap it exists to close, so the reconciliation did not
achieve its stated purpose for this behaviour.

**Remediation**: author a UAT under AC-709 using a multi-region fixture (grid + footer)
that asserts nested region paths (`0.0`, `0.1`, …), that `promoted != ['0']`, that a
recovering node leaves no pinned sibling, and that base `sampleFidelity` is unchanged by
recovery. `tests/bug9-region-aware-promote.test.ts` already contains a working fixture.

### 2. AC-705 (story-24098299) — extension to non-text leaves is unasserted

AC-705 now claims image and box leaves pair with oracle samples **by kind-keyed
document-order occurrence**, with oracle samples classified through the fold's own
`classifyElement` so controls and empty runs are excluded, and unmatched occurrences
labelled `(image)`/`(box)`.

`test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance`
(`tests/reconciliation-3probe-gate.test.ts:156`) is entirely text-based: it asserts
`r.text === HEADLINE` and perturbs a text box. It contains no image or box leaf, no
kind-keyed pairing, no classifier-based exclusion, and no `(image)`/`(box)` unmatched
label. No sibling AC carries the claim — item 3's added ACs are 734 (row), 735 (half-open),
736 (surface overlap), 737 (residual channel).

**Remediation**: extend or add a UAT under AC-705 folding a capture containing image and
box elements plus a form control and an empty run, asserting kind-keyed occurrence pairing,
exclusion of controls/empty runs, and an unmatched entry labelled `(image)`/`(box)`.

### 3. AC-706 / AC-707 (story-24098299) — minor, not load-bearing

The modify clause claims both probes hold "after region-aware recovery on a **real
multi-region capture**, where single-level promotion previously left them failing at every
width". The UATs exercise `promoteToFlow` on a synthetic single-region fixture. The core
claim (envelope holds after recovery) is proven; the multi-region/real-capture qualifier is
not. Recorded for completeness — fixing finding 1 will most likely cover it.

## Why items 1, 2, 4, 5 pass despite also modifying ACs

Their modify-clauses' substance is carried by newly-added **sibling ACs with passing UATs**:

- AC-685/686 (injection inert, range rejection) extended to the new families → proven by
  AC-726 (non-hex stop/border, off-allowlist URL, out-of-range shadow/scale, freeform key)
  and AC-727/728 (font sink: `data:` and `javascript:` blocked, family sanitised away,
  quote escaped inside `url("…")`, exactly one rule survives).
- AC-689/691 (full-language document, four-side pinning) → proven by AC-729/730/731/732/733.
- AC-658 (diagnostics on stderr) → superseded mechanism proven by AC-738.
- AC-711 modified in place and covered by a new UAT running the **real** `EXTRACT_SCRIPT`
  under jsdom (`tests/reconciliation-capture-list-marker.test.ts`).

## Ungrounded Stories

None. No story claims behaviour absent from the code. Both disproven root-cause hypotheses
are correctly reflected rather than silently absorbed:

- **BUG-8** — the stories document the *evaluator's* half-open interval semantics, not the
  fold-drop the ticket originally hypothesised. No production change was claimed.
- **REQ-89** — the stories document the launcher's Astro logger and the conditional
  container. Grep confirms **no** story claims the abandoned lazy module-registry /
  `getModule`-async change.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. L1 substrate — pixel-mover axes + resource table | story-d0a8cfad (STORY-83) | OK — 4 ACs added (725-728), 685/686 modified |
| 2. Capture-to-L1 fold — full language + residuals | story-8acc338d (STORY-84) | OK — 5 ACs added (729-733), 689/691 modified |
| 3. 3-probe gate — evaluator + recovery + residuals | story-24098299 (STORY-86) | OK structurally — 4 ACs added (734-737), 705/706/707/709 modified; **evidence gap on 705/709** |
| 4. 1c CLI output hygiene | story-e15a19ef (STORY-79) | OK — 2 ACs added (738-739), 658 modified |
| 5. Capture list-marker gate | story-d5de22a5 (STORY-75) | OK — AC-711 modified, now active with passing UAT |

No plan items were dropped. All 5 stories carry `updated_by: bundle-cceaba25`.

## Verification Performed

- Reconciliation invariant holds: diffing the reconciliation range (`b9eb64b2b..HEAD`,
  excluding tickets) yields **5 added test files, 2131 insertions, zero production code**.
- Clean rebuild (`pnpm -r build`) succeeds, so no stale `dist` masks type drift.
- The 5 new test files pass: 16 UATs, one-to-one with the 15 new ACs plus AC-711.
- Full suite: **658/659 pass**.
- No internal mocking. The Astro spy in `reconciliation-1c-astro-free-render.test.ts` only
  *observes* — never stubs — and its positive case (`toHaveBeenCalled` on a module page)
  proves the spy is wired to the real production path, making the negative cases meaningful.
- No source-inspection tests.
- AC-738 independently verified against the real binary: `1c help` and `1c list` from the
  repo root both exit 0 with clean stdout and empty stderr.

## Judgment Calls

- **AC-685/686/689/691 extensions accepted** despite their own UATs being unchanged: every
  extended claim is proven by a passing UAT on a newly-added sibling AC within the same
  story. AC-to-test attribution tightness is explicitly out of scope for this review
  (structural validation owns it); the behaviour is genuinely proven.
- **AC-709 and AC-705 rejected** on the same structural pattern, because for them **no**
  sibling AC carries the claim and their own UATs cannot distinguish the new behaviour from
  the superseded one. This is a behavioural evidence hole, not a bookkeeping one.
- **AC-706/707 noted but not load-bearing** — the core claim is proven; only the
  "real multi-region capture" qualifier is unexercised.

## Observation (outside this review's verdict)

`tests/req91-l1-pixel-mover-axes.test.ts:285`
(`test_UAT_FC_REQ-91_fold_gigabytealchemy_gradient_wordmark`) reads
`storage/references/gigabytealchemy.ai/index/multistate.json`, which is gitignored
(`.gitignore:146`, zero files tracked) with **no `existsSync` guard or skip**, so it fails
on every clean checkout. It was introduced by this bundle's free-coded commit `36e7a2ab9`.
The scoped quality gate filtered on `test_UAT_AC*` and deselected 605 tests, so this
`_FC_`-named test was never run — `REPORT-1039` reports "pass (54 tests, 0 failed)" while
it was broken. This is an FC test, not an AC UAT, so it does not affect the verdict, but the
gate's blindness to `_FC_` tests will keep letting this class through.

## Verdict

**FAIL**. Coverage gaps found. Two acceptance criteria on story-24098299 were broadened to
document BUG-9's region-aware recovery and REQ-92's non-text fidelity pairing, but neither
received evidence that distinguishes the new behaviour from the behaviour it replaced:

1. **AC-709** — `test_UAT_AC709` asserts `promoted` contains `'0'`, which the superseded
   single-level implementation also produced; the distinguishing assertions live only in the
   AC-less FC test `tests/bug9-region-aware-promote.test.ts`.
2. **AC-705** — the UAT is text-only; the image/box kind-keyed pairing and classifier-based
   exclusion of controls and empty runs are entirely unasserted.

The fix loop should author UATs under AC-709 and AC-705 as described in the Remediation
notes above. All other stories, ACs, and plan items pass.
