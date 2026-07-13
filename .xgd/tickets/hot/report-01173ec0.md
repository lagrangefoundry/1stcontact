---
uid: report-01173ec0
id: REPORT-526
type: report
title: 'Regression quality: fail (1 tests, 1 failed, 54 orphan AC(s))'
created_by: xgd
created_at: '2026-07-13T21:07:15.153938+00:00'
updated_at: '2026-07-13T21:07:15.153938+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: report-29765550
  commit: c7577b92db64dbdbe00c4327d7f02ee54c437d40
---

{
  "timestamp": "2026-07-13T21:06:04.587363Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.400001727044582e-05,
    "errors": 0,
    "warnings": 0,
    "error_list": [],
    "warning_list": []
  },
  "build": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0,
    "errors": 0,
    "error_list": []
  },
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 1,
      "duration_seconds": 21.253682959009893,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 0,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC575",
        "test_UAT_AC576",
        "test_UAT_AC577",
        "test_UAT_AC578",
        "test_UAT_AC579",
        "test_UAT_AC580",
        "test_UAT_AC581",
        "test_UAT_AC582",
        "test_UAT_AC583",
        "test_UAT_AC584",
        "test_UAT_AC585",
        "test_UAT_AC586",
        "test_UAT_AC587",
        "test_UAT_AC588",
        "test_UAT_AC589",
        "test_UAT_AC590",
        "test_UAT_AC591",
        "test_UAT_AC592",
        "test_UAT_AC593",
        "test_UAT_AC594",
        "test_UAT_AC595",
        "test_UAT_AC596",
        "test_UAT_AC597",
        "test_UAT_AC598",
        "test_UAT_AC599",
        "test_UAT_AC600",
        "test_UAT_AC601",
        "test_UAT_AC602",
        "test_UAT_AC603",
        "test_UAT_AC604",
        "test_UAT_AC605",
        "test_UAT_AC606",
        "test_UAT_AC607",
        "test_UAT_AC608",
        "test_UAT_AC609",
        "test_UAT_AC610",
        "test_UAT_AC611",
        "test_UAT_AC612",
        "test_UAT_AC613",
        "test_UAT_AC614",
        "test_UAT_AC615",
        "test_UAT_AC616",
        "test_UAT_AC617",
        "test_UAT_AC618",
        "test_UAT_AC619",
        "test_UAT_AC620",
        "test_UAT_AC621",
        "test_UAT_AC622",
        "test_UAT_AC623",
        "test_UAT_AC624",
        "test_UAT_AC625",
        "test_UAT_AC626",
        "test_UAT_AC627",
        "test_UAT_AC628",
        "test_UAT_FC_BUNDLE_5",
        "test_UAT_FC_REQ_51",
        "test_UAT_FC_REQ_52",
        "test_UAT_FC_REQ_53",
        "test_UAT_FC_REQ_54",
        "test_UAT_FC_REQ_55",
        "test_UAT_FC_REQ_56",
        "test_UAT_FC_REQ_57"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "itles\":[\"REQ-56 component-owned typography \u2014 values-diff subscale attribution\"],\"fullName\":\"REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_keep_subscale_deltas_opt_out\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-56_keep_subscale_deltas_opt_out\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-56 component-owned typography \u2014 values-diff subscale attribution\"],\"fullName\":\"REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_gigabytealchemy_badges_close_via_theme\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-56_gigabytealchemy_badges_close_via_theme\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783976767626,\"endTime\":1783976767626,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/req56-component-typography.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 round-trip invariant over the widened space (DOC-22 \u00a75)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 round-trip invariant over the widened space (DOC-22 \u00a75) test_UAT_FC_REQ-57_roundtrip_all_kinds\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_roundtrip_all_kinds\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78) test_UAT_FC_REQ-57_table_roundtrips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_table_roundtrips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78) test_UAT_FC_REQ-57_table_cell_holds_blocks\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_table_cell_holds_blocks\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_block_is_raw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_code_block_is_raw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_fence_widens_for_backticks\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_code_fence_widens_for_backticks\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_block_without_language\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_code_block_without_language\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_heading_levels\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_heading_levels\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_heading_carries_inline_runs\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_heading_carries_inline_runs\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_paragraph_leading_hash_is_guarded\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_paragraph_leading_hash_is_guarded\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78) test_UAT_FC_REQ-57_nested_list_item\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_nested_list_item\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78) test_UAT_FC_REQ-57_multi_paragraph_list_item\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_multi_paragraph_list_item\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_rich_blockquote\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_rich_blockquote\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_nested_blockquote\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_nested_blockquote\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_blockquote_holds_a_list\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_blockquote_holds_a_list\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783976767626,\"endTime\":1783976767626,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/req57-rich-text-blocks.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783976767626,\"endTime\":1783976767626,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783976767626,\"endTime\":1783976767626,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 1,
      "total": 1,
      "failures": [
        {
          "test_name": "suite: javascript-vitest",
          "k_eligible": false,
          "error_type": "infrastructure_bug",
          "message": "INFRASTRUCTURE BUG: Suite 'javascript-vitest' executed 0 tests. Test suite failed to run.",
          "suggested_fix": "Test suite did not execute. Check: (1) Test command in quality.yaml, (2) Build errors, (3) Test target configuration, (4) For Swift: xcodebuild output. Claude cannot fix infrastructure bugs.",
          "field": "suite: javascript-vitest",
          "kind": "quality_config_violation"
        }
      ],
      "tests": []
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 0,
      "failed": 54,
      "total": 54,
      "failures": [
        {
          "test_name": "AC-618 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-618 'Round-trip invariant holds over all block kinds' (uid=acceptance_criterion-7112a0f1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-618.",
          "ac_uid": "acceptance_criterion-7112a0f1",
          "ac_id": "AC-618",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-619 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-619 'Per-run style overrides are expressed via the attribute-span notation and inherit the rest from baseline' (uid=acceptance_criterion-4be9f4f0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-619.",
          "ac_uid": "acceptance_criterion-4be9f4f0",
          "ac_id": "AC-619",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-620 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-620 'Markdown shorthands are accepted for authoring and desugar to the model' (uid=acceptance_criterion-1932163a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-620.",
          "ac_uid": "acceptance_criterion-1932163a",
          "ac_id": "AC-620",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-621 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-621 'Literal delimiters and leading block markers are escaped so they round-trip as text' (uid=acceptance_criterion-f2fb9d1c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-621.",
          "ac_uid": "acceptance_criterion-f2fb9d1c",
          "ac_id": "AC-621",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-622 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-622 'Bullet and ordered lists round-trip as one list kind with positional ordinals and start offset' (uid=acceptance_criterion-b48eca1c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-622.",
          "ac_uid": "acceptance_criterion-b48eca1c",
          "ac_id": "AC-622",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-623 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-623 'Adjacent same-type sibling lists merge on normalization' (uid=acceptance_criterion-85648314) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-623.",
          "ac_uid": "acceptance_criterion-85648314",
          "ac_id": "AC-623",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-624 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-624 'Headings map ATX levels 1-6 and carry inline runs' (uid=acceptance_criterion-9f5aea90) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-624.",
          "ac_uid": "acceptance_criterion-9f5aea90",
          "ac_id": "AC-624",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-625 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-625 'Code blocks preserve verbatim text and optional language with no inline parsing' (uid=acceptance_criterion-ead1c5f1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-625.",
          "ac_uid": "acceptance_criterion-ead1c5f1",
          "ac_id": "AC-625",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-626 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-626 'Blockquotes are containers of child blocks supporting nesting and multiple paragraphs' (uid=acceptance_criterion-94e95d54) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-626.",
          "ac_uid": "acceptance_criterion-94e95d54",
          "ac_id": "AC-626",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-627 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-627 'Tables round-trip as a 2-D grid whose cells hold block content' (uid=acceptance_criterion-348f78bb) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-627.",
          "ac_uid": "acceptance_criterion-348f78bb",
          "ac_id": "AC-627",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-628 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-628 'List items hold child blocks, supporting nested lists and multiple paragraphs' (uid=acceptance_criterion-73a00903) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-628.",
          "ac_uid": "acceptance_criterion-73a00903",
          "ac_id": "AC-628",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-610 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-610 'Theme badge subscale drives every badge label's rendered type' (uid=acceptance_criterion-c3fec3d8) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-610.",
          "ac_uid": "acceptance_criterion-c3fec3d8",
          "ac_id": "AC-610",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-611 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-611 'Theme checklist subscale drives every checklist item's rendered type' (uid=acceptance_criterion-2a3444fc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-611.",
          "ac_uid": "acceptance_criterion-2a3444fc",
          "ac_id": "AC-611",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-612 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-612 'Subscales use the render's px vocabulary end-to-end (zero translation)' (uid=acceptance_criterion-06acbdd1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-612.",
          "ac_uid": "acceptance_criterion-06acbdd1",
          "ac_id": "AC-612",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-613 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-613 'Per-instance style overrides the theme subscale for a single card only' (uid=acceptance_criterion-225bcbee) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-613.",
          "ac_uid": "acceptance_criterion-225bcbee",
          "ac_id": "AC-613",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-614 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-614 'Capture reads component subscales from a reference page's own semantics' (uid=acceptance_criterion-e7094d99) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-614.",
          "ac_uid": "acceptance_criterion-e7094d99",
          "ac_id": "AC-614",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-615 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-615 'A systemic subscale gap is reported as one theme finding, rolling up its per-element rows' (uid=acceptance_criterion-e7ed430e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-615.",
          "ac_uid": "acceptance_criterion-e7ed430e",
          "ac_id": "AC-615",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-616 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-616 'Opt-out restores the rolled-up per-element subscale rows' (uid=acceptance_criterion-a339f2a0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-616.",
          "ac_uid": "acceptance_criterion-a339f2a0",
          "ac_id": "AC-616",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-617 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-617 'Setting the theme subscale to the reference closes the systemic badge and checklist gap' (uid=acceptance_criterion-391ac1df) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-617.",
          "ac_uid": "acceptance_criterion-391ac1df",
          "ac_id": "AC-617",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-604 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-604 'Named width step caps content column to the matching Tailwind measure' (uid=acceptance_criterion-2aeb342b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-604.",
          "ac_uid": "acceptance_criterion-2aeb342b",
          "ac_id": "AC-604",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-605 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-605 'Literal contentWidth value renders an exact off-scale measure' (uid=acceptance_criterion-fade4c92) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-605.",
          "ac_uid": "acceptance_criterion-fade4c92",
          "ac_id": "AC-605",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-606 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-606 'bleed or absent contentWidth leaves the content column uncapped' (uid=acceptance_criterion-b75a76db) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-606.",
          "ac_uid": "acceptance_criterion-b75a76db",
          "ac_id": "AC-606",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-607 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-607 'rowWidth boxes a grouped multi-column row via the same scale and literal hatch' (uid=acceptance_criterion-10327be2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-607.",
          "ac_uid": "acceptance_criterion-10327be2",
          "ac_id": "AC-607",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-608 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-608 'contentWidth is honored uniformly across the width-bearing content modules' (uid=acceptance_criterion-0e301b8b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-608.",
          "ac_uid": "acceptance_criterion-0e301b8b",
          "ac_id": "AC-608",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-609 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-609 'Retired width names are removed from the dial and container tokens' (uid=acceptance_criterion-045456fe) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-609.",
          "ac_uid": "acceptance_criterion-045456fe",
          "ac_id": "AC-609",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-601 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-601 'Default prose block renders at full content-container width, centred' (uid=acceptance_criterion-034ada35) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-601.",
          "ac_uid": "acceptance_criterion-034ada35",
          "ac_id": "AC-601",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-602 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-602 'contentWidth dial narrows a plain prose block's content' (uid=acceptance_criterion-8840f613) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-602.",
          "ac_uid": "acceptance_criterion-8840f613",
          "ac_id": "AC-602",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-603 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-603 'Prose block is not narrowed unless contentWidth is set' (uid=acceptance_criterion-baf0a08c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-603.",
          "ac_uid": "acceptance_criterion-baf0a08c",
          "ac_id": "AC-603",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-594 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-594 'Positioned hero object is placed by band coordinates' (uid=acceptance_criterion-8ab00cd9) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-594.",
          "ac_uid": "acceptance_criterion-8ab00cd9",
          "ac_id": "AC-594",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-595 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-595 'Unpositioned hero renders in normal flow, unchanged' (uid=acceptance_criterion-28ea782f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-595.",
          "ac_uid": "acceptance_criterion-28ea782f",
          "ac_id": "AC-595",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-596 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-596 'Mixed positioned and flowed hero objects split per object' (uid=acceptance_criterion-91ea8dc1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-596.",
          "ac_uid": "acceptance_criterion-91ea8dc1",
          "ac_id": "AC-596",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-597 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-597 'Overlay header wordmark shares the hero coordinate space' (uid=acceptance_criterion-c67887d3) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-597.",
          "ac_uid": "acceptance_criterion-c67887d3",
          "ac_id": "AC-597",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-598 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-598 'Overlay chrome spans the full band and is pointer-transparent' (uid=acceptance_criterion-1ea9cc8e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-598.",
          "ac_uid": "acceptance_criterion-1ea9cc8e",
          "ac_id": "AC-598",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-599 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-599 'Unpositioned wordmark stays in the flow row, unchanged' (uid=acceptance_criterion-1cbfd065) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-599.",
          "ac_uid": "acceptance_criterion-1cbfd065",
          "ac_id": "AC-599",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-600 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-600 'A run's typography style and position combine losslessly' (uid=acceptance_criterion-ab316d33) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-600.",
          "ac_uid": "acceptance_criterion-ab316d33",
          "ac_id": "AC-600",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-589 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-589 'Modern-CSS colour formats resolve to an accurate sRGB hex, not the inferred sentinel' (uid=acceptance_criterion-53f99441) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-589.",
          "ac_uid": "acceptance_criterion-53f99441",
          "ac_id": "AC-589",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-590 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-590 'Fully transparent or unpaintable colour falls back to the #000000 sentinel and is flagged inferred' (uid=acceptance_criterion-572aa4e2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-590.",
          "ac_uid": "acceptance_criterion-572aa4e2",
          "ac_id": "AC-590",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-591 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-591 'Standard rgb()/rgba() colours resolve to hex even without a rendering surface' (uid=acceptance_criterion-d5e4dfaa) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-591.",
          "ac_uid": "acceptance_criterion-d5e4dfaa",
          "ac_id": "AC-591",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-592 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-592 'One-sided box geometry is reported as a box mismatch, not a silent pass' (uid=acceptance_criterion-f6ab65bb) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-592.",
          "ac_uid": "acceptance_criterion-f6ab65bb",
          "ac_id": "AC-592",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-593 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-593 'Report prints a loud STALE-REFERENCE warning counting reference objects with no box geometry' (uid=acceptance_criterion-cc4d16db) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-593.",
          "ac_uid": "acceptance_criterion-cc4d16db",
          "ac_id": "AC-593",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-582 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-582 'Directly-authored axes require an exact match by default' (uid=acceptance_criterion-5b2d4ca2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-582.",
          "ac_uid": "acceptance_criterion-5b2d4ca2",
          "ac_id": "AC-582",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-583 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-583 'Element position is exact by default with a 1px rounding allowance' (uid=acceptance_criterion-cb4dc4a8) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-583.",
          "ac_uid": "acceptance_criterion-cb4dc4a8",
          "ac_id": "AC-583",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-584 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-584 'Box width is exact by default while box height keeps a wrapping tolerance' (uid=acceptance_criterion-454f43af) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-584.",
          "ac_uid": "acceptance_criterion-454f43af",
          "ac_id": "AC-584",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-585 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-585 'Art-directed axes remain tolerant by default' (uid=acceptance_criterion-222a78c6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-585.",
          "ac_uid": "acceptance_criterion-222a78c6",
          "ac_id": "AC-585",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-586 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-586 'The tolerant opt-out restores loose matching on every default-exact axis' (uid=acceptance_criterion-3b5e94c9) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-586.",
          "ac_uid": "acceptance_criterion-3b5e94c9",
          "ac_id": "AC-586",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-587 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-587 'A per-axis tolerance override loosens one axis and overrides both modes' (uid=acceptance_criterion-77c95c85) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-587.",
          "ac_uid": "acceptance_criterion-77c95c85",
          "ac_id": "AC-587",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-588 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-588 'No legacy strict/exact toggle; exact is the default with a single opt-out' (uid=acceptance_criterion-d9bf617e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-588.",
          "ac_uid": "acceptance_criterion-d9bf617e",
          "ac_id": "AC-588",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-575 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-575 'Comparison output groups deltas into one card per reference object, worst object first' (uid=acceptance_criterion-5d003a95) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-575.",
          "ac_uid": "acceptance_criterion-5d003a95",
          "ac_id": "AC-575",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-576 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-576 'Every object card shows the object's box position as a first-class parameter' (uid=acceptance_criterion-042865ff) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-576.",
          "ac_uid": "acceptance_criterion-042865ff",
          "ac_id": "AC-576",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-577 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-577 'Unpaired objects are reported loudly in both directions with counts' (uid=acceptance_criterion-d1e761dd) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-577.",
          "ac_uid": "acceptance_criterion-d1e761dd",
          "ac_id": "AC-577",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-578 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-578 'The expected column prints spec field names and units as a paste-able value' (uid=acceptance_criterion-a3f4a69a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-578.",
          "ac_uid": "acceptance_criterion-a3f4a69a",
          "ac_id": "AC-578",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-579 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-579 'Image and control objects carry their own kind-appropriate parameter tables' (uid=acceptance_criterion-13fbeb46) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-579.",
          "ac_uid": "acceptance_criterion-13fbeb46",
          "ac_id": "AC-579",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-580 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-580 'Clean objects collapse to a count and non-object deltas render in a dedicated tail' (uid=acceptance_criterion-2f0d26d7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-580.",
          "ac_uid": "acceptance_criterion-2f0d26d7",
          "ac_id": "AC-580",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-581 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-581 'Machine-readable report carries the object cards and unpaired list' (uid=acceptance_criterion-be3c68cc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-581.",
          "ac_uid": "acceptance_criterion-be3c68cc",
          "ac_id": "AC-581",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "infrastructure_bug",
        "field": "suite: javascript-vitest",
        "message": "INFRASTRUCTURE BUG: Suite 'javascript-vitest' executed 0 tests. Test suite failed to run.",
        "suggestion": "Test suite did not execute. Check: (1) Test command in quality.yaml, (2) Build errors, (3) Test target configuration, (4) For Swift: xcodebuild output. Claude cannot fix infrastructure bugs.",
        "context": {
          "actual": 0
        }
      }
    ]
  }
}