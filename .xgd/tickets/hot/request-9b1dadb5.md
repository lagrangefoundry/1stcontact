---
uid: request-9b1dadb5
id: REQ-468
type: request
title: 'Hero clips: remove the third-party disclosure gate; agree the design, not
  the implementation'
created_by: EPIC-26
created_at: '2026-10-26T02:53:07.344948+00:00'
updated_at: '2026-10-26T03:12:51.316368+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-2a432012
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-657d15f6
  commits:
  - working_sha: 4db5a130f2d441352b117428992e2a3bf32a0007
    reconcile_sha: null
    main_sha: null
  - working_sha: 796cbdf1ec2e9f63211b205e42fe23bafcdd0313
    reconcile_sha: null
    main_sha: null
  version: 0.2.664
  story_points: 2
---

## The problem

The consultant's clip tool (REQ-461) refuses the first `AnimateImage` call for a business and hands the consultant a sentence to say: the client's photo goes to an outside AI video service. The consultant then asks the client for permission to send it. Seen on Ariel's Arc Welding (Old Scratch):

> "Before I make the clip, one thing you should know: to make Scratch move, your photo (IMAGE-3) goes to an outside AI video service. Only the photo is sent, and the clip comes back here. … **Is it OK to send the photo to the video service?**"

This is wrong for the product. The consultant has many tools, several of which call outside services, and none of them asks the client's permission first. The client does not care how something is implemented. Telling them about a third-party call, and asking permission for it, puts an implementation detail in front of them as a decision.

## What changes

- **Remove the gate entirely.** No first-call refusal, no "disclosed" memory per business, and no disclosure sentence handed to the consultant. The first clip request goes ahead like any other tool call.
- **Nothing the consultant is given mentions an outside service, a third party, or sending the photo anywhere.** That covers the tool result, the op description and guidance, and the error texts. The client is never asked permission to use a tool.
- **What the client agrees to is the design.** Before a clip is made, the consultant still describes what it will be and gets a yes to that design. That means what moves and what stays still, how long it runs and how it loops, where it sits on the page and what it replaces, that visitors see a still first, and that if it doesn't look right it can be taken off again. The consultant also says it takes a few minutes. That part of the example above was right and stays.
- No change to the 10-per-session and 50-per-business limits, to the "never mention a price" rule, or to the spend metering.

## Policy note

Architecture Policy 26 (DOC-1) used to say "disclose when data is sent to AI providers", and that is why the gate was built. The operator decided on 2026-10-25 that in-chat disclosure is unnecessarily scary and confusing. What goes to the provider is a picture the client is about to put on a public website, and no customer email addresses or other private data are sent. The providers are listed in the terms and conditions instead. DOC-1 point 26 has been reworded to match.

## Test plan

UATs `test_UAT_FC_<ID>_*`:
- The first `AnimateImage` call for a new business makes a clip on the first attempt: fal is called and a `video` material is stored, with no refusal.
- Nothing the model sees mentions an outside or third-party service or permission. That covers the op description, the guidance, and the tool result.
- The op guidance still tells the consultant to describe the clip's design and get a yes before making it.

Remove or replace REQ-461's `test_UAT_FC_REQ-461_the_client_is_told_before_the_first_clip`, along with the "first request is the disclosure" step in that suite's `animate()` helper. Drop the disclosure assertions from `..._the_client_is_never_told_a_price`.


## What landed

- `apps/control-app/src/videogen.ts`: the first-call gate in `SiteClipToolbox.animate_image`, the `videogen:disclosed` tenant counter and `videoDisclosure()` are deleted. The first `animate_image` request for a business goes straight to the backend (per-site cap → provider → spend meter), like every later one.
- `videoGuidance()` (appended to the op description, not the priming) now reads: before making one, describe the clip to the client and get a yes to that design — what moves and what stays still, how long it runs and how it loops, where it sits on the page and what it replaces, that visitors see a still first, and that it can be taken off again if it doesn't look right; tell them it takes a few minutes; never mention a price or cost. It names no service. The upstream (lagrange-framework) op text was checked and never mentions an outside service, so nothing upstream needed changing.
- The site cap (50), session budget (10), the no-price rule, stripping `estimated_cost` from the result, and the spend meter are unchanged.

## Tests

- New `tests/test_UAT_FC_REQ-468_clips_without_a_disclosure_gate.workers.test.ts`:
  - `..._the_first_clip_for_a_new_business_is_made_on_the_first_request`: fal is reached on the first call and a `video` material with one `video/mp4` file is stored.
  - `..._nothing_the_model_sees_mentions_an_outside_service_or_permission`: the op summary/description and the tool result match none of outside / third-party / external / video or AI service / provider / vendor / permission / "is it OK" / sending the photo.
  - `..._the_guidance_has_the_consultant_agree_the_design_first`: the op description carries each design point and "takes a few minutes".
- REQ-461 suite: `..._the_client_is_told_before_the_first_clip` removed; the `animate()` helper no longer expects a first refusal; disclosure assertions dropped from `..._the_client_is_never_told_a_price`. Both suites: 11/11 pass.