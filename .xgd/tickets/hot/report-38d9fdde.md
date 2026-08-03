---
uid: report-38d9fdde
id: REPORT-1145
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-08-03T04:16:57.839649+00:00'
updated_at: '2026-08-03T04:16:57.839649+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-8cc4b283
  parent_report_uid: report-843a5d06
  batch_index: '0'
---

Verified and done.

## Assessment

**Diagnosis — neither a production bug nor a stale AC. It was a test-side AC-attribution defect.**

Both `AC-742` and `AC-748` surfaced as *orphaned acceptance criteria*, not test failures: the scoped run was `117 passed / 0 failed`, and both tests were in the passing list. The AC-coverage gate (`xgd_source/quality/ac_coverage_gate.py`) credits an AC by extracting an id from each **passing test's full name** via `extract_ac_id_from_test_name`, which takes the **first** `ac[-_]?\d+` match in the string. Vitest's full name is `describe title + test title`, so:

| Full name (before) | Credited | Actual |
|---|---|---|
| `AC-741 / AC-742 — fonts as painted test_UAT_AC742_…` | AC-741 | AC-742 |
| `AC-747 / AC-748 — section geometry and scrims test_UAT_AC748_…` | AC-747 | AC-748 |

Each block's *first* AC absorbed the credit and the second AC looked uncovered. These two were the only multi-AC `describe` titles in the whole repo (`grep` confirms), which matches the orphan set exactly — no other AC was affected.

That rules out the other two outcomes: the implementation is fine (both UATs assert real captured behaviour and pass), and the ACs are genuinely delivered, so deprecating them would have deleted live, passing evidence.

## Fix

`tests/reconciliation-capture-recording-contract.test.ts` — dropped the AC ids from the two shared `describe` titles so each test's own name is the sole AC link. The AC ids remain in the banner comments above each block (documentation) and in every test name (the machine-readable link). Assertions are untouched.

Splitting into one `describe` per AC was the alternative; rejected because each block shares one expensive real-browser `beforeAll` capture, and splitting would have duplicated it.

## Verification

Ran the full edited file under vitest and fed the real output through the gate's own extractor:

```
passed AC-740 … passed AC-751     12 passed | 0 failed | 0 pending
AC-742 covered: True    AC-741 covered: True
AC-748 covered: True    AC-747 covered: True
```

Both target ACs now resolve to themselves, and AC-741/AC-747 did not regress. Working tree contains exactly this one file changed.

## Two things to flag

- **The instructed verification command proves nothing.** `xgd quality run --test-filter-expression "AC-742 (orphaned acceptance criterion) or AC-748 (orphaned acceptance criterion)"` uses the synthetic failure labels as a `-k` expression; it matched 0 of 868 tests and reported `SUCCESS (empty scope)`. Standalone `xgd quality run` also no-ops the AC gate without `story_uid`/`intent_uid`. I ran it as instructed and it exited success — but the verification above is what actually confirms the fix.
- **A pre-existing failure unrelated to this batch.** The collection run showed `1 failed | 867 passed`: `ENOENT … storage/references/gigabytealchemy.ai/index/multistate.json`. `/storage/references/` is gitignored — a local capture cache absent from this fresh worktree. Not caused by this change, outside the batch scope, so I left it alone.

Worth noting for the planner: the gate's first-match-wins extraction over the concatenated full name means any `describe` title mentioning an AC id will shadow every test inside it. A repo convention of keeping AC ids out of suite titles (or a guardrail test asserting it) would stop this recurring.
