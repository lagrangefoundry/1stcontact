---
uid: comment-879888cd
id: COMMENT-8044
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T23:09:39.663167+00:00'
updated_at: '2026-11-08T23:09:39.663167+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4f50681d
  kind: note
---

UATs generated for story story-58b2cec4 (plan item 4 of 8)

Story: story-58b2cec4
Test file(s) created:
  - tests/reconciliation-assistant-sees-a-stored-picture.test.ts

Tests written: 10
Tests passed: 9
Tests failed: 1

⚠️ TESTS FAILING — downstream fix-it loop required

**Scope.** An earlier pass of this story created `tests/reconciliation-assistant-drives-the-draft.test.ts` (commit 57ead52b9a), which covers AC-2477 to AC-2482. This pass writes UATs for the stored-picture ACs: the seven new ones (AC-2483 to AC-2489) and the stored-picture changes to three ACs that already had tests (AC-2026, AC-2027, AC-2028). Their existing tests in `tests/reconciliation-assistant-looking-surface.test.ts` don't check those changes. I couldn't edit that file, so the new checks are in the new file, which leaves those three ACs with two UATs each.

**How the tests run.** Every test goes through the consultant's composed Toolbox. The stored pictures are assembled with `mergeImageLibraries`, `siteImageLibrary` and `materialImageLibrary`, the same way `router.ts` does it. The AC-2487 CLI part builds its surface from the CLI's own `nodeDeps({ cwd, origin })`. Only two things are doubled: the browser and the D1 ticket store.

**Results.**

| Test | Result |
|---|---|
| `test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image` | pass |
| `test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title` | pass |
| `test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser` | pass |
| `test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded` | pass |
| `test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets` | pass |
| `test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused` | pass |
| `test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read` | pass |
| `test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment` | **fail** (code differs from the AC) |
| `test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict` | pass |
| `test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif` | pass |

Failures:
  - test_UAT_AC2487_…: the AC is right and the code doesn't do what it says. I didn't weaken the assertions; they use `expect.soft`, so both problems show up in one run.
    1. **The CLI doesn't say it has no Library.** Asking the CLI for a Library name returns the general not-found message, which tells the model to use "the name it appears under in the Library". That points it at a Library this host doesn't have. The story already flags this ("the CLI host does not say it holds no Library").
    2. **The missing-image-store refusal has no `ENVIRONMENT` code.** The model gets `Error: screenshot failed. this deployment holds no pictures…`. Coded refusals normally read `Error: screenshot failed (CODE).`, and the AC requires `ENVIRONMENT`. The cause: `PictureEnvironmentError` in `tools/generate/src/cli/picture.ts` has no `code`, and nothing maps it to `ENVIRONMENT`. The story doesn't flag this one yet.

**Not checked:** lint and type-check.
- `npx eslint` failed because the sandbox blocked the npm registry download.
- The repo has no tsconfig that covers `tests/`, so I couldn't run `tsc`. Vitest compiled and ran the file without errors.

No production code, existing tests or tickets were changed, and nothing was committed.

test_files_created:
  - "tests/reconciliation-assistant-sees-a-stored-picture.test.ts"