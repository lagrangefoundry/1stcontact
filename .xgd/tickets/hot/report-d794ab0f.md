---
uid: report-d794ab0f
id: REPORT-11513
type: report
title: 'Fix reconciliation review: bundle-0d00566a'
created_by: xgd
created_at: '2026-11-08T16:24:46.379554+00:00'
updated_at: '2026-11-08T16:24:46.379554+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-0d00566a
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-44d0a572 (STORY-174):
  - In scope now mentions the mark's hover tooltip.
  - New Reconciliation Decision, "Coordinates on hover lives on the mark, not the pill" (G2). A literal-text pill cannot carry a hover: `webui-chat` has no atom-node seam, the same root cause as BUG-72 §3. Reused-letter disambiguation is guaranteed by AC-2417 (deleting a point removes its pills) and AC-2424 (points clear on send). The mark's tooltip carries the formatted expansion.
  - The Technical Context UAT list now names the reconciliation test files.
- acceptance_criterion-20259354 (AC-2418): new clause. A mark inside a drawing carries the point's full formatted expansion as its `title`, set once the drawing resolves and re-derived after a drag. A mark on an L1 node has none. The Verification section is updated to match (G2).
- acceptance_criterion-8afae6f6 (AC-2421): the Criterion is unchanged. The Verification section now describes behavioural evidence for "same definitions, not a copy" (G1).

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes (tests only; no production code)
- tests/reconciliation-marked-points-served-modules.test.ts (new, G1):
  - `test_UAT_AC2421_the_builder_entry_loads_the_served_anchor_and_measure_modules_and_they_answer_as_the_source` drives `1c assets` via `run(['assets'])`. It walks the emitted graph from /builder/main.js and asserts that /framework/site-schema-anchors.js, /framework/measure-svg.js and /builder/points.js are reached, and that main.js imports both modules. It then imports the emitted modules and asserts that ANCHOR_NAMES and nearestAnchors match the source modules on fixture points, and that `measureScript(svg)` is byte-identical.
  - `test_UAT_AC2421_in_a_browser_the_default_measure_path_gives_near_equal_to_measure_drawing_and_nearest_anchors` is browser-gated with `ctx.skip` and prints the reason when skipped. It runs the emitted points.js over a real edit render, with the api built from the emitted /framework modules by URL and no `measure` injected. It asserts that `near:` equals `measure_drawing`'s measurement (`measureScript(svg)` evaluated in a page) fed through the source nearestAnchors, and that the mark's title equals `formatMarkedPoint(point)` including `near:`.
- tests/reconciliation-marked-points.test.ts:
  - Removed the readFileSync/toContain source-text assertion from the AC-2421 UAT (G1).
  - The AC-2418 UAT now asserts that the mark has no title on an L1 node, and that after the drag into the drawing its title equals `formatMarkedPoint` of the re-resolved point, with svg user space (50, 20) and node-relative coordinates (G2).

## Confidence
Moderate to high. Both gaps were addressed as the remediation asked, and AC-2421 is not weakened.
- The tests were not run in this call, as instructed.
- The browser case cannot run in sandboxed sessions. It skips visibly there and is verified by the gate or the operator.
- No lint script or root tsconfig is available for typechecking the tests.
- Risk: the browser case's exact delta equality (toBeCloseTo, 6 places) assumes the builder-document measurement and the blank-page measurement agree. Both host the drawing under `all: initial` in a shadow root, so they should.
