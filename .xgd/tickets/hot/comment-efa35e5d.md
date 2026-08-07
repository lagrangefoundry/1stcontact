---
uid: comment-efa35e5d
id: COMMENT-826
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T23:16:11.940614+00:00'
updated_at: '2026-08-07T23:16:11.940614+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e22300ad
  kind: note
---

Assessment complete. **REPORT-1653** (`report-e22300ad`) — **FAIL**: 8 violations, 4 warnings, 0 needs_review.

## Verdicts written

| Level | Result |
|---|---|
| ACs (48) | 42 pass, **6 fail** — AC-657, AC-720, AC-643, AC-639, AC-815, AC-631 |
| Stories (5) | STORY-78 pass; STORY-75/76/77/79 fail |
| CAP-63 | fail |

## What I verified rather than assumed

I ran the 13 AC-bearing test files: **76 passed, 4 skipped, 7.72s**. Coverage is structurally complete — every one of the 48 ACs has a `test_UAT_AC<n>_*` test and all execute green. So this is not a missing-test report; every finding is about depth of evidence.

Two things I confirmed directly at the source rather than inheriting from the prior cycle's reports:

**Chromium is absent in this worktree, and one harness hides it.** The `itA` helper at `bug27-nested-backdrop-capture.test.ts:82` does `if (!capture) return` — reporting PASS with zero assertions, not SKIP. The run proves it: all six `itA` tests reported **0ms** against 1–7ms for their browser-free neighbours. AC-815's entire evidence is `itA`, so it currently has none. AC-816 survives only because four `foldToL1` tests execute unconditionally.

**AC-657's test writes the evidence it then asserts.** It never invokes `values-diff`; it calls `withCleanStdout`, writes the JSON document itself at `:77`, and parses what it just wrote at `:86`. The production emit at `index.ts:793` is executed by no test in the repo.

## The pattern worth acting on

Findings 1, 3, 4 and 9 are one shape: four ACs state a property of a *command* but are tested one layer below it. In each case the implementing line — `index.ts:780`/`:793`, `perceptual.ts:493`, `fidelity.ts:167` — can be deleted with the whole capability still green. All four are fixable with harnesses already in the repo (`runCli`, the fake `driverFactory`), so one batch clears three violations and a warning.

Findings 5, 6 and 8 reduce to a second root: capture-side ACs proven only by browser-gated tests. AC-711 already shows the fix — real `EXTRACT_SCRIPT` under jsdom, environment-independent.

Two things I flagged but deliberately did **not** treat as coverage gaps: AC-637/638 carry a colour model REQ-114 retired, but the behaviour is live reconciled REQ-62 intent and both tests correctly assert current behaviour — the AC bodies are stale, not the behaviour, so they're `pass` with an ac-edit warning rather than deprecated.

One caveat on scope: findings 7 and 8 need new ACs because four reconciled intents (BUG-16/22/24/25, all BUNDLE-10 members) reach no story body anywhere in the matrix. That's a matrix-wide gap I could only observe from inside this capability — BUNDLE-10 plausibly cost CAP-70 and CAP-71 coverage too, and confirming that is outside this assessment's scope.
