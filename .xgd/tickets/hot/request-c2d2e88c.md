---
uid: request-c2d2e88c
id: REQ-453
type: request
title: Delete unused chat tools (check_fidelity, group_l1, flow_l1, share_section,
  solve, relate, rename_palette_color) without touching site reproduction
created_by: EPIC-19
created_at: '2026-10-24T21:09:52.264077+00:00'
updated_at: '2026-10-24T22:10:06.471357+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-0923bb64
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1d16fa36
  commits:
  - working_sha: 3f1ca909e811ec6577f23742356e4d2ae8e8f6d1
    reconcile_sha: null
    main_sha: null
  - working_sha: 695f238bf780c14a6e6be9807e7d27dc4e1921c3
    reconcile_sha: null
    main_sha: null
  version: 0.2.623
---

## Why

DOC-68's builder review (EPIC-20) found chat tools that no model has called in
329 builder sessions and 33 consultant sessions (dev store, since 8 September),
or has called only once or twice, last in September. The operator: "if they are
removed from the instructions they will never be used and just become code debt",
so they are **deleted**, not merely hidden.

The operator's constraint: **the deletions must not affect site reproduction**
(capture → fold → `1c gate` / l1-gate, the repro console, the REQ-82 round trip).
DOC-68's "Reproduction safety" section (added 2026-10-24) checked this:
reproduction never goes through chat tools. The repro console runs `1c` steps as
processes, and its AI rounds are `claude -p` sessions with Bash and file reads.
That holds provided the code listed below is kept.

Deleting tools that no model uses changes nothing a model sees in practice, so
this does **not** wait for REQ-452's replay test. Taking tools off the builder's
list (`capture_site`, `list_references`, `describe_reference`, `KnowledgeChanges`)
does change what a model sees, so it is **not** in this ticket. It belongs with
DOC-68's prompt trims and is gated by REQ-452.

## What changes

Delete each chat tool: its surface declaration, group entry, handler, manual and
priming text, and its entries in `talker.json` (the withhold list) and
`slow-tools.json`. Keep the code that something else uses:

| Chat tool deleted | Underlying code | Keep because |
|---|---|---|
| `check_fidelity` | handler only (`fidelity-core.ts` ~695) | **Keep all of `gate-core.ts` and `gate.ts`** (`cmdL1Gate`, `reconcileGates`, `referenceCoverage`, `diffManifests`): `1c gate`, the repro console's gate step and the l1-gate tests call them directly. |
| `group_l1` | handler only (`toolbox-core.ts` ~641) | **Keep `l1/rebase.ts`**: the fold imports it (`l1/fold.ts:84`). Keep `editL1Group` for `1c structure group`. |
| `flow_l1` | handler, plus the host page measurer passed only for it (`host-core.ts` ~2960) | Keep `editL1Flow` for `1c structure flow`. |
| `share_section` | handler and `editShareSection` (no other caller) | Nothing. Edit `priming.json` (~750, ~1517). Note in BUG-260 that this path no longer needs fixing. |
| `solve` | handler and `solveTranslation` (no other caller) | Nothing. |
| `relate` | handler only | **Keep `relateAnchors`**: `evaluateRelations` uses it beside `measure_drawing`, which stays. |
| `rename_palette_color` | handler only | **Keep `editPaletteRename`**: the control app's palette route (`router.ts` ~6674), the `1c` CLI and the site-store contract tests use it. Renaming moves to the principal's `set_design` (REQ-448). |

`rename_text_style` and `remove_text_style` are removed by **REQ-447**, which
replaces `textStyles` with `site.design`. If REQ-447 lands without removing them,
delete them here on the same terms (keep `editTextStyleRename` / `editTextStyleRm`
for the `1c` CLI).

**Text that points at deleted tools is rewritten, so no model is pointed at a tool
that no longer exists:**
- the "Reproduce a site you were shown" sequence in `fidelity-surface.json`
  (~318–327: `capture_site` → `describe_reference` → `screenshot` →
  `check_fidelity`) is rewritten without `check_fidelity`, or removed;
- `draw_image`'s description (which names `relate` / `solve`) keeps only
  `measure_drawing`;
