---
uid: comment-19db7f70
id: COMMENT-2573
type: comment
title: Comment on bug BUG-71
created_by: xgd
created_at: '2026-09-10T17:54:51.607573+00:00'
updated_at: '2026-09-10T17:54:51.607573+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-ee954e95
  kind: chat_transcript
---

<!-- xgd-turn id="2928fb35-cc69-4c60-8cc1-8b1d37f41b74-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:54:33.179531+00:00" -->
#### You
# The builder did not start.

**What failed:** could not load http://127.0.0.1:8788/builder/main.js

**GET /api/sites:** 200 [{"slug":"1stcontact","latest":null},{"slug":"gigabytealchemy","latest":null},{"slug":"xgd","latest":null}]

An asset the builder imports is missing. Run `1c assets`, then restart the builder — the assets manifest is read at startup.

The document loaded; its client did not. Full detail is in the browser console.

<!-- xgd-chat-end -->