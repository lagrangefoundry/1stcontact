---
uid: comment-33e58752
id: COMMENT-8017
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-08T17:33:58.410220+00:00'
updated_at: '2026-11-08T17:33:58.410220+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-90cb4ed2
  kind: note
---

I've added tests to close gap G1 on AC-2464. None of them have been run yet: the workflow runs the full suite next, and you told me not to run tests. The only check I could do was a TypeScript compile of the test file, which is clean. ESLint didn't run because the sandbox blocks the npm registry. The change is uncommitted in the working tree for the workflow to pick up.

**What changed** (all in `tests/reconciliation-builder-workspace-import-graph.test.ts`, no production code):

The three refusal tests run the real `1c assets` against a temporary copy of the repo. The copy is mostly symlinks to the repo, but it has its own `dist-assets`, generated output folder and `module-assets.ts`, so a test build can't write into the real repo. Before each build, its `dist-assets` is filled with a known "previous" tree and snapshotted.

1. **A dangling import fails the build before the swap.** `builder/main.js` gets an import of a file that is never built. The test checks four things:
   - the build fails with an `ENVIRONMENT` error naming that import;
   - the staging folder holds the whole new tree, broken import included;
   - the served `dist-assets` is byte-for-byte the previous snapshot;
   - no `.retired` folder was created.

   If the code swapped the new tree in before checking it, this test would fail. That was the reviewer's central objection.
2. **An import that points to no file** (added to `shade.ts`) fails the build with the exact error naming the importing file and the import, and the served tree is untouched.
3. **An import that points to a real file outside the repo** fails the same way, with the "lies outside the repository" message.
4. **Type-only and comment-quoted imports** are checked against the normal build output. `edit.ts`'s type-only `./palette` and `./types` produce no file and no reference anywhere in the output. The doc comment in `edit.ts` that quotes `from './palette'` appears unchanged in `site-schema-edit.js`.

AC-2464's wording stays as it is, because every claim the review called unproven is now asserted. No stories or ACs changed, and there was no FC-orphan report for this bundle.

I filed the completion report as REPORT-11530 (`report-90cb4ed2`) with `needs_more_work=false` and `progress_made=true`. It was created locally, but the sandbox blocked a connection to `github.com:22` when it was filed, so it may not have synced to the remote.