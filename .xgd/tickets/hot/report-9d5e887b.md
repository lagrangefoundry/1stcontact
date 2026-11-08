---
uid: report-9d5e887b
id: REPORT-11522
type: report
title: 'Report: fix_plan for report-49607926'
created_by: xgd
created_at: '2026-11-08T16:57:42.515677+00:00'
updated_at: '2026-11-08T16:57:42.515677+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-49607926
  fix_iteration: 4
  items:
  - index: 0
    tests:
    - tests/reconciliation-marked-points.test.ts::story-44d0a572 — Marked Points on
      the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends
    - tests/reconciliation-builder-workspace-chrome.test.ts::story-e674c60a naming
      test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site
    - tests/reconciliation-builder-workspace-origin.test.ts::story-e674c60a builder
      origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo
    dependency_tests:
    - test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable
    - test_UAT_FC_BUG-71_
    - test_UAT_FC_REQ-210_
    - test_UAT_FC_BUG-72_
    hypothesis: AC-2418's hover-title block reads controller.list() after controller.expand()
      has marked every point sent (list returns live points only); AC-960/AC-961's
      source walkers exclude dist-assets but not the dist-assets.staging/dist-assets.retired
      siblings that parallel `1c assets` runs (served-modules, BUG-71, import-graph
      suites) fill with copies of builder/config.js and the webui components.
    instructions: 'All three are test defects; the product code matches its intents.
      (1) tests/reconciliation-marked-points.test.ts AC-2418: the hover-title block
      added in fc268d3051 (`const [moved] = controller.list()` and the three `title`
      assertions, currently after `controller.expand(box.get())` at ~line 549) runs
      after expand() has set mark.sent on every live mark, and controller.list() returns
      only unsent marks (points.js live()/list), so `moved` is undefined. Move that
      block to just before the expand() call, so it observes the dragged, enriched,
      still-live point; keep the expansion assertions and the final ''a sent mark
      cannot be dragged'' step after expand() as they are. (2) The walk() helpers
      in tests/reconciliation-builder-workspace-chrome.test.ts (~line 518, used by
      AC-960) and tests/reconciliation-builder-workspace-origin.test.ts (~line 1144,
      used by AC-961) skip only the exact name `dist-assets`. tools/generate/src/cli/assets.ts
      builds into `dist-assets.staging` and parks the old tree in `dist-assets.retired`
      during the swap (BUG-71''s stage-then-swap design), and five suites run `run([''assets''])`
      against the real repo in parallel workers, the newest being reconciliation-marked-points-served-modules.test.ts.
      While one is mid-build, the staging tree holds builder/config.js (a second SITE_TAB
      label literal → AC-960) and webui/webui-shell (a mountShell definition → AC-961).
      Make both walkers treat the build output and its transient siblings as build
      output (e.g. skip any directory whose name is `dist-assets` or starts with `dist-assets.`),
      and extend the existing BUILD OUTPUT comment to say why. Do not narrow what
      source is scanned and do not touch production code. Verify AC-960/AC-961 together
      with the asset-building suites in the same run, not only in isolation.'
    ladder:
      rung1: 'Decides: REQ-210 says points clear on send, so a sent point correctly
        leaves controller.list() and the AC-2418 test''s ordering is wrong; BUG-71
        requires building into a staging tree and swapping, so the siblings are intended
        and the walkers that read them as source are wrong.'
      rung2: 'Agrees: at reconcile-src-BUNDLE-41, points.js:178 (live excludes sent),
        :558 (expand sets sent), :566 (list = live); assets.ts:1353-1355 (dist-assets.staging)
        and :1403-1407 (dist-assets.retired swap).'
      rung3: The tests' assertions stand unchanged; only the AC-2418 statement order
        and the walkers' build-output exclusion change, and no production code changes.
    test_scope: test_UAT_AC2418_ or test_UAT_AC960_ or test_UAT_AC961_ or test_UAT_AC977_
      or test_UAT_FC_BUG-71_ or test_UAT_FC_REQ-210_ or test_UAT_FC_BUG-72_
---

# Fix Plan — Iteration 4

## Hypothesis
Two separate test defects, no product defect. (1) AC-2418's hover-title block, added by `fc268d3051`, reads `controller.list()` after `controller.expand()` has marked every point sent, so `list()` (live points only) is empty. (2) The AC-960 and AC-961 source-tree walkers skip `dist-assets` but not the build's own transient siblings `dist-assets.staging` and `dist-assets.retired`. Any suite running `1c assets` in a parallel worker fills those siblings with copies of `builder/config.js` and the webui components.

## Analysis
The 5 reported failures are 3 tests. The two orphan ACs (AC-2418, AC-961) are orphaned only because their single tests fail. Earlier iterations (1–3) dealt with the REQ-211 flow tests, which are now green. These three failures first appeared in REPORT-11521 at `7b55c333`, and every hypothesis below is new (count 1). No `blocked_by` report is open for this batch, and no builder was stuck on these tests.

