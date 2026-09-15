---
uid: comment-9e94df72
id: COMMENT-3002
type: comment
title: Comment on bug BUG-92
created_by: xgd
created_at: '2026-09-15T00:54:22.505458+00:00'
updated_at: '2026-09-15T00:54:22.505458+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-08631a8c
  kind: chat_transcript
---

<!-- xgd-turn id="87ab43df-86c2-46f0-a76a-819b78118744-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T00:54:13.322660+00:00" -->
#### You
The AI created a page that was not at the top level - this broke the whole site with the message: 

I see this now "page slug 'papers/download' is nested: rendered pages must sit flat at the snapshot root, because emitted asset URLs are relative to it (REQ-109)" is that due to your change? Is it a bug?

We should validate for that and fail the change with an error to the AI not let it break the site for the user

<!-- xgd-chat-end -->