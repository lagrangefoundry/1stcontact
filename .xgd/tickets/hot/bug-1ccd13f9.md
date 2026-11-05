---
uid: bug-1ccd13f9
id: BUG-347
type: bug
title: AnimateImage 2 MB size limit caps pingpong clips at ~6 s, so "make the loop
  slower" can't be done
created_by: xgd
created_at: '2026-11-04T22:18:27.567154+00:00'
updated_at: '2026-11-04T23:32:15.729347+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-81224b98
  commits:
  - working_sha: 6dc06a26a7b818424a94f41c5ac6b112aa16bb1b
    reconcile_sha: null
    main_sha: null
  version: 0.2.765
  story_points: 1
---

Follows BUG-336 (limit raised to 2,000,000 bytes; that ticket is now frozen).

**Doing:** remaking a hero ping-pong clip longer so the camera drift reads slower.

**Call:** AnimateImage mode=pingpong, camera=slow_orbit, resolution=540p, duration=10.

**Got:** over_size_limit. Measured 3,055,003 bytes at 540p; nothing stored; generation still charged. Host estimates ≤6 s fits. A 5 s pingpong at 540p was 1,095,494 bytes.

**Problem:** going from 5 s to 6 s barely changes the speed, so a longer, slower loop can't be made. Duration can't be used for its main purpose.

**Suggestions:** re-encode at higher compression (CRF / lower bitrate) before rejecting; offer a 360p step; or raise the limit for hero clips to about 3.5 MB. Also: check the size *estimate* before generating, so an over-limit request is refused before it is paid for.


---

## Decision (operator, EPIC-19 session, 2026-11-04)

**The 2,000,000-byte clip budget stays.** A hero clip is the first thing a phone downloads, so length won't be bought with page weight.

- **The fix for longer loops is a lower bitrate, not a bigger budget:** lagrange-framework **REQ-237** ("videogen: lower the bitrate before lowering the resolution"). Today's encoder runs at about 2.4 Mbps at 540p for a slow pan, far more than a near-static clip needs. With quality rungs, a 10 s pingpong should fit 2 MB at 540p or 720p.
- **Until REQ-237 lands, this ticket's 1stcontact part is guidance:** the consultant's AnimateImage notes say a looping clip fits the budget at about **6 s or less** (pingpong at 540p), so a client asking for "slower" is offered a slower camera move in a ≤6 s loop. It doesn't retry at 8–10 s, because each failure is a paid generation and several minutes' wait. (The 2026-11-04 attempt ran 6.5 min before failing.)
- **When REQ-237 lands,** update that guidance to the new limit it achieves (measured, not assumed), and this ticket is done.

## Test plan

`test_UAT_FC_BUG-347_*`: the consultant's priming or AnimateImage notes state the ≤6 s pingpong guidance. The tool description or result names the budget, so a 10 s pingpong request is either advised against before generation or, if attempted, fails with advice naming ≤6 s.



## What landed (2026-11-04, interim guidance — REQ-237 follow-up still open)

- `apps/control-app/src/videogen.ts` `videoGuidance()` (appended to the `animate_image` description, not the priming) now says: a clip must fit 2 MB (2,000,000 bytes), which holds a looping clip of about 6 s or less (pingpong at 540p); when a client wants a slower loop, offer a slower camera move in a loop of 6 s or less, not a longer clip; do not try 8–10 s, because an over-limit clip is refused only after it is made, minutes later, and still counts towards the client's clips. No price is mentioned.
- If a longer clip is attempted anyway, the existing framework `over_size_limit` error already names the length that fits (for the measured 3,055,003-byte 10 s pingpong: "at most 6 s should fit at 540p"). This is now pinned by a UAT here.
- No pre-generation size refusal was added: size is measured only after generation, so refusing beforehand would mean guessing. The guidance is how a 10 s request is advised against before it is paid for.
- **Still to do (closes the ticket):** when lagrange-framework REQ-237 lands, measure the new length that fits 2 MB and update the 6 s figure and these UATs.

## UATs

`tests/test_UAT_FC_BUG-347_loop_length_guidance.workers.test.ts`
- `the_tool_description_names_the_budget_and_a_six_second_loop`
- `an_attempted_ten_second_pingpong_is_refused_with_advice_naming_six_seconds` (fake fal serves a 3,055,003-byte clip; refused with `over_size_limit`, message names 2000000 bytes and "at most 6 s should fit at 540p", nothing stored)