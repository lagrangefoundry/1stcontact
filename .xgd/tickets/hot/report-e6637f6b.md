---
uid: report-e6637f6b
id: REPORT-5547
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T13:00:19.786852+00:00'
updated_at: '2026-09-29T13:00:19.786852+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/chat-e700744f.md` — AA (both added), intent/bookkeeping
  ticket (chat). Rule 2e / 2b: incoming side is a strict superset — OURS had
  `fields: {}`, THEIRS (c874ebad81) had `fields: {chat_comment: comment-2f0ecec4}`.
  All other frontmatter fields (including `updated_at`) byte-identical on both
  sides, and the body (`<!-- xgd-chat-end -->`) is identical, so there is no
  competing fact and no timeline tiebreak was needed. Took the superset via
  `git checkout --theirs`, staged with `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-e700744f.md`: confirmed against
  `git show c874ebad81 -- <file>` equivalent (stage-3 blob 40b22dc6). The
  incoming `chat_comment: comment-2f0ecec4` link is present in the staged
  blob. No hunks dropped; the BUG-1301 precedence exception was not invoked.

No code, test, or matrix files were involved in this conflict.
