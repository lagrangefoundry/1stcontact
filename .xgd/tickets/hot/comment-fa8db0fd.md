---
uid: comment-fa8db0fd
id: COMMENT-3990
type: comment
title: Comment on bug BUG-154
created_by: xgd
created_at: '2026-09-26T21:54:07.281569+00:00'
updated_at: '2026-09-26T22:09:13.279489+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-285c291a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6341f3a0-ab96-4604-9d71-c62a5f5d742a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="615dd559-cac4-4cee-8771-a6b8bb60c1b7-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T21:53:13.742182+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="615dd559-cac4-4cee-8771-a6b8bb60c1b7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T22:09:12.465335+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Clear picture. Let me set up the ticket before coding.

Ticket scoped. Cutting the branch.

Now the renderer change.

Now the schema vocabulary.

Now the UAT suite.

Now the regression scope — L1 render/schema suites.

Clean. Version bump and commit.

Now lock, merge back, and mark `free_coded`.

Version race with a concurrent session. Bumping again on the merged tip.

Done. BUG-154 is `free_coded`.

## What I found

The pin already had a paint-order field, and it wasn't `stacked`. REQ-328 added `sticky.lift`, which compiles to `z-index: 1` and is exactly this composition — so the report's "that request specified pinning but did not specify overlap behaviour" is out of date. The composition was achievable today.

The defect is the other half: `stacked: true` is a *different* field with a confusable name. Its job is telling the envelope evaluator that an overlap is the design rather than a defect; it was documented as "NOT A PAINT AXIS" and emitted nothing. The author wrote it, everything reported success, and the page didn't change. That's the bug.

The surface-fill observation is consistent with this, not a second fault: the fill was always painted, just painted underneath — an in-flow `container` takes `position: relative`, so the sibling arriving later covers the pin regardless of what it fills itself with.

## What I changed

Took the report's preferred option, bounded to where the two declarations actually meet: **`stacked: true` on a node that also carries `sticky` now lifts it**, emitting the same single `z-index: 1` inside the pin's own declaration list — so a `fromPx`-gated pin lifts only inside its band, and a node carrying both spellings emits one `z-index`, not two. `sticky.lift` is unchanged and not deprecated.

`stacked` alone still emits nothing, and that bound is the load-bearing part. The fold authors `stacked` on every overlap a captured reference actually painted, and never authors `sticky` — so no reproduction can reach the new branch and none of their paint moves. Asserted as byte-identity, not as absence of the string.

I also corrected the schema doc comments, since they're the authoring reference the projection lifts and half of what the report measured was the prose reading like a paint declaration when it wasn't.

## Evidence

`tests/test_UAT_FC_BUG-154_sticky_stacked_paint_order.test.ts` — 5 UATs (reported composition lifts; unpaired `stacked` is inert to the byte; both spellings are one declaration; gated pin stacks only in its band; envelope unchanged). All 77 suites that import `renderL1Document` pass, plus the fold and edit-render suites. `tsc --noEmit` clean on both packages.

One pre-existing failure in `test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` (4 tests) — I verified it fails identically with my schema edit reverted, so it's not mine. `apps/control-app/src/generated/` is gitignored and absent in a fresh worktree; I copied it in from the main checkout to unblock six suites.

## Not done

The report's closing note about the wider pattern cites a second instance ("a picture height set to track its row"). I left that alone — it's a different field and a different report, and folding it in here would have made one ticket cover two intents. Worth filing separately if you want it chased.

<!-- xgd-chat-end -->