---
uid: comment-a065d41a
id: COMMENT-8020
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T18:00:25.416181+00:00'
updated_at: '2026-11-08T18:00:25.416181+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b0262d00
  kind: note
---

I filed the iteration 6 fix plan as **REPORT-11538** (report-b0262d00). It has one batch. I couldn't run the failing test myself, so the diagnosis comes from reading the code, not from a reproduction.

**Root cause.** Both reported failures come from one test, AC-1400's (`tests/reconciliation-workspace-build-artifacts.test.ts`). AC-1400 shows as orphaned only because that test fails. It's a clash between test suites, not a product bug:
- Six other suites run `1c assets`, which rebuilds the one shared `apps/control-app/dist-assets` folder.
- The rebuild moves the old folder out and the new one in, and every run uses the same `.staging` folder. For a moment the tree is missing, or another build is still filling it.
- The AC-1400 test reads that tree for up to 120 seconds (every component, stylesheet, `main.js` and three framework bridges). Any read that lands in the gap fails.
- The previous builder report (REPORT-11524) saw the same clash: `ENOTEMPTY` errors when two builds ran at once.

**What I ruled out.** The build isn't stale: the built `main.js` is currently byte-identical to its source. This is the first time AC-1400 has failed under this subject, so the anti-repetition rule doesn't apply yet.

**The batch.**
- **Fix:** test infrastructure only. Every suite that starts an asset build holds one cross-process lock for the whole build, and the AC-1400 test holds the same lock while it reads.
- **Reuse:** the builder should lift the existing lock in `tests/support/local-d1.ts:104-128` into a shared helper rather than write a second one. It needs an async version, and its 120-second "stale lock" timeout must be raised: AC-1400 can hold the lock about that long, so another suite could break it while it's still in use.
- **Unchanged:** no production files and none of AC-1400's assertions.
- **Kept green:** the six asset-building suites, plus AC-960 and AC-961, run alongside it.

**Ladder.** Rung 2 decided it. The pinned reference (`assets.ts:1403-1407`) has the same swap, so the build behaves as intended for a single run. No intent in scope requires concurrent builds to be safe, so the AC-1400 test stands. No builder block was reported, so no ruling or override was needed.

**Weak evidence flagged.** Iteration 4 fixed AC-960 and AC-961 by having their folder scans skip the build's temporary folders. That treats a symptom of this same clash. The "not built" check at the end of the AC-1400 test is also weak: when the folder exists it accepts any non-404 answer, so the "not built" message is never checked.

**Things to know:**
- I couldn't reproduce the failure: the sandbox blocks binding local ports (`listen EPERM`), so the workspace server never started.
- The `--stdin` flag in the template's `xgd report create` command made it error out, so I filed without it.
- A push to `github.com:22` was blocked by the sandbox right after the report was created. The report itself was created; if xgd syncs it to GitHub, that sync may not have happened.