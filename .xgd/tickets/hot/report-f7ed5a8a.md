---
uid: report-f7ed5a8a
id: REPORT-11606
type: report
title: 'Report: batch_quality_check for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:53:12.957133+00:00'
updated_at: '2026-11-08T22:53:12.957133+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-58b2cec4
  parent_report_uid: report-7367338f
  batch_index: 1
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T22:48:43.626907Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 6.8351550828665495,
      "passed": 42,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 42,
      "deselected": 17,
      "test_filter": [
        "test_UAT_AC2479_",
        "test_UAT_AC2477_",
        "test_UAT_AC2478_",
        "test_UAT_AC2480_",
        "test_UAT_AC2481_",
        "test_UAT_AC2482_",
        "test_UAT_FC_REQ-216_",
        "test_UAT_AC2025_",
        "test_UAT_AC2027_",
        "test_UAT_AC2028_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "sitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_name_nothing_carries_is_refused_and_the_page_says_what_is_there\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_name_nothing_carries_is_refused_and_the_page_says_what_is_there\",\"duration\":19.851292000000058,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_name_several_things_carry_is_refused_rather_than_guessed\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_name_several_things_carry_is_refused_rather_than_guessed\",\"duration\":10.360167000000047,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_an_interaction_that_changed_nothing_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_an_interaction_that_changed_nothing_is_refused\",\"duration\":113.06345800000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value\",\"duration\":112.96470799999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it\",\"duration\":109.50954200000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_value_a_field_cannot_hold_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_value_a_field_cannot_hold_is_refused\",\"duration\":8.053874999999834,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_field_nothing_is_called_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_field_nothing_is_called_is_refused_by_name\",\"duration\":9.89958300000012,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the state a visitor reaches by doing something\"],\"fullName\":\"REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_the_first_failure_stops_the_run\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_the_first_failure_stops_the_run\",\"duration\":11.42191600000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the shutter opens on the state that was asked for\"],\"fullName\":\"REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_the_picture_is_taken_after_the_steps_have_happened\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_the_picture_is_taken_after_the_steps_have_happened\",\"duration\":121.29200000000014,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the shutter opens on the state that was asked for\"],\"fullName\":\"REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_an_undriven_picture_is_of_the_page_as_it_arrives\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_an_undriven_picture_is_of_the_page_as_it_arrives\",\"duration\":8.26237500000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the shutter opens on the state that was asked for\"],\"fullName\":\"REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_a_driven_page_is_laid_out_at_the_width_it_is_driven_at\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_driven_page_is_laid_out_at_the_width_it_is_driven_at\",\"duration\":115.84074999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the shutter opens on the state that was asked for\"],\"fullName\":\"REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_a_step_that_could_not_be_done_yields_no_picture_at_all\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_step_that_could_not_be_done_yields_no_picture_at_all\",\"duration\":5.654332999999951,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 the shutter opens on the state that was asked for\"],\"fullName\":\"REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_a_refusal_carries_the_declared_code\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_refusal_carries_the_declared_code\",\"duration\":7.777540999999928,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 only your own draft can be driven\"],\"fullName\":\"REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_edit_picture_refuses_to_be_driven\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_edit_picture_refuses_to_be_driven\",\"duration\":0.2966670000000704,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 only your own draft can be driven\"],\"fullName\":\"REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_reference_picture_refuses_to_be_driven\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_reference_picture_refuses_to_be_driven\",\"duration\":0.156833000000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 only your own draft can be driven\"],\"fullName\":\"REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_revision_picture_refuses_to_be_driven\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_revision_picture_refuses_to_be_driven\",\"duration\":0.14487499999995634,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 only your own draft can be driven\"],\"fullName\":\"REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_url_picture_refuses_to_be_driven\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_url_picture_refuses_to_be_driven\",\"duration\":0.1334999999999127,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 only your own draft can be driven\"],\"fullName\":\"REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_the_edit_refusal_says_why_that_channel_cannot_be_driven\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_the_edit_refusal_says_why_that_channel_cannot_be_driven\",\"duration\":0.13120799999978772,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 only your own draft can be driven\"],\"fullName\":\"REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_phrase_that_cannot_be_read_is_refused_before_a_browser\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_phrase_that_cannot_be_read_is_refused_before_a_browser\",\"duration\":0.10920899999973699,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 a picture says what its channel does not do\"],\"fullName\":\"REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_an_edit_picture_says_its_behaviour_is_off\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_an_edit_picture_says_its_behaviour_is_off\",\"duration\":5.829416999999921,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 a picture says what its channel does not do\"],\"fullName\":\"REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_a_draft_picture_carries_no_such_caption\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_draft_picture_carries_no_such_caption\",\"duration\":6.743084000000181,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 a picture says what its channel does not do\"],\"fullName\":\"REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_a_measurement_against_that_channel_carries_the_caveat\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_a_measurement_against_that_channel_carries_the_caveat\",\"duration\":19.721875000000182,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 a picture says what its channel does not do\"],\"fullName\":\"REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_the_caption_travels_on_the_block_the_model_reads\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_the_caption_travels_on_the_block_the_model_reads\",\"duration\":4.99979200000007,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 what the surface tells the model it can do\"],\"fullName\":\"REQ-216 \u2014 what the surface tells the model it can do test_UAT_FC_REQ-216_the_declaration_offers_the_steps_and_still_validates\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_the_declaration_offers_the_steps_and_still_validates\",\"duration\":29.858208000000104,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 what the surface tells the model it can do\"],\"fullName\":\"REQ-216 \u2014 what the surface tells the model it can do test_UAT_FC_REQ-216_every_picture_taking_operation_can_report_the_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_every_picture_taking_operation_can_report_the_refusal\",\"duration\":0.3631249999998545,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-216 \u2014 what the surface tells the model it can do\"],\"fullName\":\"REQ-216 \u2014 what the surface tells the model it can do test_UAT_FC_REQ-216_the_absences_say_that_a_selector_is_not_a_name\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-216_the_absences_say_that_a_selector_is_not_a_name\",\"duration\":0.07695800000010422,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794178126237,\"endTime\":1794178127387.077,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_UAT_FC_REQ-216_drive_the_page.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased",
          "file": "",
          "status": "passed"
        },
        {
          "name": "steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 naming what to do, the way a person would test_UAT_FC_REQ-216_the_two_forms_are_read_as_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 naming what to do, the way a person would test_UAT_FC_REQ-216_a_quoted_name_may_contain_the_word_with",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 naming what to do, the way a person would test_UAT_FC_REQ-216_the_steps_keep_the_order_they_were_written_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 naming what to do, the way a person would test_UAT_FC_REQ-216_anything_that_is_not_one_of_the_two_forms_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_activating_the_named_control_opens_the_panel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_control_inside_a_closed_panel_is_not_reachable_yet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_steps_are_carried_out_in_the_order_they_were_given",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_name_nothing_carries_is_refused_and_the_page_says_what_is_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_name_several_things_carry_is_refused_rather_than_guessed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_an_interaction_that_changed_nothing_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_value_a_field_cannot_hold_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_a_field_nothing_is_called_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the state a visitor reaches by doing something test_UAT_FC_REQ-216_the_first_failure_stops_the_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_the_picture_is_taken_after_the_steps_have_happened",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_an_undriven_picture_is_of_the_page_as_it_arrives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_a_driven_page_is_laid_out_at_the_width_it_is_driven_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_a_step_that_could_not_be_done_yields_no_picture_at_all",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 the shutter opens on the state that was asked for test_UAT_FC_REQ-216_a_refusal_carries_the_declared_code",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_edit_picture_refuses_to_be_driven",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_reference_picture_refuses_to_be_driven",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_revision_picture_refuses_to_be_driven",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_url_picture_refuses_to_be_driven",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_the_edit_refusal_says_why_that_channel_cannot_be_driven",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 only your own draft can be driven test_UAT_FC_REQ-216_a_phrase_that_cannot_be_read_is_refused_before_a_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_an_edit_picture_says_its_behaviour_is_off",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_a_draft_picture_carries_no_such_caption",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_a_measurement_against_that_channel_carries_the_caveat",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 a picture says what its channel does not do test_UAT_FC_REQ-216_the_caption_travels_on_the_block_the_model_reads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 what the surface tells the model it can do test_UAT_FC_REQ-216_the_declaration_offers_the_steps_and_still_validates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 what the surface tells the model it can do test_UAT_FC_REQ-216_every_picture_taking_operation_can_report_the_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-216 \u2014 what the surface tells the model it can do test_UAT_FC_REQ-216_the_absences_say_that_a_selector_is_not_a_name",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    }
  },
  "overall": {
    "status": "success",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}