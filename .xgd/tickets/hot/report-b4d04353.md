---
uid: report-b4d04353
id: REPORT-7215
type: report
title: 'Report: fix_plan for STORY-144'
created_by: xgd
created_at: '2026-11-01T02:25:11.534634+00:00'
updated_at: '2026-11-01T02:30:54.617713+00:00'
completed_at: null
last_field_updated: batches_pending
fields:
  report_kind: fix_plan
  subject_uid: STORY-144
  items:
  - index: 0
    tests:
    - AC-1722 — the list is rows without descriptions; the item adds one; neither
      leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description
    - AC-1723 — a material’s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name
    - AC-1721 — an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason
    - AC-1720 — a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog
    - AC-1719 — the corrected description is what retrieval answers with afterwards
      test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones
    - AC-1813 — every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC1722 or test_UAT_AC1723 or test_UAT_AC1721 or test_UAT_AC1720
      or test_UAT_AC1719 or test_UAT_AC1813
  batches_pending: false
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
        "AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name",
        "AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason",
        "AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog",
        "AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones",
        "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC1722 or test_UAT_AC1723 or test_UAT_AC1721 or test_UAT_AC1720 or test_UAT_AC1719 or test_UAT_AC1813"
    }
  ]
}