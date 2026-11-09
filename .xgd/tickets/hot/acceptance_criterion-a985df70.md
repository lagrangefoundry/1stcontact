---
uid: acceptance_criterion-a985df70
id: AC-2519
type: acceptance_criterion
title: The idle channel is primed once the visible one loads, so the first flip is
  in place; a merely stale frame is not primed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:35.792503+00:00'
updated_at: '2026-11-09T04:54:17.149462+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Once the visible channel has loaded, the channel the operator has not opened is
primed behind it, so the first flip shows a document rather than fetching one
([[BUG-79]]). Priming happens only after the visible frame's load, so the page
in front of the operator never waits on a render they did not ask for.

Priming fetches only a frame that points at a different address from the one
its mode now resolves to. Examples are a frame never pointed anywhere, or one
holding another site's page. A frame that is only stale (the same address with
newer content behind it, after a write) is not primed. It re-renders when it is
next shown.

## Verification

Mount the real builder composition and let View load. Without switching, assert
the Edit frame has been pointed at the edit channel's address for the same site.
Then switch to Edit and assert no load fires: the document was already there.
Separately, after a write that leaves Edit stale while View is shown, assert
Edit is not re-fetched until it is shown.

Reference UAT: `tests/test_reconciliation_builder_flip_in_place.test.ts`
(`test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not`).
