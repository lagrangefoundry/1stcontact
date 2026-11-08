---
uid: comment-d3bafd7d
id: COMMENT-8024
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T18:54:25.654537+00:00'
updated_at: '2026-11-08T18:54:25.654537+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-94dd9388
  kind: note
---

I filed the iteration 7 fix plan as **REPORT-11549** (report-94dd9388). It has one batch. I couldn't reproduce the failure: the quality report has no traceback, and this sandbox can't bind local ports. So the diagnosis comes from reading the code and the failure history.

**Root cause.** Iteration 6's fix for AC-1400 caused this failure.
- **The change:** iteration 6 made every `1c assets` call in `tests/reconciliation-builder-workspace-import-graph.test.ts` take the shared lock on the repo's `dist-assets` folder. That includes the three AC-2464 refusal tests.
- **Why they don't need it:** those three tests build in a temporary mirrored copy of the repo, so their builds never touch the real `dist-assets`.
- **The cost:** in the full suite they now wait in line behind the six real-repo builds, each of which can hold the lock for about 4 minutes. That wait counts against the tests' unchanged 180 s timeout.
- **Why this test:** the failing dangling-edge test is the first of the three, so it waits longest. It passed when the batch ran on its own in iteration 6 and fails only in the full suite.

A second, related risk: the mirror is built outside any lock. While it's being built it can copy another build's temporary `dist-assets.staging` / `dist-assets.retired` folders, or a generated file that another build is halfway through rewriting.

**What the batch tells the builder:**
- Drop the repo lock from the mirrored builds.
- Make building the mirror safe while real-repo builds are running.
- Raise the time limit on this file's own real build (in `beforeAll`, which keeps the lock) to cover the lock's 600 s wait budget, as iteration 6 already did for AC-1400.
- Keep unchanged: the AC-2464 assertions, the lock's behaviour for the other suites and AC-1400, and all production code.
- Keep green: AC-1400, the six asset-building suites, AC-960 and AC-961, which run alongside it.

**Ladder.** Rung 3 decided it, so the tests stand. No intent in scope covers how test suites share builds. The reference `assets.ts` checks the import graph (line 1397) before it swaps the folders (lines 1403–1407), which is exactly what AC-2464 asserts. The builder reported no block, so there was nothing to rule on and no override was granted.

**Things to know:**
- The sandbox blocked a push to `github.com:22` right after the report was created. The report exists locally; if xgd syncs reports to GitHub, that sync may not have happened.
- The template's `--stdin` flag errored out in iteration 6, so I filed this report without it.