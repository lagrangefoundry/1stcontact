---
uid: comment-595c6424
id: COMMENT-2301
type: comment
title: Comment on bug BUG-57
created_by: xgd
created_at: '2026-09-06T20:44:32.622200+00:00'
updated_at: '2026-09-06T20:44:32.622200+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-efe0ce52
  kind: chat_transcript
---

<!-- xgd-turn id="cc3d046b-01b2-4f4d-b565-8b041fb0ef6b-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:44:12.584277+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % bin/smoke
  PASS  apex_resolves
      200 text/plain; charset=utf-8
  FAIL  unknown_slug_not_found
      an unknown slug returned 500, expected 404
  skip  unpublished_slug_indistinguishable
      no --slug given
  skip  published_root_redirects
      no --slug given
  skip  draft_root_redirects
      no --slug/--draft given
  skip  draft_index_serves_html
      no --slug/--draft given
  skip  draft_cache_and_robots_policy
      no --slug/--draft given
  skip  draft_miss_is_noindex_404
      no --slug/--draft given
  skip  draft_assets_resolve
      no --slug/--draft given
  skip  control_app_challenges_unauthenticated
      no --control-origin given
  skip  control_app_workers_dev_closed
      no --workers-dev-origin given

Smoke FAILED against https://1stcontact.io: 1 failed, 1 passed, 9 skipped.
Failed: unknown_slug_not_found
((.venv-working) ) martin@nyx 1stcontact %

```

<!-- xgd-chat-end -->