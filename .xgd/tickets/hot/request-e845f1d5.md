---
uid: request-e845f1d5
id: REQ-670
type: request
title: '[split from REQ-222] straggler commits'
created_by: xgd
created_at: '2026-11-09T05:45:07.936935+00:00'
updated_at: '2026-11-09T05:45:07.936935+00:00'
completed_at: null
last_field_updated: created_at
status: ready_to_reconcile
fields:
  commits:
  - working_sha: d07ed428396f047768508f833389b60c395d677c
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Auto-split from REQ-222 (Publish builds the width ladder; the renderer emits srcset).
These commits were separated from the main cluster by a large git-position gap.

## Commits

- d07ed42839 feat(publish): typed sources, and a publish that says what it is doing [FREE-CODED]