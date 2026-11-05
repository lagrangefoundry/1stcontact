---
uid: comment-5cc22296
id: COMMENT-5818
type: comment
title: Comment on bug BUG-311
created_by: xgd
created_at: '2026-10-28T21:13:49.145737+00:00'
updated_at: '2026-10-28T22:31:03.369740+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2f6c8522
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "73274e08-7ce3-43ef-aba1-6d5dacec250c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T21:13:40Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T21:13:40Z" -->
#### You
I have to ask the consultant to make the change, my editor will not let me - what should I ask it? [Consultant reply: refused by design_first before the builder opened; offered to write a seed design, or lift the gate for config-only changes.]

<!-- xgd-chat role="assistant" ts="2026-10-28T21:13:40Z" -->
#### Claude
The first-build holds key on first_pass_at, which a pre-milestone site never records, so every Delegate is a first draft; structure_first and effect_first would follow. Do not write a design. Ticket: a site with built pages or a published revision is not on its first build; back-fill first_pass_at.

<!-- xgd-turn id="a974ab1c-d240-4a93-9f63-2d5173fd81f3-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T22:20:04.053884+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a974ab1c-d240-4a93-9f63-2d5173fd81f3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T22:31:00.760743+00:00" -->
#### Claude
Writing the back-fill now: a plan-core function, plus a published-revision branch in the host's existing `firstPassFromSite`.

Expected behaviour: the First draft stage ticks itself done, which already stops its guide, so only `checking` needs marking as passed. Simplifying.

A REQ-458 case fails. Checking whether it fails on clean `xgd-working` too.

Same failure on clean `xgd-working`, so it predates this change. Now looking for suites my change could reach: sites with a published revision that also run consultant turns.

Only the known REQ-458 failure among the 20 workers suites. Now the node-side suites that read plans.

Typecheck is clean for the changed files. Updating the ticket body with the settled predicate, then committing.

Ticket updated. Committing the work on the branch, then the lock, merge, bump and free_coded sequence.

BUG-311 is fixed and merged into `xgd-working`, and the ticket is parked at `free_coded` with both commits and version 0.2.696 recorded. Production won't change until you deploy from `xgd-working`.

**What changed:** if a site has a published revision but its plan has no recorded first pass, the host now fills one in at the start of the next consultant round. This happens before the consultant reads the plan or can delegate to a builder. Concretely:
- **First pass and Publish opened:** both are recorded with the first revision's publish date. That clears all three first-build holds (`design_first`, `structure_first`, `effect_first`). It also updates everything else that checks for a first pass: the agenda, the stage guides, the panel and the first-draft cut.
- **No first-draft steps:** no first-draft review or checks become due, and the consultant isn't told to hand over or show the draft. The First draft stage marks itself done, and the "checking your work" guide is recorded as already given.

**One departure from the ticket:** "the site has pages beyond the starter placeholder" doesn't count as established on its own; only a published revision does. Test sites and `1c new` start from a starter page with a heading, which the existing check already treats as built. Counting pages would have let every fresh test site skip the holds. A site that was built but never published still gets its first pass recorded by the existing REQ-458 rule if the AI wrote its pages. The ticket body records this.

**Tests:** the three UATs from the ticket pass, in `tests/test_UAT_FC_BUG-311_established_site_is_past_its_first_build.workers.test.ts`. I also ran 20 workers suites and 11 node suites that touch first passes, guides or publishing. Everything passed except one REQ-458 test (`…with_a_builder_holding_the_pages…`), which fails the same way on clean `xgd-working`, so this change didn't cause it.

**Next steps for you:**
1. Deploy from `xgd-working` (`bin/deploy`).
2. Ask the Site consultant again for the two `signin` labels on home ("My businesses" and "Your account"), then publish to fix 1stcontact.io's links (BUG-299).
3. Promote BUG-311 to `ready_to_reconcile` when you're happy with it.

<!-- xgd-chat-end -->