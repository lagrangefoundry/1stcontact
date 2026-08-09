---
uid: comment-0533c30b
id: COMMENT-884
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-09T13:52:25.546261+00:00'
updated_at: '2026-08-09T13:52:25.546261+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3406f60f
  kind: note
---

Assessment complete and verified on disk.

## Result: **PASS** — report `REPORT-1736` (`report-3406f60f`)

**Verdicts written:** 36/36 ACs `pass`, 3/3 stories `pass`, capability `pass`. All confirmed persisted by re-reading the tickets.

### Intent ledger
All three stories trace to `bundle-e0143ffa` (BUNDLE-13) and `bundle-0385746c` (BUNDLE-14), both `free_and_reconciled` and merged. The delivery intents are REQ-110 (deploy), REQ-111 (Worker serving), REQ-113 (clean URLs, incl. its 2026-07-30 scope extension), and BUG-31 (store-tree namespacing → AC-924/925/926 + AC-927). **No intent retires any behavior the matrix describes**, and no AC is unsupported — so zero deprecations and zero needs_review.

### Coverage
I judged from the test bodies, then ran them: **4 files, 36 tests, all passing in 1.04s**. Evidence quality is high — real entry points throughout (`cmdDeploy`, `worker.fetch(Request, Env, ExecutionContext)`, `startServe` over loopback and a raw socket), with mocking confined to R2, the one boundary the project doesn't own. Notably resistant to false passes: negative controls paired with positives (`readKeys === []` alongside a request that demonstrably reads), fixtures derived from real deploys rather than hand-built, and assets authored root-absolute on purpose so a REQ-109 regression would fail rather than pass silently.

### One warning (does not affect pass/fail)
`.xgd/uat_index.json` is **stale** — written 2026-08-06 22:34, before these tests landed on 08-07. It reports `status: "missing"` for all 36 ACs while every one exists and passes. I followed the prompt's instruction to judge from test bodies, but flag it because anything downstream trusting the index rather than the files will conclude this capability is uncovered. Worth regenerating.

### Two things I did not treat as defects
- **Three divergences are recorded in the story bodies rather than hidden** (REQ-110's compare-and-swap became a re-read-and-compare; published addresses aren't revision-scoped; no live-bucket smoke check was ever run). In each case the AC pins the property actually achieved, and the body says so plainly — that's honest documentation, not drift.
- **AC-914 and the STORY-96 directory asymmetry are asserted at their own entry points** because no site definition can reach them end-to-end today (rendered output is flat). AC-914's test pins that reason with a live assertion that fails the day nesting arrives.

**One process note:** the ticket store's cold index takes ~167s to rebuild but the lock times out at 30s, and four dashboard servers plus several dispatcher runners were contending for it — so `xgd ticket list` failed repeatedly and cost a large part of this run. I completed the work via the `xgd_source/core/ticketing` module (explicitly sanctioned by CLAUDE.md as the ticketing API), which pays the index cost once per process instead of once per call. The report itself was created through `xgd report create`. If this contention is chronic it will keep making matrix workflows slow or flaky, independent of this assessment.
