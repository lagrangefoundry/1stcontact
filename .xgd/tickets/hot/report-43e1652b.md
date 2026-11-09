---
uid: report-43e1652b
id: REPORT-11970
type: report
title: 'Scoped quality: pass (55 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T17:43:10.950792+00:00'
updated_at: '2026-11-09T17:43:10.950792+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-d0a8cfad
  commit: 76d720a71c1c1eaa734a530ac691e09f08035f01
---

{
  "timestamp": "2026-11-09T17:38:10.642229Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0002977503463625908,
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
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 27.486428083851933,
      "passed": 55,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 55,
      "deselected": 12,
      "test_filter": [
        "test_UAT_AC1009_",
        "test_UAT_AC1010_",
        "test_UAT_AC1011_",
        "test_UAT_AC1012_",
        "test_UAT_AC1124_",
        "test_UAT_AC1125_",
        "test_UAT_AC1126_",
        "test_UAT_AC1127_",
        "test_UAT_AC1128_",
        "test_UAT_AC1622_",
        "test_UAT_AC2529_",
        "test_UAT_AC2530_",
        "test_UAT_AC2531_",
        "test_UAT_AC2532_",
        "test_UAT_AC2533_",
        "test_UAT_AC682_",
        "test_UAT_AC683_",
        "test_UAT_AC684_",
        "test_UAT_AC685_",
        "test_UAT_AC686_",
        "test_UAT_AC687_",
        "test_UAT_AC688_",
        "test_UAT_AC723_",
        "test_UAT_AC725_",
        "test_UAT_AC726_",
        "test_UAT_AC727_",
        "test_UAT_AC728_",
        "test_UAT_AC801_",
        "test_UAT_AC802_",
        "test_UAT_AC803_",
        "test_UAT_AC804_",
        "test_UAT_AC805_",
        "test_UAT_AC806_",
        "test_UAT_AC807_",
        "test_UAT_AC829_",
        "test_UAT_AC830_",
        "test_UAT_AC831_",
        "test_UAT_AC832_",
        "test_UAT_AC849_",
        "test_UAT_AC850_",
        "test_UAT_AC851_",
        "test_UAT_AC888_",
        "test_UAT_AC889_",
        "test_UAT_AC890_",
        "test_UAT_AC891_",
        "test_UAT_AC933_",
        "test_UAT_AC934_",
        "test_UAT_AC935_",
        "test_UAT_AC936_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "686 out-of-range, oversize, and freeform documents are rejected by the envelope\"],\"fullName\":\"AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope test_UAT_AC686_envelope_boundary_is_the_range_not_the_property\",\"status\":\"passed\",\"title\":\"test_UAT_AC686_envelope_boundary_is_the_range_not_the_property\",\"duration\":11.576000000000931,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-687 a rejected document returns the full list of per-field errors\"],\"fullName\":\"AC-687 a rejected document returns the full list of per-field errors test_UAT_AC687_multiple_violations_all_reported_with_path_and_message\",\"status\":\"passed\",\"title\":\"test_UAT_AC687_multiple_violations_all_reported_with_path_and_message\",\"duration\":0.5254999999997381,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-688 the spike renders equivalently across chromium, webkit, and firefox\"],\"fullName\":\"AC-688 the spike renders equivalently across chromium, webkit, and firefox test_UAT_AC688_no_layout_divergence_across_three_engines\",\"status\":\"passed\",\"title\":\"test_UAT_AC688_no_layout_divergence_across_three_engines\",\"duration\":9748.886125,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-723 a slot leaf renders as an inert placeholder naming its behavior module\"],\"fullName\":\"AC-723 a slot leaf renders as an inert placeholder naming its behavior module test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped\",\"status\":\"passed\",\"title\":\"test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped\",\"duration\":0.8529170000001614,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794245898918,\"endTime\":1794245918654.853,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-l1-substrate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor\"],\"fullName\":\"AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor test_UAT_AC1009_unwrappable_run_floors_its_captured_width_while_a_wrapping_run_keeps_it_fixed\",\"status\":\"passed\",\"title\":\"test_UAT_AC1009_unwrappable_run_floors_its_captured_width_while_a_wrapping_run_keeps_it_fixed\",\"duration\":14.043749999999818,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor\"],\"fullName\":\"AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor test_UAT_AC1009_longer_copy_grows_the_floored_box_instead_of_vanishing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1009_longer_copy_grows_the_floored_box_instead_of_vanishing\",\"duration\":971.3294170000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1010 \u2014 the floor is gated by wrap threshold and by node kind\"],\"fullName\":\"AC-1010 \u2014 the floor is gated by wrap threshold and by node kind test_UAT_AC1010_floor_begins_at_the_wrap_threshold_and_never_reaches_a_container\",\"status\":\"passed\",\"title\":\"test_UAT_AC1010_floor_begins_at_the_wrap_threshold_and_never_reaches_a_container\",\"duration\":4.1481659999999465,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1011 \u2014 a relaxed rung also releases its fixed width\"],\"fullName\":\"AC-1011 \u2014 a relaxed rung also releases its fixed width test_UAT_AC1011_every_floored_rung_resets_its_width_so_no_lower_segment_extrapolation_survives\",\"status\":\"passed\",\"title\":\"test_UAT_AC1011_every_floored_rung_resets_its_width_so_no_lower_segment_extrapolation_survives\",\"duration\":0.6259169999993901,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1011 \u2014 a relaxed rung also releases its fixed width\"],\"fullName\":\"AC-1011 \u2014 a relaxed rung also releases its fixed width test_UAT_AC1011_each_rung_measures_at_its_own_floor_never_the_extrapolation\",\"status\":\"passed\",\"title\":\"test_UAT_AC1011_each_rung_measures_at_its_own_floor_never_the_extrapolation\",\"duration\":4867.2850419999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1012 \u2014 the relaxation is invisible for content that has not been edited\"],\"fullName\":\"AC-1012 \u2014 the relaxation is invisible for content that has not been edited test_UAT_AC1012_floored_and_fixed_stylesheets_differ_only_in_their_width_declarations\",\"status\":\"passed\",\"title\":\"test_UAT_AC1012_floored_and_fixed_stylesheets_differ_only_in_their_width_declarations\",\"duration\":1.1182079999998678,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1012 \u2014 the relaxation is invisible for content that has not been edited\"],\"fullName\":\"AC-1012 \u2014 the relaxation is invisible for content that has not been edited test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed\",\"status\":\"passed\",\"title\":\"test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed\",\"duration\":9591.195291999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794245896681,\"endTime\":1794245912131.1953,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-nowrap-width-floor.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"duration\":4.3552920000001905,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounting_weakens_no_dimension\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794245896683,\"endTime\":1794245896687.3552,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/req93-l1-slot-mounted-behaviors.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-d0a8cfad \u2014 the authoring path is held to the L1 safety envelope test_UAT_AC849_authored_page_body_clears_the_envelope_on_every_consuming_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d0a8cfad \u2014 the authoring path is held to the L1 safety envelope test_UAT_AC850_range_url_over_cap_and_duplicate_id_each_rejected_when_authored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d0a8cfad \u2014 the authoring path is held to the L1 safety envelope test_UAT_AC851_emitter_neutralisation_and_authoring_validation_catch_different_classes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-806 a control leaf renders the module element painted entirely by L1 test_UAT_AC806_module_attributes_survive_while_l1_paints_the_element",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-807 the safety envelope survives the L1-wraps-module inversion test_UAT_AC807_control_attributes_are_refused_or_escaped_and_nothing_goes_live",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-829 a node paints a repeating texture from a typed axis with no asset test_UAT_AC829_each_shape_is_drawn_by_the_renderer_from_its_typed_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-830 a gradient is linear or radial and the branches cannot be mixed test_UAT_AC830_radial_carries_its_own_axes_and_linear_stays_the_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-831 texture composes with fill, gradient, scrim and image in a defined layer order test_UAT_AC831_five_axes_paint_as_ordered_layers_and_untextured_pages_are_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-832 the envelope bounds the texture period, width and colour test_UAT_AC832_texture_violations_are_rejected_with_the_offending_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2529_manifest_render_emits_srcset_and_computed_sizes_and_plain_render_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2530_laddered_img_carries_the_measured_intrinsic_width_and_height",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2531_background_ladder_bases_on_the_smallest_width_and_overrides_only_where_the_choice_changes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2532_per_width_background_override_restates_the_whole_layer_stack_and_never_drops_the_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2533_document_carries_no_delivery_fields_and_rendition_urls_pass_url_safety",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1124 a picture declares which part of itself its box shows test_UAT_AC1124_object_position_is_a_pair_or_nothing_and_image_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1125 a node paints a typed colour adjustment as one declaration in a fixed order test_UAT_AC1125_colour_adjustment_emits_one_ordered_declaration_on_every_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1126 an adjustment at its identity emits nothing, per function test_UAT_AC1126_identity_is_skipped_per_function_and_the_opposite_extreme_is_emitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1127 a typed shape names an intent and never geometry test_UAT_AC1127_renderer_drawn_shapes_are_bounded_and_a_blob_is_seed_deterministic",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1128 the envelope bounds a colour adjustment through the shared surface check test_UAT_AC1128_adjustment_bounds_apply_to_base_and_interaction_states_alike",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-725 typed pixel-mover axes render as CSS re-derived from their typed fields test_UAT_AC725_structured_axes_emit_derived_css_and_identity_values_are_omitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-726 malformed structured axes are rejected by the envelope test_UAT_AC726_structured_axis_violations_rejected_with_offending_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-727 a document font resource table binds a family handle to its served face test_UAT_AC727_resource_table_emits_font_face_rules_ahead_of_use_and_binds_the_face",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-727 a document font resource table binds a family handle to its served face test_UAT_AC727_bound_face_paints_at_its_own_glyph_metrics_in_a_real_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-728 font resource entries are scheme-checked and weight-bounded by the envelope test_UAT_AC728_font_entry_scheme_and_weight_violations_rejected_with_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-933 a rendered page emits no colour custom property, and exactly one colour system survives test_UAT_AC933_no_colour_custom_property_is_declared_or_referenced_anywhere_the_renderer_emits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-934 page background and inherited text colour are L1 document fields, validated as colour axes test_UAT_AC934_document_page_colours_validate_as_colour_axes_and_emit_as_body_rules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-935 no closed colour-role vocabulary survives in the schema, in a definition, or on a layer test_UAT_AC935_colour_role_vocabulary_is_absent_from_the_schema_surface_and_from_every_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-936 the non-colour token groups validate and emit exactly as before the colour cut test_UAT_AC936_every_surviving_token_group_still_emits_and_sparse_themes_are_default_filled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-888 a rendered snapshot is relocatable test_UAT_AC888_root_relative_references_are_emitted_document_relative_and_serve_under_a_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-889 only a root-relative reference changes shape test_UAT_AC889_absolute_protocol_relative_fragment_and_relative_references_emerge_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-890 an empty or colon-bearing first segment keeps its base test_UAT_AC890_root_fragment_query_and_colon_references_resolve_against_the_snapshot_root",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-891 a nested page slug fails the render loudly test_UAT_AC891_nested_page_slug_is_rejected_before_anything_is_written_and_flat_sites_are_unaffected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-685 injection payloads in content values are inert in the rendered output test_UAT_AC685_structured_axis_and_resource_table_payloads_emit_no_raw_css",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-801 a painted, internally laid-out element is a single node test_UAT_AC801_one_container_carries_both_the_surface_and_its_layout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-802 every node kind admits the same shared axis groups test_UAT_AC802_shared_groups_accepted_identically_and_strictly_on_every_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-803 a text run declares its own measure and the layout gate wraps against it test_UAT_AC803_measured_run_emits_its_width_and_the_gate_narrows_the_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-804 a behavior-module seam can be measured through the slot itself test_UAT_AC804_measured_slot_emits_its_width_and_needs_no_wrapper",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-805 a background image on any node kind binds to the mirrored asset test_UAT_AC805_background_handles_resolve_site_local_on_every_kind_or_are_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-682 well-formed L1 document accepted as a typed layout tree test_UAT_AC682_valid_document_and_optional_primitives_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_varies_continuously_and_snap_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-685 injection payloads in content values are inert in the rendered output test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope test_UAT_AC686_envelope_boundary_is_the_range_not_the_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-687 a rejected document returns the full list of per-field errors test_UAT_AC687_multiple_violations_all_reported_with_path_and_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-688 the spike renders equivalently across chromium, webkit, and firefox test_UAT_AC688_no_layout_divergence_across_three_engines",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-723 a slot leaf renders as an inert placeholder naming its behavior module test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor test_UAT_AC1009_unwrappable_run_floors_its_captured_width_while_a_wrapping_run_keeps_it_fixed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor test_UAT_AC1009_longer_copy_grows_the_floored_box_instead_of_vanishing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1010 \u2014 the floor is gated by wrap threshold and by node kind test_UAT_AC1010_floor_begins_at_the_wrap_threshold_and_never_reaches_a_container",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1011 \u2014 a relaxed rung also releases its fixed width test_UAT_AC1011_every_floored_rung_resets_its_width_so_no_lower_segment_extrapolation_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1011 \u2014 a relaxed rung also releases its fixed width test_UAT_AC1011_each_rung_measures_at_its_own_floor_never_the_extrapolation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1012 \u2014 the relaxation is invisible for content that has not been edited test_UAT_AC1012_floored_and_fixed_stylesheets_differ_only_in_their_width_declarations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1012 \u2014 the relaxation is invisible for content that has not been edited test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder",
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
  }
}