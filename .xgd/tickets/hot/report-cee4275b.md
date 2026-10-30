---
uid: report-cee4275b
id: REPORT-5284
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:55:21.938981+00:00'
updated_at: '2026-09-28T03:55:21.938981+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket
  (rule 2e: bundle ticket, no intent-ledger narrative to replay).
  Resolved in favour of **HEAD** on all four conflicting facts.

  The conflict was confined to one hunk in the frontmatter lifecycle block:

  | field | HEAD (ours) | incoming (44f12ddc80) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:23:04Z` | `2026-08-25T23:30:45Z` |
  | `completed_at` | `2026-08-31T14:22:24Z` | `null` |
  | `last_field_updated` | `result` | `status` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |

  Both sides changed the *same* facts (`status`, `updated_at`), so this is a
  genuine 2e intent conflict rather than two disjoint edits — the
  later-positioned intent wins, per fact. HEAD is later on every axis:

  - Commit date: HEAD-side `8e07e6015dead83333d9ae23d1116e97a118a490`
    (2026-08-31 07:23 -0700) is 6 days after incoming `44f12ddc80`
    (2026-08-25 16:30 -0700).
  - Lifecycle position: `free_and_reconciled` is *downstream* of
    `ready_to_reconcile` on the same bundle status path. Accepting incoming
    would have regressed the bundle's status, nulled `completed_at`, and
    dropped `result: pass`.

  Because `.xgd/tickets/` is outside the sparse-checkout cone on resync
  branches (DOC-986 §2/§4.1), staging required
  `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

No incoming change was discarded as content. Scoped against the merge base,
the incoming commit's **entire** intent on this file is 4 lines / 2 logical
facts:

```
-updated_at: '2026-08-24T02:10:52.543733+00:00'
+updated_at: '2026-08-25T23:30:45.696844+00:00'
-status: reconciling
+status: ready_to_reconcile
```

(`git diff :1: :3:` = 2 insertions, 2 deletions; `git diff :1: :2:` = 289
insertions, 99 deletions.)

That is a single lifecycle transition `reconciling -> ready_to_reconcile`,
which HEAD has already traversed and advanced beyond to
`free_and_reconciled` with `completed_at` and `result: pass` set, plus a
fully-populated `orphan_commits` ledger. The incoming value is therefore an
*earlier point on the same field's own progression*, superseded by a later
transition — not an independent fact that could be combined. There is no
disjoint incoming edit anywhere in the file.

Verified that taking stage 2 verbatim loses nothing from the incoming side:
base -> theirs touches only lines 7-13, entirely inside the conflict hunk, so
the incoming commit contributed no content outside the conflicted region that
the auto-merge would have placed in the working tree. `git diff :2: :3:`
confirms every ours/theirs difference lives in that one hunk.

No code files were involved, and no test function on either side of this
conflict was deleted — the BUG-1301 precedence exception was not needed and
was not invoked.
