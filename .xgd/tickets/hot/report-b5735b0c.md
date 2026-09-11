---
uid: report-b5735b0c
id: REPORT-4048
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:48:51.330721+00:00'
updated_at: '2026-09-11T21:48:51.330721+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — class **AA** (both added), out of
  sparse-checkout cone so the conflict existed only in the index. Rule **2e**
  (intent/bookkeeping ticket, `request-*`) with the auto-enrichment
  "take the more recent commit by timestamp" tie-break, since the xgd-kind of
  the operation is unknown on both sides (both subjects are the generic
  `xgd(ticket): update request request-a03967f2`).

  Resolution: kept **ours (HEAD)** via `git checkout --ours` +
  `git add --sparse`. Staged blob `8cd96480`.

### Why ours

The two sides differ **only in frontmatter bookkeeping** — the entire
markdown body is byte-identical (verified with
`git diff <stage2-blob> <stage3-blob>`, which reports no hunks past the
frontmatter block). The differing facts:

| field | ours (HEAD) | incoming (c5752ee5) |
|---|---|---|
| `status` | `free_and_reconciled` | `ready_to_reconcile` |
| `completed_at` | `2026-08-31T14:22:29Z` | `null` |
| `updated_at` | `2026-08-31T14:22:29Z` | `2026-08-23T03:29:49Z` |
| `fields.chat_comment` | `comment-869ded75` | absent |
| `fields.bundled_in` | `bundle-b3b7c399` | absent |

Ours is a strict superset and the later position on both axes:

- Timestamp tie-break: HEAD's latest commit touching this file is
  `6558127a` (2026-08-31 07:22 -0700); the incoming commit is
  2026-08-22 20:29 -0700. HEAD is nine days more recent.
- Lifecycle: `free_and_reconciled` is downstream of `ready_to_reconcile`,
  so HEAD already *contains* the incoming side's status as a passed-through
  state. Taking theirs would have reverted operator-owned lifecycle state
  and dropped two fields the incoming side never had.

No fields were invented and no content was added that is not on one of the
two sides.

## Incoming changes preserved

The incoming commit registers as a 164-line whole-file addition only because
the file did not exist at that path in the picked commit's parent on the
working timeline. Its actual content — the full request body — is already
present verbatim in HEAD (landed by `2dddebd5`, 2026-08-22, then updated by
`a4b923f9` and `6558127a`). Nothing from the incoming side is absent from the
resolved file except the three older frontmatter scalars listed above, each of
which HEAD has advanced past rather than discarded.

No BUG-1301 precedence exception was needed; no hunk was dropped; no test
function was touched (no test files were in conflict).

## Net effect

The staged tree has no diff versus HEAD (`git diff --cached --stat HEAD` is
empty) — this commit's effect had already reached the bundle branch by another
route. Per STEP 4 this is staged and exited `@done` as normal; the finalize
step will detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`c5752ee5cc91b01c14e40da43c6e14cd233931bf`) is left intact.
