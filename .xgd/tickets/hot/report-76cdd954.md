---
uid: report-76cdd954
id: REPORT-7192
type: report
title: 'Report: fix_plan for STORY-146'
created_by: xgd
created_at: '2026-11-01T01:40:32.142948+00:00'
updated_at: '2026-11-01T01:44:45.027048+00:00'
completed_at: null
last_field_updated: batches_pending
fields:
  report_kind: fix_plan
  subject_uid: STORY-146
  items:
  - index: 0
    tests:
    - login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant
    - login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC1748 or test_UAT_AC1754
  batches_pending: false
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant",
        "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC1748 or test_UAT_AC1754"
    }
  ]
}