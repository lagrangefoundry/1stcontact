---
uid: report-ab2474ae
id: REPORT-5267
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:53:03.384007+00:00'
updated_at: '2026-09-28T02:53:03.384007+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (`bug-*`), STEP 2e.
  Incoming commit `e81f695ea6`. Two conflict hunks, both resolved to ours:

  1. **Lifecycle fields** — same facts changed differently on both sides, so 2e's
     "later-positioned intent wins, per fact" applies:

     | field | ours (HEAD) | incoming |
     |---|---|---|
     | `updated_at` | `2026-08-31T19:19:36` | `2026-08-24T21:57:19` |
     | `completed_at` | `2026-08-31T19:19:36` | `null` |
     | `status` | `free_and_reconciled` | `free_coded` |

     HEAD is later by the ticket's own ledger clock and further along the
     lifecycle. Taking incoming would have regressed
     `free_and_reconciled` → `free_coded` and cleared `completed_at`.

  2. **`fields.bundled_in: bundle-78f4e2fe`** — present on HEAD only; incoming's
     side of the hunk is empty. Not a competing fact, so the HEAD-only addition
     is kept (2e: non-overlapping fields, apply both).

  Body was byte-identical on both sides — the ours-vs-theirs diff reduces to the
  two hunks above. Result is byte-identical to HEAD, so the staged diff for this
  cherry-pick is empty (finalize will skip the commit).

## Incoming changes preserved

Incoming commit `e81f695ea6`'s content delta, measured against the merge base
(index stage 1, blob `c78eab15`), was entirely bookkeeping in `fields`:

- `working_sha_history: []` added to the first `commits` entry
- two additional `commits` entries (`0fe586d1…`, `999579b3…`)
- `fields.version` `0.2.11` → `0.2.13`
- `updated_at` bump plus `last_field_updated: status`

Every one of those is present in the resolved file and merged cleanly **outside**
the conflict hunks, because HEAD had already absorbed them: `working_sha_history`
at line 23, three `working_sha:` entries, `version: 0.2.13` at line 30. Only the
`updated_at` value differs, and that is hunk 1's genuine per-fact conflict
decided above. No incoming hunk was dropped; the BUG-1301 precedence exception
was not needed.

No code, test, or spec-matrix files were in conflict.
