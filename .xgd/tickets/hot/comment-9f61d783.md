---
uid: comment-9f61d783
id: COMMENT-1082
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T06:58:29.896898+00:00'
updated_at: '2026-08-16T06:58:29.896898+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8a81b778
  kind: note
---

Assessment complete. **REPORT-2083 (`report-8a81b778`) — result: FAIL** (1 violation, 8 warnings, 0 needs_review).

**Verdicts written:** all 33 ACs `uat_coverage: pass`; STORY-100 `fail`; CAP-86 `fail`.

**Intent ledger (re-queried, not inherited):** REQ-117/118/119/126/128/132/135/136/138 all `free_and_reconciled`; REQ-133/137/139/140 imminent; REQ-134 abandoned. No intent retires an AC's behaviour and no AC describes behaviour the ledger is silent about — hence zero deprecations and zero needs_review.

**AC level:** all 33 have substantive UATs (43 functions, six files) driving real entry points — `run(argv)` through the real `1c` CLI and a live builder origin over HTTP — observing the draft document's bytes, the rendered page, `1c status`, or the origin's own response. Nothing internal is stubbed; nothing is discharged by a source-text check.

**The violation is story-level, which is why the ACs all pass and the capability still fails.** STORY-100's "Making the change visible" bullet claims that *from the command line* an edit re-renders both channels and reports where each was written. The code does this (`tools/generate/src/cli/index.ts:1080-1085`, emitting `rendered` + `renderedDraft`), and its own comment records that the alternative fails invisibly. No AC states that claim — AC-982/AC-1026 say "the re-rendered output", singular; AC-992's both-views claim is origin-scoped — and no test in the repo reads `renderedDraft` or the `draft` dist directory after a `copy set`. Every "both channels" loop fetches `/preview/…` from the origin, which since REQ-119 renders on request and so exercises none of the CLI's render step. Deleting line 1081 would leave all 43 UATs green. Fix: ac-add + uat-add (~10 lines).

Warnings: five duplicate-UAT instances (AC-980/981/986/991/992, all from reconciles adding files rather than editing them), the unevidenced positive half of the read-only rule (AC-988/AC-1120 — must land with REPORT-2081 findings 1–2), stale "on disk" wording in AC-992/AC-1026 verification, and origin-parity duplication downstream of REPORT-2081 finding 4.

One caveat carried into the report: **the 43 UATs were read, not run** — every test-runner invocation was refused by this session's permission mode, `.xgd/quality_history/` is empty and `.xgd/uat_index.json` is `{"acs": {}}`. This check certifies evidence adequacy; a green suite must come from the regression run's own quality gate.
