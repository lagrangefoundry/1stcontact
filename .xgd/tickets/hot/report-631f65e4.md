---
uid: report-631f65e4
id: REPORT-5467
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:12:37.583991+00:00'
updated_at: '2026-09-29T05:12:37.583991+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, class 2e (intent/bookkeeping
  ticket: `request-*`, outside the sparse-checkout cone, so the conflict existed
  only in the index; staged with `git add --sparse`). Conflict was confined to the
  frontmatter lifecycle block. Both sides changed the *same* fields differently, so
  the per-fact later-intent rule applies:

  | field | HEAD (resync branch) | incoming `20be4747de` | taken |
  |---|---|---|---|
  | `updated_at` | 2026-09-19T15:15:30 | 2026-09-01T19:34:20 | HEAD |
  | `completed_at` | 2026-09-14T10:29:11 | `null` | HEAD |
  | `last_field_updated` | `status` | `body` | HEAD |
  | `status` | `free_and_reconciled` | `draft` | HEAD |

  HEAD carries the later lifecycle state (completed Sept 14, reconciled Sept 19);
  the incoming side's only frontmatter delta was a routine `updated_at` bump
  accompanying its body edit. Taking the incoming side would have regressed a
  reconciled ticket back to `draft`.

## Incoming changes preserved

`20be4747de` touched this file with exactly two hunks:

1. **Body addition** (the two lines assigning the chat-summary gap to
   [[REQ-171]], "together with the session prompts and turn reminders it has to be
   written into") — **present**. Verified in the staged result and in
   `git show HEAD:.xgd/tickets/hot/request-bbff35c7.md` (line 216): this content had
   already landed in HEAD through an earlier path in the resync queue, so it merged
   without conflict and no incoming prose was dropped.
2. **`updated_at` bump** — superseded by HEAD's later value per the per-fact rule
   above. This is a competing edit to the same field, not a dropped change.

No BUG-1301 precedence exception was needed; no code or test files were involved.

## Staging state

Resolution is identical to HEAD (`git diff HEAD` empty for this path) because the
incoming body change was already integrated and the frontmatter delta was
superseded. Per STEP 4, staged and exiting normally — finalize will detect the clean
staged diff and skip the commit. `CHERRY_PICK_HEAD` (`20be4747de`) left intact; no
`--continue`/`--skip`/`--quit`/`--abort` was run.
