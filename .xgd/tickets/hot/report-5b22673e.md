---
uid: report-5b22673e
id: REPORT-12036
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T22:18:26.728599+00:00'
updated_at: '2026-11-09T22:18:26.728599+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-58b2cec4
  parent_report_uid: report-45273bd1
  batch_index: '0'
---

I fixed all four tests in this batch by changing only the test file `tests/reconciliation-assistant-sees-a-stored-picture.test.ts`. No production code was touched.

**What was wrong:** the fake browser in this file threw away every script the code ran in the page. So the tests could not see how a picture's bytes reached the browser, and they still looked for the bytes in the address the browser was sent to. Since BUG-80, that address is a fixed, empty page and the bytes are sent afterwards in pieces, so those checks failed.

**The fix:**
- The fake browser now records every script it is asked to run, the same way `tests/reconciliation-stored-picture-delivery.test.ts` already does.
- A new helper groups those scripts into one entry per picture: the pieces of picture data in order, plus the final script that puts them into the image and decodes it.
- A second helper checks the BUG-80 rules for each picture the browser had to convert:
  - the browser is sent to the same short empty page every time, holding only an empty `<img id="stored">`, with no picture data and no web address in it;
  - the pieces joined together equal the picture's base64 exactly;
  - the decode script uses the picture's own media type and never `application/octet-stream`.
- Each test now uses that helper for its own pictures:
  - **AC-2485:** the JPEG, as `image/jpeg`.
  - **AC-2486:** the SVG drawing, as `image/svg+xml`.
  - **AC-2490:** both JPEG sides of the comparison, as `image/jpeg`, now requiring exactly two conversions.
  - **AC-2489:** the GIF and AVIF assets, as `image/gif` and `image/avif`.
- Every other check in these tests is unchanged: PNGs passed through without a browser, browser counts, size reduction, the "would not decode" refusal, the drawing caption, the refusal of `after`, and the content types. I also updated the file's header comment to describe the new delivery.

**Results:** I ran this file and the delivery test file with vitest. This file passed in full, including AC-2483 through AC-2490. In the delivery file, AC-2564 and AC-2566 pass.

**Still failing:** `test_UAT_AC2565_…` in the delivery file is not in this batch and I did not touch it. It fails because a failed screenshot comes back as the browser's raw error instead of a refusal. That is the code gap already recorded under BUG-80: the screenshot call and the browser lease sit outside the error-wrapping block in `rasterizeImage`. Fixing it needs a production code change, which this mode forbids.

**Not run:** I couldn't run lint or a type-check. `npx eslint` failed because the package registry is blocked by the sandbox, and `npx tsc` failed because there is no `tsconfig.json` at the repository root. Vitest compiled the file without errors, but that is not a full type-check.

I made no ticket changes: AC-2485 already describes the delivery-channel behaviour the tests now check.

```yaml
## Assessment
status: fixed
files_changed:
  - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
tests_fixed:
  - test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused
  - test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read
  - test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif
  - test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical
upstream_changes: none
out_of_batch_observation: "AC-2565 (delivery file) fails because driver.screenshot and the lease in rasterizeImage are outside the wrapped try; this is a production change blocked by code_frozen and not part of this batch."
lint_and_typecheck: "not run: eslint could not be fetched (registry blocked by the sandbox); no tsconfig.json at the repository root"
```