---
uid: comment-1b250264
id: COMMENT-5120
type: comment
title: Comment on request REQ-389
created_by: xgd
created_at: '2026-10-05T01:18:06.998901+00:00'
updated_at: '2026-10-05T01:33:01.813716+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-cd88fc31
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a2498207-f05b-4d2d-aa65-8496edab3e95",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f2a46907-093d-4744-89c7-782e77ff3917-user" -->

<!-- xgd-chat role="user" ts="2026-10-05T01:16:17.264430+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f2a46907-093d-4744-89c7-782e77ff3917-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-05T01:33:01.561467+00:00" -->
#### Claude
Reading the consultant priming, the `Delegate` tool, the plan, and the site-write path to find where the guard goes.

The `Delegate` tool is declared upstream in lagrange-framework. Next I'm checking whether 1stcontact can override its description locally.

Priming and the `Delegate` method prose are local to 1stcontact (`priming.json`). Next: the plan model and the site-write path, to place the email-approval guard.

Branch `free-REQ-389` is cut. I'm now adding approval records to the plan: a `public_details` list, an `approve_detail` op, and an `approves` option on `set_ask`.

Now the `set_ask` handling and the `approve_detail` op.

I'm wiring the guard: the plan's approved details go on the AI's write options, and the single write choke point (`validateOrThrow` in `edit.ts`) refuses any new email address that isn't approved.

Adding a dedicated `NOT_APPROVED` refusal code, plus the email scan in `edit.ts`.

Full proposed site each time, so a site-wide before/after comparison works. Writing the guard now.

Now binding `publicDetails` at the host's three AI write sites (consultant, builder worker, coordinator).

Now the surface declarations: `NOT_APPROVED` in the L1 surface, and `approve_detail` plus `approves` in the plan surface.

The cloud plan store whitelists plan fields, so `public_details` has to be registered there as well.

Engine side is done. Next, the priming text and the `Delegate` method prose.

Implementation is in place. Now the UATs, modelled on the REQ-364 plan + toolbox test.

Writing the two UAT files now: the email-approval guard, and the priming rules.

The owner-edit case failed, most likely because the test built that toolbox without a store. Fixing the test.

New UATs pass. Running the regression scope: plan, priming, delegation, L1 surface, errors, and the workers suites.

Ten files are red. I'm checking each to separate failures this change caused from pre-existing ones.

All six pass. Running the workers suites, then a typecheck.

REQ-356 pins the plan type's exact field list, and `public_details` is a deliberate addition, so I'm extending that expectation.

REQ-295's two workers failures also reproduce on clean `xgd-working`, so they predate this change. Typechecking next.

Typecheck is clean for both `tools/generate` and the control app. Checking my notes on this project's `free_coded` gate before committing.

Committing on the branch. First, updating the ticket body with what landed; the existing text stays as it is.

The test run rewrote `module-assets.ts` (a known side effect). It wasn't staged; reverting it. Then the merge back.

Merged cleanly into `xgd-working`. Re-running the new UATs on the merged tree.

I've implemented all five rules from REQ-389 and merged them into `xgd-working`. The ticket is at `free_coded` with the code commit and the version-bump commit recorded, and the branch is cleaned up. Both new UAT files pass, and typecheck is clean for `tools/generate` and the control app.

**Contact-detail guard (rule 1).** When the AI writes to the site, the host now refuses any email address the plan doesn't record as approved. The refusal names the address and tells the consultant to ask the client first, and nothing is written.
- **What it catches:** a `mailto:` link or an email-shaped string anywhere in the site, compared without regard to case.
- **What it ignores:** an address the site already showed is not refused, including when it moves between pages, so existing sites stay editable. File-name fields are skipped, so `photo@2x.png` isn't read as an address.
- **Who it applies to:** the consultant, the builder and the coordinator. A person editing their own site is not guarded. A host with no plan store isn't guarded either, because there is nowhere to record an approval.
- **How approval is recorded, per address:**
  - The consultant uses a new plan tool, `approve_detail`, which only accepts the client's own words.
  - Or the consultant puts a yes/no question on the client's panel (`set_ask` with a new `approves` option) and the client answers yes. The consultant filling that question in itself doesn't count.
- The refusal uses a new error code, `NOT_APPROVED`. Reusing an existing code would have shown the model a misleading message ("not well-formed", "name taken").

**Priming (rules 1–5).** A new section in both consultant priming variants covers:
- checking against the brief and fixing crops, alignment and missing sections in the same turn, never asking permission to fix its own mistakes;
- checking desktop, tablet, phone and the client's viewing width after any change to the header, navigation or hero;
- the contact-detail rule, with the business phone as the exception that is still confirmed once;
- asking questions about the client's real situation with concrete alternatives, never a metaphor;
- building one thing at a time and adding estimates together.

**The `Delegate` description (rule 4).** The tool's own declaration lives in lagrange-framework, which I didn't touch. One-at-a-time is a fact about this deployment, so the "one at a time, add the times together" wording is in this repo's prose about `Delegate`: the commissioning method and both delegation reminders.

**Changes from the plan:**
- I tried a per-turn "finish before handing back" reminder and dropped it. It pushed the standing reminder past its 600-character limit and took a slot another reminder reserves. The rule is in the priming instead.
- I extended an existing test that pins the plan's field list, to include the new `public_details` field.
- I raised the story points from 3 to 5.

**Failures in the related test suites:** four tests fail, and all four also fail on clean `xgd-working`:
- REQ-349: one test
- REQ-341: one test
- REQ-295 workers: two tests

Six other suites only failed in the fresh worktree because a build artifact was missing. They pass once it's supplied.

The ticket body now records the final design and the UAT list. Moving it to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->