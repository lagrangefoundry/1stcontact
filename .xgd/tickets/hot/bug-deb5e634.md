---
uid: bug-deb5e634
id: BUG-336
type: bug
title: AnimateImage always exceeds 1,000,000-byte clip budget; duration parameter
  has no effect on output size
created_by: xgd
created_at: '2026-11-03T22:54:25.536789+00:00'
updated_at: '2026-11-04T16:06:46.524785+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-08293214
  commits:
  - working_sha: 96a09b7de128e1b65451584f05b7a1776b3fcde6
    reconcile_sha: null
    main_sha: null
  version: 0.2.752
  story_points: 1
---

> **Status: unblocked and done (2026-11-04).** lagrange-framework BUG-106 (`7426209d72`) and BUG-107 (`20d722c569`) are on lagrange-framework's xgd-working, and the shared `@lagrangefoundry/videogen` / `ai-videogen` store that 1stcontact bundles from contains both (the trim step and the new over-size advice).
> - lagrange-framework BUG-106: videogen delivers the requested duration (item 1 below).
> - lagrange-framework BUG-107: ai_videogen over_size_limit advice (item 2 below).
> - **This ticket's own scope is item 3 only:** raise 1stcontact's clip byte budget to 2,000,000 bytes. Items 1 and 2 are kept below for context and are done in lagrange-framework, never from a 1stcontact branch.

**What I was doing:** Making a hero clip with AnimateImage from a placed library photo (1500×704 JPEG), mode `pingpong`, camera `locked`.

**Expected:** A clip stored on a new ticket. Failing that, a shorter `duration` should get under the size budget, as the error message suggests ("A shorter clip is smaller — ask for fewer seconds").

**What happened:** All three attempts failed with `over_size_limit`, and nothing was stored:
- duration 5, resolution 1080p: 1080p → 4,284,127 B, 720p → 2,533,824 B, 540p → 1,590,383 B
- duration 3, resolution 540p: 540p → 1,545,896 B
- duration 2, resolution 540p: 540p → 1,606,597 B

At 540p the output size stays about the same (~1.5–1.6 MB) whether duration is 2, 3 or 5. So either `duration` isn't passed to the generator, or the pingpong assembly (forward + reverse) fixes the length. Even the lowest tier can't fit under the deployment's 1,000,000-byte budget, so the error's advice can't be followed and no pingpong clip can be made at all.

**Repro:** AnimateImage with any ~1500px-wide photo, mode=pingpong, duration=2, resolution=540p.

**Suggested:** Respect `duration` in the generated clip, re-encode at a lower bitrate before rejecting, or raise the budget. ~1 MB is very tight for a looping hero video. Also, the earlier interrupted attempt (stopped by a deploy) left no trace in the work log result, which made it hard to tell whether the clip had been made.


---

## Diagnosis (EPIC-19 session, 2026-11-03)

The consultant's reading is half right: `duration` really does have no effect, and the pingpong assembly is why. Raising the size limit alone would not fix it.

- **Every pingpong comes out 10 seconds long.** fal's Kling models only generate 5 or 10 seconds (`DEFAULT_DURATIONS = [5, 10]` in `lagrange-framework/components/videogen/js/src/backends/fal.js`). For a pingpong, `generationSeconds()` (`request.js`) asks for half the requested length and rounds it to the nearest offered length, so a request for 2, 3 or 5 seconds always generates 5. The pipeline (`pipeline.js` `postProcess`) then joins the clip with its reverse: 5 + 5 = 10 seconds. Nothing ever cuts the clip to the requested length. That's why the size at 540p doesn't change with `duration`.
- **The size limit is enforced only by lowering resolution** (1080p → 720p → 540p). No quality or bitrate setting is ever lowered; the scale step (`fal-ai/workflow-utilities/scale-video`) is called with `codec: libx264` and nothing else. A 10-second clip is about 1.55 MB even at 540p (about 1.24 Mbps), so a pingpong can never fit under 1 MB.
- **The error's advice is wrong.** "A shorter clip is smaller — ask for fewer seconds" can't work for a pingpong, and every retry pays for a new generation. The Loren session paid for about four clips and got none.
- 1stcontact doesn't set a limit of its own. `apps/control-app/src/videogen.ts` passes the plugin's `byteBudget`, which is the framework default `DEFAULT_BYTE_BUDGET = 1_000_000` (`videogen/js/src/request.js`).

