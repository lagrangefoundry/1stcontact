---
uid: comment-46c330e5
id: COMMENT-7884
type: comment
title: Comment on bug BUG-364
created_by: xgd
created_at: '2026-11-05T23:16:47.332696+00:00'
updated_at: '2026-11-05T23:30:48.594261+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-07767738
  kind: chat_summary
  framing: 'BUG-364 CLOSED by operator instruction as wont_fix (t2). It duplicates
    BUG-365 (bug-313c192b), which carries the fix. Root cause: commit 3fea82eeee (BUG-355)
    overlay/video branch of composeSection in packages/site-schema/src/l1/design.ts
    strips the clip sizing and makes it a fill layer, so the section loses its 720px
    height. No code was changed and no branch was cut. Explanation is in note COMMENT-7887
    (comment-f9350d82); the body is frozen once a ticket is in a terminal status.'
---

<!-- xgd-summary-entry -->
t1: root cause = 3fea82eeee BUG-355 fill-layer clip drops sizing.height; BUG-365 is a duplicate filed by another session. Asked operator which ticket to use before cutting a branch.


<!-- xgd-summary-entry -->
t2: operator said close as wont fix. Status set to wont_fix; body append refused (terminal status freezes body), so explanation added as note comment-f9350d82.
