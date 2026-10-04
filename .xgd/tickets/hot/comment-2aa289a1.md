---
uid: comment-2aa289a1
id: COMMENT-4881
type: comment
title: Comment on bug BUG-197
created_by: xgd
created_at: '2026-10-04T14:56:05.504335+00:00'
updated_at: '2026-10-04T15:06:54.819493+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5c0ef3db
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "91c4ed7d-edcd-44c8-9e4c-1512969895ff",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="48f8d946-5f85-415f-a167-9d816ee3fa47-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T14:54:38.461803+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="48f8d946-5f85-415f-a167-9d816ee3fa47-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T15:06:52.857160+00:00" -->
#### Claude
Scope is clear in the ticket. Setting status and cutting the branch.

I'm in the BUG-197 branch reading the containment probe and gate code; part 1's design is settling (separate `declared-backing-uncovered` finding), part 2 (values-diff chip inset) is next to read.

Part 1 design settled; writing the probe change now.

Now the gate-core diagnosis for the new kind.

Running the existing containment suites against part 1 before moving to part 2.

Part 1 is green on 76 existing tests. Now part 2: values-diff's chip inset comparison.

Inspected the evidence: both sides draw the same bordered 28px pill; the reference only counts it "not self" because its fill is transparent. Now reading the extractor's surface walk.

I'll fix part 2 on the diff side (the reference bundles are already captured, so an extractor change wouldn't reach them). Finding where padding is compared.

Part 2 code written; fixing a missing helper, then typechecking and writing UATs.

Writing the UAT file now (both parts), then running it with the adjacent suites.

All 9 pass. Checking they actually fail against the unmodified sources (so they're real evidence):

zsh didn't split the list — nothing was touched (diff intact). Retrying with explicit paths:

6 of 9 fail on the old code (the other 3 are regression guards). Now a wider regression sweep over every suite touching values-diff, probes, or the gate:

Unrelated-looking (image card param list). Confirming it's pre-existing on the baseline:

Pre-existing on baseline, not mine. Now trying the ticket's own real-bundle repro against my code:

Exactly the 12 pill rows are gone. Base had 18 total, fix has 5 — one more than expected, so checking what else moved:

Updating the ticket body first, appending what landed and keeping the original report intact:

Ticket updated with the original report preserved. Committing on the branch:

Taking the merge lock and merging back into xgd-working:

Merged. Moving to free_coded and letting the gate do the version bump itself (avoids the race with other sessions' ticket commits):

I've implemented both fixes. BUG-197 is at `free_coded` with commits `c0f08f66` (code + UATs) and `7febe617` (version bump), merged into xgd-working, and the branch is cleaned up. No questions came up; the ticket's proposals were specific enough to build as written.

**1. A false `backedBy` is no longer reported as a viewport-motion escape** (`probes.ts`, `gate-core.ts`)
- A pair the fold declared is now only trusted if the surface actually covers the run at every captured width, the same test the gate already applies to pairs it works out itself.
- A declared pair that fails at a captured width is reported once per width as a new finding kind, `declared-backing-uncovered`. Only the on-sample probe reports it; `escape` is kept for pairs that hold at rest and fail between samples.
- The gate's diagnosis now says the fold recorded the wrong surface, and the next step says to fix `backedBy`, not to resize the surface.
- **Decision for you:** the new finding still fails the structural gate. A false declaration is a real defect in the document, even though the page paints correctly here. If you'd rather it only be reported, that's a one-line change.
- **On the real bundle:** the 1280 findings now read like "'Contact' declares backedBy section-band-4 but is not covered by it at rest — 173px below its bottom edge". There are 29 of them (one per width) instead of 58 escapes counted per height, and no off-sample escapes.

**2. A chip's inset is compared like for like** (`values-diff.ts`)
- When one side holds the inset as padding and the other uses `min-height` with zero padding, both are now compared on where the text sits inside the box. A real centring difference is still reported, labelled `inset N`.
- A pill with a border and radius but no fill no longer counts as "an invented plate"; it is still compared on border and radius. I made this change in the diff rather than the capture code, so it works on references that are already captured.
- **On the iteration's real manifests:** deltas went from 18 to 5. That's the 12 pill rows plus one `surfaceFill drift ×7` summary row, 4 of whose 7 were those pill rows. The 3 real colour deltas are still reported. I didn't run the full browser-based `1c gate` from the ticket; the sandbox normally blocks Chromium.

**Tests**
- `tests/test_UAT_FC_BUG-197_declared_backing_and_chip_inset.test.ts` has 9 UATs. 6 fail on the old code; the other 3 check that existing behaviour still holds.
- I ran the 156 test files that touch values-diff, the probes or the gate: 155 pass. The one failure, an image-card case in `req51-object-grouped-report`, fails the same way without my change.

<!-- xgd-chat-end -->