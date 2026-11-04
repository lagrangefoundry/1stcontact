---
uid: report-bf465625
id: REPORT-10853
type: report
title: 'Scoped quality: fail (21 tests, 4 failed, 8 orphan AC(s))'
created_by: xgd
created_at: '2026-11-04T16:09:14.894280+00:00'
updated_at: '2026-11-04T16:09:14.894280+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-fde7370b
  commit: baeb9bdded3d8d19ae56a2bd6d0afe89092e3357
---

{
  "timestamp": "2026-11-04T16:03:53.740766Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00043100002221763134,
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
      "duration_seconds": 13.242034708848223,
      "passed": 17,
      "failed": 4,
      "skipped": 0,
      "errors": 0,
      "total": 21,
      "deselected": 26,
      "test_filter": [
        "test_UAT_AC1385_",
        "test_UAT_AC1386_",
        "test_UAT_AC1387_",
        "test_UAT_AC1388_",
        "test_UAT_AC1389_",
        "test_UAT_AC1390_",
        "test_UAT_AC1391_",
        "test_UAT_AC1392_",
        "test_UAT_AC1393_",
        "test_UAT_AC1394_",
        "test_UAT_AC1395_",
        "test_UAT_AC1396_",
        "test_UAT_AC1397_",
        "test_UAT_AC1398_",
        "test_UAT_AC1447_",
        "test_UAT_AC1448_",
        "test_UAT_AC2229_",
        "test_UAT_AC2238_",
        "test_UAT_AC2239_",
        "test_UAT_AC2240_",
        "test_UAT_AC2241_",
        "test_UAT_AC2242_",
        "test_UAT_AC2243_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "3 an L1 subtree round-trips verbatim\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store UAT_FC_REQ-143 the palette surface enforces its rules through the port\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 the palette surface enforces its rules through the port\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store UAT_FC_REQ-143 a rename rewrites site.json and every page referencing it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a rename rewrites site.json and every page referencing it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store UAT_FC_REQ-143 assets move as bytes, never as paths\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 assets move as bytes, never as paths\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store UAT_FC_REQ-143 an asset the operator supplies is taken as bytes\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 an asset the operator supplies is taken as bytes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store UAT_FC_REQ-143 a failure is a CommandError with its envelope intact\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a failure is a CommandError with its envelope intact\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store UAT_FC_REQ-143 the draft assembles and validates from whatever store served it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 the draft assembles and validates from whatever store served it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_a_preview_asset_comes_back_as_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC1385_a_preview_asset_comes_back_as_bytes\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1619_revision_verbs_answer_emptily_before_any_publish\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1619_revision_verbs_answer_emptily_before_any_publish\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\",\"over the D1/R2 store\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1619_a_frozen_revision_lists_reads_back_and_reparents_the_draft\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1619_a_frozen_revision_lists_reads_back_and_reparents_the_draft\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 the losing writer of a concurrent write is refused, and one write survives\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 the losing writer of a concurrent write is refused, and one write survives\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 a write with no expectation is unconditional and still moves the version\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a write with no expectation is unconditional and still moves the version\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 a refused multi-page write leaves no partial state\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a refused multi-page write leaves no partial state\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 a multi-page write that succeeds lands every page at once\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a multi-page write that succeeds lands every page at once\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 a handle for one tenant cannot read or write another tenant s site\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a handle for one tenant cannot read or write another tenant s site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 an unknown or inactive tenant is a typed error, never a silent default\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 an unknown or inactive tenant is a typed error, never a silent default\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 tenancy is bound into the handle, not passed at call sites\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 tenancy is bound into the handle, not passed at call sites\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 asset bytes round-trip through R2 with the right content type\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 asset bytes round-trip through R2 with the right content type\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 a real site imported into D1 assembles identically to the source store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 a real site imported into D1 assembles identically to the source store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 an import lands whole or not at all\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 an import lands whole or not at all\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-143 \u2014 the D1/R2 SiteStore\"],\"fullName\":\"REQ-143 \u2014 the D1/R2 SiteStore UAT_FC_REQ-143 the structured-edit surface drives D1 with no filesystem anywhere\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-143 the structured-edit surface drives D1 with no filesystem anywhere\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793808241744,\"endTime\":1793808241796,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"status\":\"failed\",\"title\":\"test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"duration\":22,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_starter_site_guard.workers.test.ts:89:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"status\":\"failed\",\"title\":\"test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"duration\":7,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_starter_site_guard.workers.test.ts:107:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793808241754,\"endTime\":1793808241788,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_starter_site_guard.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1391_the_filesystem_store_applies_a_version_carrying_write_unconditionally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1397_one_extension_yields_one_content_type_wherever_an_asset_is_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1398_each_declared_binding_names_one_target_across_both_halves_and_the_schema_precedes_upload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1386_a_store_handle_sees_exactly_one_account_and_no_operation_takes_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1388_a_site_version_is_readable_and_advances_on_every_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1389_a_stale_expectation_is_refused_with_both_versions_and_one_racer_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1390_a_refused_multi_part_write_leaves_no_page_definition_or_version_behind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes",
          "file": "",
          "status": "failed"
        },
        {
          "name": "REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_a_preview_asset_comes_back_as_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site",
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
      "passed": 15,
      "failed": 8,
      "total": 23,
      "failures": [
        {
          "test_name": "AC-2243 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2243 'A site's revision id and its change-journal counter remain integer ordinals' (uid=acceptance_criterion-25cd8321) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2243.",
          "ac_uid": "acceptance_criterion-25cd8321",
          "ac_id": "AC-2243",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2242 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2242 'Erasure reaches every site object by enumerating the business's site keys, and forgetting a site removes its rows and objects' (uid=acceptance_criterion-7967e301) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2242.",
          "ac_uid": "acceptance_criterion-7967e301",
          "ac_id": "AC-2242",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2241 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2241 'A slug is unique within its business only, and a move onto a slug the destination already uses is refused by the database' (uid=acceptance_criterion-477aba6b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2241.",
          "ac_uid": "acceptance_criterion-477aba6b",
          "ac_id": "AC-2241",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2240 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2240 'No child row or stored object records the business; renaming a business, changing a slug, or moving a site rewrites one column and copies no object' (uid=acceptance_criterion-4646a3bd) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2240.",
          "ac_uid": "acceptance_criterion-4646a3bd",
          "ac_id": "AC-2240",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2239 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2239 'Every primary key is an opaque random id from one minter: identical inputs yield unrelated keys, and the prefix is only a reading aid' (uid=acceptance_criterion-0035140e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2239.",
          "ac_uid": "acceptance_criterion-0035140e",
          "ac_id": "AC-2239",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2238 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2238 'The schema is one baseline migration that seeds no people, and its platform-business key equals the deployment's configured id' (uid=acceptance_criterion-bae5941a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2238.",
          "ac_uid": "acceptance_criterion-bae5941a",
          "ac_id": "AC-2238",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1392 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1392 'Asset bytes round-trip byte-for-byte including non-text sequences, typed by name, listable and removable' (uid=acceptance_criterion-da75ddf7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1392.",
          "ac_uid": "acceptance_criterion-da75ddf7",
          "ac_id": "AC-1392",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1448 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1448 'A retained assembled draft never outlives nor is misattributed to its site, and never crosses the account barrier' (uid=acceptance_criterion-89fefdc5) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1448.",
          "ac_uid": "acceptance_criterion-89fefdc5",
          "ac_id": "AC-1448",
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
        "message": "4 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 4
        }
      }
    ]
  }
}