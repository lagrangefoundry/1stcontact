---
uid: comment-73b6147a
id: COMMENT-5758
type: comment
title: Comment on bug BUG-297
created_by: xgd
created_at: '2026-10-26T15:43:04.274951+00:00'
updated_at: '2026-10-26T15:56:31.602917+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4232d83d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c54aa860-a3f5-4819-a01d-fe617c4a1114",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a2315ca4-eedb-49d5-b91f-988e1ef6f110-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T15:41:24.445856+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a2315ca4-eedb-49d5-b91f-988e1ef6f110-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T15:56:28.200691+00:00" -->
#### Claude
I'm reading the home-length hold in `host-core.ts` to see where to gate it. Next I'll look at `owedStructure`.

I'm working out how the plan records "first draft in progress" and the `pages_navigation` decision, so the hold can be gated on them.

I'm deciding how the host should recognise the client's "no". Checking which roles can record a client's answer on a decision.

Design settled. I'm now checking the finding shape, `PLAN_KEYS`, and the existing BUG-287 tests so the change slots in.

I'll check how the test factory writes the plan, so the UATs can set up an established site.

Design is settled; starting the free-coding steps. Marking the ticket `free_coding` and cutting a branch.

Now the plan side: a `home_length` record on the plan, and a `kept` flag on `set_decision` for the client's no.

Now the `kept` param in the plan surface declaration, and `home_length` in `PLAN_KEYS`.

Now the host side. Checking the stored page and site.json navigation shape for the "structure changed" signature.

Writing the host-side logic now: a pure `homeLengthMode` decision (hold / offer / quiet), the plan record update in the host look, and the release at reply end when the client's no is recorded.

Now the core change in `host-core.ts`.

Typecheck is clean. Writing the UATs, modelled on the BUG-287 suite.

Fixing the script order in the third test so the kept decision comes in the held round, not the first.

3 pass. Checking they actually bite: temporarily forcing the old always-hold behaviour, expecting failures.

The new UATs fail against the old always-hold behaviour, so they bite. Now the regression scope around the hold, the plan surface and priming.

The long-filter quirk (known); splitting into two batches.

Four suites failed. Baselining them on clean `xgd-working` before blaming the diff.

All 8 failures reproduce on clean `xgd-working`, so they predate my change. Reading my notes on the `free_coded` gate before committing.

Updating the ticket body first, so every UAT matches language in it. I'm keeping the existing text and adding an implementation section.

Committing the code on the branch.

Commit `49c87a58`. Now the merge-back tail: lock, merge `xgd-working` into the branch, bump, `xgd-merge`, then `move-to-free-coded`, run as a retry loop.

BUG-297 is done and merged into `xgd-working`. The ticket is at `free_coded` (commit `49c87a58`, version bump `4b88334a`, version 0.2.667, 5 story points). The ticket body keeps your original text and now has a "What changed" section describing the final design.

**What changed:** after each build, the host checks whether the home page is over its length budget. It then does one of three things:
- **Holds the reply**, as BUG-287 does today, only when the turn is structural work:
  - the site is still in its first draft (the client hasn't seen and answered it yet);
  - the build changed the pages or how many sections home has;
  - home measured more than half a phone screen taller than at the last check;
  - or this message is already being held for it.
- **Offers once** otherwise. The build result tells the consultant it may mention the length once, in one line, and offer to move part of home to its own page. It changes nothing unless the client agrees, and nothing holds the reply. That's the favicon case.
- **Says nothing** once the offer has been made on that site, or once the client has said no. This lasts until home grows again, which makes the next turn structural.

**How the client's no is recorded:** `set_decision 'pages_navigation'` now takes `kept: true`. The hold message and the offer both tell the consultant to record a no this way. If it's recorded while a reply is being held, the hold ends. Recording a new structure without `kept` counts as the client raising it again and clears the no. These states carry across messages in a new plan field, `home_length`.

Three choices I made that you may want to change:
- The "client's no" is an explicit flag, not text matching on "keep as it was". That adds one parameter to the plan tools.
- "The home page changes" in the ticket means home grows. A favicon or header edit doesn't bring the offer back.
- Changing only the navigation order doesn't count as structural, because it doesn't change home's length.

**Tests:** three new tests in `tests/test_UAT_FC_BUG-297_the_home_length_hold_holds_only_structural_work.workers.test.ts` all pass, and two of them fail when I force the old always-hold behaviour back in. I also ran 64 related test files. 8 tests in 4 files fail (REQ-342, REQ-361, REQ-408, REQ-416), and the same 8 fail on clean `xgd-working`, so they predate this change.

I haven't tried it in the live app on Ariel's site.

<!-- xgd-chat-end -->