---
uid: request-c82d02d3
id: REQ-226
type: request
title: '[split from REQ-178] straggler commits'
created_by: xgd
created_at: '2026-09-11T21:05:01.651872+00:00'
updated_at: '2026-09-11T21:05:01.651872+00:00'
completed_at: null
last_field_updated: created_at
status: ready_to_reconcile
fields:
  commits:
  - working_sha: a9f1021dd88738c5976d7a86dbfee2a5db58373f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Auto-split from REQ-178 (Identity: an account operates several businesses, not one).
These commits were separated from the main cluster by a large git-position gap.

## Commits

- a9f1021dd8 Merge branch 'free-REQ-178' into xgd-working