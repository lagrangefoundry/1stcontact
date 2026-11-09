---
uid: report-b65343a3
id: REPORT-12068
type: report
title: 'Scoped quality: fail (10 tests, 8 failed, 8 orphan AC(s))'
created_by: xgd
created_at: '2026-11-09T23:49:02.234708+00:00'
updated_at: '2026-11-09T23:49:02.234708+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-aacb7060
  commit: 464b81d4c46050e34351878bb5a81a599b012677
---

{
  "timestamp": "2026-11-09T23:45:13.286829Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011620763689279556,
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
    "error_list": [],
    "stdout": "No tsconfig.json \u2014 type-check skipped (JS-only project)",
    "stderr": ""
  },
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 6.798946457915008,
      "passed": 2,
      "failed": 8,
      "skipped": 0,
      "errors": 0,
      "total": 10,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1709_",
        "test_UAT_AC1710_",
        "test_UAT_AC1711_",
        "test_UAT_AC1712_",
        "test_UAT_AC1713_",
        "test_UAT_AC2015_",
        "test_UAT_AC2016_",
        "test_UAT_AC2017_",
        "test_UAT_AC2588_",
        "test_UAT_AC2589_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_site_asset_push_rights_gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"status\":\"failed\",\"title\":\"test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"duration\":18,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at handOver (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts:72:27)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts:135:22\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"status\":\"failed\",\"title\":\"test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"duration\":3,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at handOver (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts:72:27)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts:189:24\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"status\":\"failed\",\"title\":\"test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"duration\":4,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at handOver (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts:72:27)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts:259:20\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794267920337,\"endTime\":1794267920362,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"status\":\"failed\",\"title\":\"test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"duration\":18,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts:184:29\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"status\":\"failed\",\"title\":\"test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"duration\":7,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts:253:30\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"status\":\"failed\",\"title\":\"test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"duration\":3,\"failureMessages\":[\"AssertionError: expected undefined to be 'logo.png' // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts:313:28\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"status\":\"failed\",\"title\":\"test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"duration\":3,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at Accessor.getTenant (/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/accessor.js:654:8)\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/apps/control-app/src/tickets.ts:740:29)\\n    at projectKnowledgeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/apps/control-app/src/knowledge.ts:670:38)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts:340:29\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"status\":\"failed\",\"title\":\"test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"duration\":5,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/apps/control-app/src/tickets.ts:737:26)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts:436:27\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794267920337,\"endTime\":1794267920373,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\",\"status\":\"passed\",\"title\":\"test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794267920337,\"endTime\":1794267920400,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_site_asset_import_rights_gate.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "test_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears",
          "file": "",
          "status": "failed"
        },
        {
          "name": "test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": [],
      "synthetic": true
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 2,
      "failed": 8,
      "total": 8,
      "failures": [
        {
          "test_name": "AC-2017 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2017 'A promotion that lands makes one draft-journal entry naming the asset, so the assistant's next turn is told a picture arrived' (uid=acceptance_criterion-b85050fa) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2017.",
          "ac_uid": "acceptance_criterion-b85050fa",
          "ac_id": "AC-2017",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2015 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2015 'A promotion that lands records exactly the site it landed on in the material's placement list, once per site, listing every site it is on' (uid=acceptance_criterion-c8c0375c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2015.",
          "ac_uid": "acceptance_criterion-c8c0375c",
          "ac_id": "AC-2015",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2016 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2016 'A file handed over as background while a site is open, and a promotion that failed softly, record no placement and keep the material' (uid=acceptance_criterion-88695277) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2016.",
          "ac_uid": "acceptance_criterion-88695277",
          "ac_id": "AC-2016",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1711 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1711 'Promotion never replaces an asset already live: a free name preserving the extension is used and reported' (uid=acceptance_criterion-98f8f69e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1711.",
          "ac_uid": "acceptance_criterion-98f8f69e",
          "ac_id": "AC-1711",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1709 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1709 'A file handed over for a selected site is in that site's asset library when the hand-over returns, as a copy on the public side, under the name reported back' (uid=acceptance_criterion-9b6e19ad) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1709.",
          "ac_uid": "acceptance_criterion-9b6e19ad",
          "ac_id": "AC-1709",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1710 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1710 'Material whose rights record forbids republishing is refused promotion by every route, with nothing written to the site' (uid=acceptance_criterion-9522297b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1710.",
          "ac_uid": "acceptance_criterion-9522297b",
          "ac_id": "AC-1710",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1712 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1712 'A placement that cannot complete is reported as a named failure on a successful hand-over, and the file is not lost' (uid=acceptance_criterion-55dc5a6c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1712.",
          "ac_uid": "acceptance_criterion-55dc5a6c",
          "ac_id": "AC-1712",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1713 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1713 'Material with no file behind it is refused promotion rather than publishing an empty asset' (uid=acceptance_criterion-69086cc3) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1713.",
          "ac_uid": "acceptance_criterion-69086cc3",
          "ac_id": "AC-1713",
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
        "category": "test_failure",
        "field": "test results",
        "message": "8 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 8
        }
      }
    ]
  }
}