## Fix

1. **Honour the requested length** *(lagrange-framework, `videogen`, JS and Python together)*. Cut the generated clip to the requested length before reversing and joining: a pingpong is `duration / 2` forward plus the same backward, and a non-pingpong clip is `duration`. The compose step that already strips the audio takes a duration per keyframe, so it can do the cut. The delivered clip's measured length must match the requested `duration` (to within a frame), whatever lengths the model offers.
   - Estimated from the figures above: a 4-second pingpong is about 0.6 MB at 540p and about 1.0 MB at 720p.
2. **Fix the over-size error** *(lagrange-framework, `ai_videogen` toolbox)*. The advice must only suggest something that would actually make the clip smaller. Once item 1 lands, "fewer seconds" is true again. Say which lengths were tried, and that the generation was already paid for, so the consultant doesn't retry blindly.
3. **Raise 1stcontact's limit to 2,000,000 bytes** *(this repo)*. Pass `byteBudget: 2_000_000` to the videogen plugin in `apps/control-app/src/videogen.ts`. That lets a 5–6 second pingpong stay at 720p rather than dropping to 540p, which looks soft as a desktop hero. Don't go higher: page weight on phones is the reason the limit exists, and a 10-second 1080p clip is 4.3 MB.
4. **Out of scope:** lowering the encoding bitrate or quality before dropping resolution. That would be the better long-term lever, but fal's scale endpoint has no quality setting. Find out first, as a follow-up.

**Where the work lands:** items 1 and 2 are filed in lagrange-framework as BUG-106 and BUG-107 (2026-11-03), each holding its share of this diagnosis and its own UATs. Item 3 is the only code that lands against BUG-336, and only after 1stcontact is on a framework version with BUG-106. Before that, a larger budget would only let 10-second 540p pingpongs through.

**Before starting:** check both lagrange-framework tickets are landed (`XGD_PROJECT_ROOT=/Users/martin/lagrangefoundry/lagrange-framework xgd ticket get BUG-106`), and that the framework version 1stcontact depends on includes them. If not, stop: this ticket is still blocked.

## Test plan

- **lagrange-framework** (on its own ticket): a UAT where a fake backend returns a 5-second clip for a pingpong request with duration 4 checks that the delivered clip measures 4 seconds. Another checks that a non-pingpong request with duration 3 measures 3 seconds. Both in the JS and Python suites.
- **1stcontact**, `test_UAT_FC_BUG-336_*`: a clip that measures between 1,000,000 and 2,000,000 bytes at the requested resolution is stored, not rejected. A clip over 2,000,000 bytes at every resolution is still refused with `over_size_limit`.

## What changed (item 3, landed)

- `apps/control-app/src/videogen.ts` exports `VIDEO_BYTE_BUDGET = 2_000_000` and passes it as `byteBudget` to `createVideoPlugin`, so the toolbox the site builds uses it. The plugin still steps the resolution down until the clip fits, and refuses with `over_size_limit` when nothing fits. The limit is not a tool parameter; the model cannot change it.
- Test support: `tests/support/fake-fal.ts` gains `clipOfSize(bytes)`, the real fixture clip padded to an exact size with a trailing MP4 `free` box. `fakeFal({ clip })` can now serve it, so the size the pipeline measures is the size under test.

## UATs (`tests/test_UAT_FC_BUG-336_clip_byte_budget.workers.test.ts`)

- `the_limit_is_two_million_bytes`: the deployment's limit is 2,000,000.
- `a_clip_between_one_and_two_million_bytes_is_stored`: a 1,600,000-byte pingpong clip is stored as a `video/mp4` attachment of that size, not refused.
- `a_clip_over_two_million_bytes_at_every_resolution_is_refused`: a 2,000,001-byte clip at every rung fails with `over_size_limit`. The detail names a 2,000,000-byte limit, and no video material is stored.

The two behaviour UATs fail when the `byteBudget` line is removed (checked), and they pass alongside the REQ-461, REQ-468 and REQ-489 clip suites.