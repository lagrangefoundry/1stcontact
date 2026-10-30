---
uid: report-1a141faf
id: REPORT-4704
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T10:44:33.778095+00:00'
updated_at: '2026-09-21T10:44:33.778095+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Situation

Cherry-pick in progress: `855dd57a7c` — "feat(builder): the Library tab and the
drop-to-upload overlay [FREE-CODED]" (REQ-161), committed 2026-08-31T17:53:13-07:00.

Its parent `8420f4d3f4` is NOT an ancestor of HEAD, so git three-way-merged against
a stale base. The decisive fact: the same REQ-161 work already landed on this
lineage as `a6d1b6b7bd` (2026-09-11T03:00:07-07:00), which IS an ancestor of HEAD
(`git merge-base --is-ancestor a6d1b6b7bd HEAD` → true), and
`git diff a6d1b6b7bd 855dd57a7c` over every code file in the commit is EMPTY.

So the incoming side of each code-file conflict is byte-identical to a commit
already in HEAD's history; HEAD then moved past it (REQ-172, BUG-42, BUG-43,
REQ-156, and the `fix_reconciliation_review` workflow), adding +409 lines across
those four files.

## Files resolved

All six followed the per-file enrichment rule ("take the more recent commit by
timestamp"). Every OURS side is strictly newer than THEIRS (2026-08-31):

- `apps/control-app/src/builder/app.js` — UU, code (2c). Ours: `80c9342ac1`
  2026-09-14T03:15:55. Kept HEAD.
- `apps/control-app/src/builder/builder.css` — UU, code (2c). Ours: `270aa2aa50`
  2026-09-14T03:15:54. Kept HEAD.
- `apps/control-app/src/builder/library.js` — AA, both added (2b). Ours:
  `270aa2aa50` 2026-09-14T03:15:54. Incoming is a strict subset (identical to the
  ancestor blob), so HEAD is the superset. Kept HEAD.
- `apps/control-app/src/material.ts` — UU, code (2c). Ours: `270aa2aa50`
  2026-09-14T03:15:54. Kept HEAD.
- `package.json` — UU, config (2g). Ours: `80c9342ac1` 2026-09-14T03:15:55, version
  `0.2.40`. Incoming `0.2.25`. Kept HEAD. The generic 2g "scalar → incoming wins"
  is overridden here by the file's own enrichment rule (newer timestamp) and by the
  repo's standing convention — see `07afe0840d`, `464e489f65`, `097e308c68`,
  `01ac552b98` — that a claimed version is bumped past, never regressed. `0.2.25`
  is a stale bump from the divergent lineage; applying it would regress 15
  versions and collide with numbers already consumed by REQ-165, REQ-156 and BUG-43.
- `tests/reconciliation-builder-workspace-chrome.test.ts` — UU, reconcile-kind UAT.
  Ours: `9fcef096f8` 2026-09-11T02:58:29 (xgd-kind `reconcile`, intent
  `bundle-87be4669`, story `story-e674c60a`). Kept HEAD. See below.

Auto-merged cleanly, already staged, not touched here:
`tests/test_UAT_FC_REQ-161_library_tab.test.ts` (A),
`tests/test_UAT_FC_REQ-161_material_surface.workers.test.ts` (A),
`tests/test_UAT_FC_REQ-161_upload_overlay.test.ts` (A),
`tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` (M).

## Incoming changes preserved

No hunk was dropped under the BUG-1301 precedence exception. Every incoming change
is present in the resolved tree — not by exception, but because the incoming blobs
are ancestors of HEAD's blobs.

Spot-checks against the resolved working tree:

- `app.js` — `LIBRARY_TAB` imported from `config.js`; `createLibraryPanel` imported
  from `library.js`; `libraryTransport` option; `shell.getPanel(LIBRARY_TAB.id)
  .append(library.element)`.
- `library.js` — `webui/split` + `webui/list-detail` header comment;
  `mountFields` and `mountListDetail` imports; the two-`mountFields` detail pane
  (read-only rights block + editable description).
- `builder.css` — `.builder-library`, `.builder-library__filter`,
  `.builder-library__search`, `.builder-library__role`; the drop-overlay rules.
- `material.ts` — `role` present (15 occurrences); `readBlob(store, uid, blobKey)`
  with the DOC-38 §7.2 withdrawal documented in place ("gave that up deliberately —
  a shared blob cannot be moved to the trash…"), i.e. the sha256→uid blob-addressing
  fix from the incoming commit is live.
- `tests/reconciliation-builder-workspace-chrome.test.ts` — NO test function from
  either side is lost. Incoming renames/restates AC-959 and AC-976; HEAD renames and
  restates the SAME two ACs more thoroughly:
    - incoming `test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id`
      → HEAD `test_UAT_AC959_renders_one_panel_per_declared_tab_and_opens_the_first`
    - incoming `test_UAT_AC976_every_option_declared_for_a_tab_reaches_the_chrome`
      → HEAD `test_UAT_AC976_every_option_of_every_declared_tab_reaches_the_chrome`
  Every assertion the incoming side adds is present on HEAD: panel count taken
  against `TABS.length` rather than the literal `1`; the FIRST declared tab is the
  one that opens; `fill` asserted per DECLARING tab. HEAD additionally asserts
  `data-tab-id` in both directions, drives a three-tab generality mount through
  `mountShell`, and runs a two-tab `fill` mutation check. Strict superset.
- `package.json` — the only incoming content is the stale `0.2.25` scalar,
  deliberately not taken (rationale above). No functional change discarded.

## Net effect of this cherry-pick

The six conflicted files are byte-identical to HEAD. The commit's only surviving
contribution is the four test files that auto-merged: the three new
`test_UAT_FC_REQ-161_*` suites (the FC family; HEAD independently carries the
AC-anchored `reconciliation-library-tab` / `-upload-overlay` /
`-library-surface.workers` family, and both families coexist for REQ-163, REQ-172
and BUG-41), plus the REQ-163 ingestion suite restated for uid-addressed blobs —
which matches the uid addressing already live in HEAD's `material.ts`.

## Verification run in this worktree

- `tests/test_UAT_FC_REQ-161_library_tab.test.ts`,
  `tests/test_UAT_FC_REQ-161_upload_overlay.test.ts`,
  `tests/reconciliation-builder-workspace-chrome.test.ts` — 22 passed.
- `tests/reconciliation-library-tab.test.ts`,
  `tests/reconciliation-upload-overlay.test.ts`,
  `tests/reconciliation-builder-assistant-pane.test.ts` — 25 passed (baseline).
- NOT RUN: `tests/test_UAT_FC_REQ-161_material_surface.workers.test.ts` and
  `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts`. `@cloudflare/vitest-pool-workers`
  must bind 127.0.0.1 and the sandbox returns `EPERM: listen`, killing the node
  process. These two need a run outside the sandbox or in CI.
