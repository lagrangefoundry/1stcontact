---
uid: report-9d23c55b
id: REPORT-4425
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:35:23.509289+00:00'
updated_at: '2026-09-19T12:35:23.509289+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Context

The cherry-picked commit is `32366f9e2d` *Merge branch 'free-BUG-42' into xgd-working*
(author date Tue Sep 1 14:16:41 2026). **HEAD already contains the identical commit
under a different sha** — `58eca7022a`, same subject, same author date, byte-identical
`--stat` (7 files, +541/-11). The reconcile branch's remapped history then layered
`free-REQ-172` (`270aa2aa50`, the Library reader) and `free-BUG-43` (the `site_changed`
write watcher) on top of it, plus this bundle's own workflow steps.

So on every conflicted file the incoming side is the OLDER copy of code HEAD already
carries, and HEAD is a strict superset. Every conflict hunk was HEAD-adds-vs-incoming-
adds-nothing; there were no mutually-exclusive edits and no hunk where the incoming
side contributed a line HEAD lacks.

## Files resolved

- `apps/control-app/src/builder/app.js` — UU, code file (2c.2, non-overlapping).
  One hunk: HEAD adds `getModalHost: () => shell.element` (REQ-172) to the
  `createLibraryPanel` call; incoming side empty. Kept HEAD. BUG-42's own
  contributions to this file (`markdownReady` option + default import, the
  `Promise.all([openSession(slug), markdownReady])` in `showSite`, the
  `await markdownReady` on the failure path) merged clean and are all present.
- `apps/control-app/src/builder/chat.js` — UU, code file (2c.2/2c.3a).
  Two hunks: (1) HEAD adds `SITE_CHANGED` + `watchForWrites` (BUG-43), incoming
  side empty; (2) HEAD's options destructure is a superset of incoming's
  (`onSiteChanged` added). Kept HEAD on both. BUG-42's changes here — dropping
  `loadMarked`/`loadSanitizer` from the import and from `createChatPanel`, the
  side-effect `import './markdown.js'`, and the header paragraph explaining why
  the wait lives in `app.js` — all merged clean and are present.
- `apps/control-app/src/builder/library.js` — UU, code file (2c.2, non-overlapping).
  Four hunks, all HEAD-only REQ-172 additions with an empty incoming side:
  the `./reader.js` import, the `getModalHost` jsdoc, the `getModalHost` default,
  and `shown.destroy()` in the detail's teardown. Kept HEAD. BUG-42's changes —
  the `DESCRIPTION_FIELD` constant, `paintDescription`, the `markdownEngineReady`/
  `markdownReady`/`renderSafe` imports, the `markdownReady` option, and the
  `MutationObserver` + `markdownReady.then(...)` repaint block — merged clean and
  are all present.
- `apps/control-app/src/builder/markdown.js` — AA, code file (2b, one side a
  superset). Both sides are BUG-42's new module; HEAD's copy is incoming's copy
  verbatim plus a `setParser`/`setSanitizer` re-export block (added by REQ-172 so
  suites can inject the engines without writing the component scope in a test
  file). Kept the superset. `git diff <incoming> HEAD -- markdown.js` removes
  nothing — +16 lines, 0 deletions.
- `package.json` — UU, scalar version conflict. HEAD `0.2.40` vs incoming `0.2.36`.
  Kept HEAD. The incoming bump is free-coded bookkeeping already superseded on the
  branch; taking it would be a version downgrade, not developer code intent.
- `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` — not a conflict class; the
  cherry-pick re-added it as `A `. Dropped under the BUG-1301 PRECEDENCE exception
  (`git rm -f`). Detail below.

## Incoming changes preserved

Verified by `git diff 32366f9e2d HEAD -- apps/control-app/src/builder/ package.json`.
HEAD adds 505 lines relative to the incoming commit and removes only 9, every one of
which is a line a LATER integrated commit deliberately replaced:

- `chat.js`: the plain destructure line and `sendPrompt: (text) => transport.streamPrompt(...)`
  — both rewritten by BUG-43 (`watchForWrites` wraps the stream, `onSiteChanged`
  joins the destructure).
- `library.js`: `view.append(preview(row))`, `return wrap`, and three lines of the
  old `preview` docstring — all rewritten by REQ-172, which made `preview` return
  `{element, destroy}` so the reader can be torn down with the detail.
- `package.json`: the `0.2.36` version line, superseded by `0.2.40`.

`app.js` and `markdown.js` have zero deletions relative to incoming. No BUG-42 hunk
is absent from the resolved tree.

### BUG-1301 precedence: `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`

**HEAD-side commit that removed it**: `6f83befde4` *Workflow fix_reconciliation_review
completed: done* (Mon Sep 14 02:28:35 2026), carrying `xgd-intent: bundle-8e1807f6` —
**this same reconcile bundle**. It deleted two FC UAT files in one commit
(`test_UAT_FC_BUG-42_markdown_rendering.test.ts` and
`test_UAT_FC_REQ-160_two_kb_session.workers.test.ts`), i.e. a systematic FC→AC UAT
consolidation, not incidental churn.

**Why that removal is a legitimate refactor rather than a resolution shortcut**: the
bundle's own UAT generation had already rewritten the same behaviours onto AC-anchored
suites, and every one of the six deleted test functions has a live counterpart on HEAD:

| deleted FC test | replacement on HEAD |
| --- | --- |
| `..._a_transcript_is_not_painted_until_the_markdown_engines_have_settled` | `reconciliation-builder-markdown-readiness.test.ts:252` `test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose` |
| `..._a_session_that_cannot_be_opened_reports_itself_as_rendered_markdown` | same AC-1063 test, the `unopened` section (lines 299–314, asserts the `'The assistant could not be reached'` note renders as markdown) |
| `..._the_material_description_is_shown_rendered_rather_than_as_its_source` | `reconciliation-library-reader.test.ts:525` `test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run` (line 540, `descriptionCell`) |
| `..._the_description_still_edits_and_commits_through_the_component` | `reconciliation-library-reader.test.ts:597` AC-1815 (lines 637–640: same cell identity, `fields-value-editable`, the component's own textarea) |
| `..._a_description_opened_during_a_cold_load_is_repainted_when_the_engines_land` | same AC-1815 test (lines 610–636, cold pane upgrades itself) |
| `..._a_description_nothing_has_written_keeps_the_components_placeholder` | same AC-1815 test (lines 662–666, `fields-value-empty`) |

`reconciliation-builder-markdown-readiness.test.ts` states this explicitly in its own
header ("What BUNDLE-27 added is a rule about WHEN a surface may paint — AC-1816's
shared, never-failing readiness and the ordering AC-1063 now states"). No assertion is
lost; re-adding the FC file would resurrect a duplicate suite that this bundle's own
earlier step removed, and would re-create an FC orphan.

## Net result

The staged tree is byte-identical to HEAD (`git status --porcelain` is empty), because
the cherry-picked commit's effect is already present via `58eca7022a`. Per STEP 4 this
is the redundant-commit case, not a discard — STEP 3's check above confirms BUG-42's
key changes are present in HEAD rather than merely absent. No `--skip` was issued;
`CHERRY_PICK_HEAD` is intact at `32366f9e2d` for `cherry_pick_finalize_resolution`.
