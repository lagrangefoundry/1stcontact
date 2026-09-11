---
uid: request-be3beec6
id: REQ-224
type: request
title: '[split from REQ-178] straggler commits'
created_by: xgd
created_at: '2026-09-11T21:04:48.913206+00:00'
updated_at: '2026-09-11T21:04:48.913206+00:00'
completed_at: null
last_field_updated: created_at
status: ready_to_reconcile
fields:
  commits:
  - working_sha: fa0b857db76c343f68b579e7003fb30207840fdb
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: cd6002e17da483e8e2d7c1defa7fb90540bb0336
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

- fa0b857db7 feat(identity): membership admits, entitlement does not [FREE-CODED]
- cd6002e17d test(identity): REQ-184's account-grant case observes the business, not the door [FREE-CODED]