- the stale code comments that cite `check_fidelity` (`gate-core.ts`, `gate.ts`,
  `repro-console/src/iteration.ts`, `repro-console/brief/DIAGNOSE-THE-GAP.md`)
  are updated.

## Test plan

**Reproduction is unaffected (acceptance):**
- `1c gate` and the repro console's gate step produce **identical reports** on a
  committed capture before and after the deletions;
- the REQ-82 round-trip and l1-gate suites pass unchanged;
- the diff does not touch `l1/rebase.ts`, `gate-core.ts` or `gate.ts` (a test or
  review check).

**The tools are gone:**
- `tests/test_UAT_FC_REQ-453_unused_tools_deleted.*`:
  - none of the deleted names is declared on any surface, granted to any role,
    listed in `talker.json` or `slow-tools.json`, or named in `priming.json` or
    any surface description;
  - every tool still declared is in exactly one of `talker.json`'s lists (its
    existing UAT).

**Callers that stay still work:** the `1c structure group|flow`, `1c palette
rename` and text-style CLI tests, the palette route, and the site-store contract
tests.

**Retire or update the tests that pin the deleted tools:**
- the REQ-157 test that pins `check_fidelity` and `1c gate` sharing reconciliation
  (`test_UAT_FC_REQ-157_fidelity_surface.test.ts` ~795–900);
- the REQ-350 `group_l1` / `flow_l1` tool tests;
- the REQ-422 `share_section` test;
- the tool-list pins in the REQ-126, REQ-157, REQ-206, REQ-216, REQ-295 and
  REQ-386 suites, and in the assistant-control-surface and palette reconciliation
  suites.
## What landed

All seven tools are deleted: `check_fidelity` (fidelity surface), and `group_l1`,
`flow_l1`, `share_section`, `rename_palette_color`, `relate`, `solve` (L1 surface).
That covers declarations, group entries, handlers, `talker.json`, `slow-tools.json`,
and every bit of priming or description text that named them.
`surface_version` goes up on the fidelity (9→10), L1 and library surfaces.

- **Code deleted:** the handlers; `editShareSection`; `solveTranslation` (with its
  `MOVES` table and `SolveRequest`/`SolveResult` types); `check_fidelity`'s
  `manifestOf`; the `pageMeasurer` parameter in `l1Operations` /
  `l1ToolboxClass` / `l1SurfaceSet` / `createL1Toolbox` and the three
  `browserPageMeasurer` call sites in `host-core.ts`. `browserPageMeasurer` itself
  stays, because `1c structure flow` uses it.
- **Code kept, unchanged:** `gate-core.ts` and `gate.ts` (comments only), `l1/rebase.ts`
  and `l1/fold.ts` (byte-identical), `editL1Group`, `editL1Flow`,
  `editPaletteRename`, `relateAnchors` (`evaluateRelations` uses it for a drawing's
  recorded relations).
- **Model-facing text rewritten (no model is pointed at a missing tool):**
  - fidelity overview: the "Three ways of judging" paragraph is removed.
  - `compare`: no longer refers you on to `check_fidelity`.
  - "Reproduce a site you were shown": now ends `capture_site` → `describe_reference`
    → `screenshot` → `compare`.
  - The "value gates" absence now says the reproduction gates are not run from here.
  - `measure_drawing` / `MeasureDrawings`: no longer send you to `relate` / `solve`.
    `measure_drawing` names the recorded-relation comment syntax inline, because
    the `anchor_ref` / `relation` param types and the `relation_result` / `solution`
    shapes went with the tools.
  - `ManagePalette`: no longer says "rename".
  - `draw_image`: names only `measure_drawing`.
  - The consultant priming (both copies): a page that already has its own header
    section is now handled by "on their yes, build the shared header from it and
    remove that section from the page" instead of `share_section`.
- **Stale comments updated:** `gate-core.ts`, `gate.ts`, `repro-console/src/iteration.ts`,
  `DIAGNOSE-THE-GAP.md`, `picture.ts`, `cli/index.ts`, `measure-core.ts`,
  `toolbox-core.ts`. Reproduction files `l1/fold.ts`, `l1/probes.ts` and
  `l1/rebase.ts` still mention `group_l1` / `flow_l1` in comments. They were left
  byte-identical on purpose, so the reproduction path has no diff at all.