**AC-2418** (`tests/reconciliation-marked-points.test.ts:523`): reproduced in this session.
- Error: `TypeError: Cannot read properties of undefined (reading 'drawing')` at `formatMarkedPoint`, reached from test line 559.
- Line 549 calls `controller.expand(...)`, which sets `mark.sent = true` on every live mark (ref `points.js:558`).
- Line 557 then does `const [moved] = controller.list()`, and `list` is `live().map(...)` with `live = marks.filter(m => !m.sent)` (ref `points.js:178,566`). So `moved` is undefined.
- The code is what REQ-210 asks for ("Points clear on send"). The test's ordering is wrong: the hover-title assertions belong to the not-yet-sent point.
- The test's final step ("a sent mark cannot be dragged") does need the `expand()`. The fix is ordering only.

**AC-960 and AC-961**: cross-suite contamination.
- AC-960 passes when run alone in this session. AC-961's `beforeAll` cannot run here because the sandbox refuses local `listen`, which is unrelated to the CI failure.
- Both tests walk `apps/`, `packages/` and `tools/` looking for a second definition site:
  - AC-960 looks for the `SITE_TAB` label literal (`reconciliation-builder-workspace-chrome.test.ts:263-279`, walker at `:518-531`).
  - AC-961 looks for `function mountShell|mountSplit|mountFields(` (`reconciliation-builder-workspace-origin.test.ts:615-634`, walker at `:1144-1157`).
- Both walkers skip only the exact name `dist-assets`.
- BUG-71's design builds into `apps/control-app/dist-assets.staging`, then renames the old tree to `dist-assets.retired` before swapping (ref `assets.ts:1353-1355,1403-1407`). The staging tree holds `builder/config.js` (the label literal) and `webui/webui-shell/...` (the `mountShell` definition).
- The polluters are the suites that run `run(['assets'])` against the real repo:
  - `reconciliation-marked-points-served-modules.test.ts`, newly added in `fc268d3051`, the same commit after which these failures appeared
  - `test_UAT_FC_BUG-71_framework_import_graph.test.ts`
  - `reconciliation-builder-workspace-import-graph.test.ts`
  - `reconciliation-platform-asset-tree-swap.test.ts`
  - `reconciliation-1c-launcher-bootstrap.test.ts`
- The polluters are behaving correctly: BUG-71 requires the stage-then-swap design. The walkers are what's wrong, because they treat build output as source. Their own comment already gives the reason for excluding `dist-assets` ("it is BUILD OUTPUT"), and that reason applies just as much to its staging and retired siblings.

There are no conflicting requirements across the ACs. One batch, because all three are test-only edits made in the same window and share the polluter context.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-builder-workspace-origin.test.ts::test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` — inter-test-dependency — it reads the live `apps/control-app/dist-assets` directory, which disappears for a moment between the two renames whenever a parallel suite runs `1c assets`. It should read a tree it controls, or tolerate the swap.
- `tests/reconciliation-builder-workspace-origin.test.ts` (the `assets binding` helper near :833) — inter-test-dependency — it serves the real `dist-assets` off disk while other workers rewrite it. Same remedy.
- `tests/reconciliation-marked-points-served-modules.test.ts`, `tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts`, `tests/reconciliation-builder-workspace-import-graph.test.ts` — inter-test-dependency — each runs `1c assets` into the shared repo `dist-assets` from a parallel worker. Two concurrent builds share one `dist-assets.staging` path (each `rmSync`s the other's staging). These suites should build once (shared setup) or run sequentially.

## Batches
**Batch 0: all three tests, test-only edits.**
- AC-2418: move the hover-title assertions (the `controller.list()` capture and the `title` checks) to before the `controller.expand()` call. Keep the expansion assertions and the sent-mark-cannot-be-dragged step after it, unchanged.
- AC-960 and AC-961: make both source walkers skip the `dist-assets` build output together with its transient siblings (`dist-assets.staging`, `dist-assets.retired`), and update the adjacent comment to say why.
- No production file changes. No assertion is weakened: the walkers keep scanning every source file they scanned before.

## Resolution ladder (REQ-938)
**Batch 0 is decided at rung 1.**
- REQ-210 ("Points clear on send") makes a sent point leave the live list, so the AC-2418 test's ordering is what's wrong.
- BUG-71 ("Checking before the swap is what makes strictness safe") requires the staging and retired siblings, so the walkers that mistake them for source are what's wrong.
- Rung 2 agrees: ref `points.js:178,558,566` and `assets.ts:1353-1355,1403-1407`.
- The tests' assertions stand; only their ordering and their build-output exclusion change.
