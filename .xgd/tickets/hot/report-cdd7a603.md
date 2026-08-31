---
uid: report-cdd7a603
id: REPORT-2973
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:39:17.033661+00:00'
updated_at: '2026-08-31T15:39:17.033661+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`). Rules **2b** (both added → one side is a strict superset) and **2e**
  (incoming only added a field the other side never touched → keep the superset) agree.
  Resolved by taking the incoming (`free_coded`, commit `4cf9622f`, *"xgd(ticket): update
  request request-3f8737f2"*) version in full.

  The two sides differ in exactly one content line: incoming adds
  `fields.chat_comment: comment-422ff2d4`. Every other line — frontmatter, all eight
  acceptance criteria, all prose sections — is identical. There is no fact changed
  differently on the two sides, so no `xgd working-timeline` per-fact adjudication was
  needed. (The blobs also differ in a trailing newline: incoming has none. Taking the
  incoming blob verbatim preserves the developer's file exactly as authored.)

  File is outside the sparse-checkout cone (DOC-986 §2/§4.1), so staged with
  `git add --sparse`; the checkout used `--ignore-skip-worktree-bits` (`git checkout` has
  no `--sparse` option in this git version).

## Incoming changes preserved

- `.xgd/tickets/hot/request-3f8737f2.md`: **verified byte-identical to incoming.**
  Staged blob is `d03beb888f13a4cd535601c3a8988b76363d4bcd`, which is stage 3 (theirs) of
  the conflict; `git diff --cached 4cf9622f -- <path>` is empty. The incoming commit's only
  change (`chat_comment: comment-422ff2d4`) is present in the resolution.

No hunks were dropped. The BUG-1301 precedence exception was not invoked. No code,
test, or UAT files were part of this conflict.