- **Text-style tools:** REQ-447 is still at `free_coding` (it has not landed), so
  `rename_text_style` / `remove_text_style` are left for it, as this ticket says.

## Reproduction safety: how it was verified

- **By construction:** the relative-import closure of `cli/gate.ts`,
  `cli/gate-core.ts`, `cli/repro.ts`, `l1/fold.ts` and `repro-console/src/iteration.ts`
  reaches none of the six files whose code changed, and no module under `cli/ai/` at
  all. So `1c gate` and the repro console's gate step cannot produce a different
  report. The UAT pins this as a durable check (the import-closure test below).
- **Regression run:** every node test file that imports the AI layer, the gate, the
  fold, `cli/edit` or the repro console (219 files), plus every workers file that
  imports the AI layer (129 files), was run on the branch. The failing files were
  then baselined on clean `xgd-working`. The failure sets are identical: 61 node and
  11 workers failures on both sides, from the known `logDir` / delegation /
  priming families. No new failures.

## Tests (final)

- New: `tests/test_UAT_FC_REQ-453_unused_tools_deleted.test.ts`
  - `no_deleted_tool_is_declared_listed_or_named_anywhere_a_model_reads`: scans every
    JSON under `cli/ai/` (surfaces, `instances.json`, `talker.json`,
    `slow-tools.json`, `priming.json`). It looks for each deleted name as a key, a
    list entry or a backticked mention, and checks that no operation, group or
    sequence names it.
  - `a_real_toolbox_offers_none_of_them_and_its_manual_names_none`: composes the
    consultant's toolbox with the fidelity surface. Asserts none of the seven is
    offered or named in the manual, and that the kept neighbours are still offered.
  - `reproduction_reaches_no_chat_tool_code`: the import-closure check above.
  - `the_code_the_cli_and_the_fold_use_is_kept`: `cmdL1Gate`, `reconcileGates`,
    `referenceCoverage`, `diffManifests`, `rebaseInto`, `editL1Group`, `editL1Flow`,
    `editPaletteRename` and `relateAnchors` are still exported. `editShareSection`
    and `solveTranslation` are not.
- REQ-350 group suite: now drives `1c structure group` (CLI), including the refusals.
- REQ-350 flow suite: drives `editL1Flow`, the function `1c structure flow` calls,
  with the evaluator stand-in. Grouping goes through the CLI. The Chromium leg runs
  `1c structure flow` itself.
- REQ-209: the `relate` / `solve` cases are replaced by recorded-relation cases on
  `measure_drawing`: a met relation holds, a mixed-axis relation is reported with
  why, and an unknown node is reported with what is there.
- REQ-157: the `check_fidelity` end-to-end case is retired. The five-verdict
  `reconcileGates` case stays, now described as `1c gate`'s. Tool lists updated.
- REQ-422: the `share_section` case is retired.
- Palette reconciliation: the assistant's grant is the read plus three writes, and
  AC1239's test slug says "three_writes". Renaming is exercised through
  `1c palette rename`, including the collision refusal.
- Tool-list pins updated in REQ-126, REQ-206, REQ-216, REQ-295, REQ-386 and the
  assistant control-surface and conversation suites.


## Merge-back note (REQ-447 overlap)

REQ-447 landed on `xgd-working` while this work was in progress. It retired the
text-style ops (`set/add/remove/rename_text_style`, `get_text_styles`) and added
`get_design`. The merge kept both sets of deletions. For `l1-surface.json`, this
ticket's deletions and text edits were re-applied on top of REQ-447's version,
and `surface_version` went 22 → 23. The resolution lives in merge commit
`eb3a3fb24096ff1cbbeca4b426756f45146df3a7`. On the merged tree, the REQ-453,
REQ-447, REQ-126, REQ-157, REQ-350 (both), REQ-209, REQ-422, palette,
control-surface, REQ-216 and req88 repro suites all pass, and the
REQ-386/REQ-206 workers suites pass. The REQ-416 priming failure is the one
already seen on clean working.