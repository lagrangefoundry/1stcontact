---
uid: report-76f7a71d
id: REPORT-2325
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-20T02:45:59.842438+00:00'
updated_at: '2026-08-20T02:45:59.842438+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-6cd17452
---

All 16 UATs pass. No runtime code and no existing tests were touched.

## Summary

**File created:** `tests/reconciliation-draft-change-journal.test.ts` — 16 UATs, one per acceptance criterion (AC-1253 … AC-1268).

| AC | What it drives |
|---|---|
| 1253 | accepted write returns `before+1`; a refused write throws (carries no count), leaves the page bytes and the count untouched |
| 1254 | identical copy save → "No change", same count, no record; `cmdApplyGapFixes` dry-run likewise |
| 1255 | all six write shapes (copy, page, settings, palette, asset registration, image generation) each advance by one; declaration shapes + projected manual carry `now` |
| 1256 | since-current → empty/`truncated:false`; no baseline → everything retained, oldest first |
| 1257 | record fields incl. `ai`/`client`/unattributed→`cli`; a palette write leaves `page` absent |
| 1258 | baseline advanced from own writes → empty; a `client` write → exactly one record |
| 1259 | `JOURNAL_WINDOW + 3` writes → truncated with 500 remaining; recent baseline → not truncated; untouched site → not truncated |
| 1260 | copy record survives an `l1.set` that re-shapes the tree under its address |
| 1261 | before/after clipped to `JOURNAL_TEXT_LIMIT` ending `…`; short text byte-identical |
| 1262 | absent journal reads as zero/empty; corrupted journal reads as empty and the next write still succeeds |
| 1263 | no revision dir, empty publish history, no journal artefact in the snapshot, and two publishes (with/without a journal) byte-identical; `.gitignore` excludes it |
| 1264 | `list_changes` in a `ReadSite` manual with its optional baseline; absent and refused for `AuthorPages`-only |
| 1265 | `returns.provenance: untrusted` and the answer wrapped in `<<<untrusted>>>` carrying the client's words |
| 1266 | one real session, five turns: quiet → quiet → signal after a client edit → assistant writes → no signal (own write absorbed) |
| 1267 | `1c changes` human listing, "(nothing has changed)", truncation notice, non-zero exit + `NOT_FOUND` for an unknown slug |
| 1268 | `1c changes --json` slice: `since`/`now`/`truncated`/ordered records with every field |

```
Tests written: 16
Tests passed:  16
Tests failed:   0
```

**One deviation worth recording:** the existing FC test (`test_UAT_FC_REQ-131_change_journal.test.ts`) drives the reminder case through `startBuilder` over HTTP; in this environment that case cannot run at all — `startBuilder` dies with `listen EPERM` and the test is skipped. My AC-1266 test therefore drives the same machinery in-process via `openSession`/`streamPrompt` (real session manager, real role/reminder channel, real tool loop, real write path, real journal), with only the Anthropic client doubled. That required the double to speak the provider's *streaming* shape — the FC test's non-streaming double is what the backend's `runToolLoop` rejects with "stream is not async iterable", which is the reason that case has never actually executed.

```
test_files_created:
  - "tests/reconciliation-draft-change-journal.test.ts"
```
