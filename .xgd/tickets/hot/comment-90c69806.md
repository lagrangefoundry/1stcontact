---
uid: comment-90c69806
id: COMMENT-6232
type: comment
title: Comment on request REQ-628
created_by: xgd
created_at: '2026-11-01T17:58:07.113026+00:00'
updated_at: '2026-11-01T18:18:12.574160+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b2e34a71
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "709926f4-3cde-4fa9-9cb0-24975b03e2f8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="60dca00e-62f5-4ae8-a827-5c2a8f13f5b6-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:57:27.471452+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="60dca00e-62f5-4ae8-a827-5c2a8f13f5b6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T18:18:10.521979+00:00" -->
#### Claude
Now let me find the relevant code: the critique / `before_publish` / `answer_finding` and the BUG-326 hold.

Reading the code: the critic's review lives in `critic-core.ts`, and BUG-326's `decision_first` hold in `account-core.ts`/`host-core.ts` is the model I'll copy for the new refusal.

Designing the hold now — checking how the host gates tool calls generically (the speak-first gate) so the new refusal covers both Delegate and the consultant's own site writes.

Next: the "client message since the review" signal. Checking whether the plan already records client messages durably (e.g. REQ-623's `feedback_at`).

Plan settled. Checking which plan-surface tools change the site's look (beyond `set_design`) so the hold covers them.

Now reading the existing REQ-427 workers UAT to reuse its harness for the new tests.

Harness is reusable. Checking that the prompt route stamps `clientMessageOnPlan` (the hook the hold will clear on) and what `nearPublishing` means.

Code paths understood. Moving the ticket to `free_coding`, cutting the branch, and writing the ticket body's design decisions as I go.

Now the core change in `critic-core.ts` (in the worktree).

Node modules resolve via the parent directory. Editing `critic-core.ts`:

Now `plan-core.ts`: stamp the client's reply in `clientMessaged`, give the critique tool a publishing-specific `next`, and fix the NOT_CRITIQUED wording.

Now the host gate in `host-core.ts`'s `toolSet`, wired only into the consultant's tools.

Gate wired. Now the consultant's priming — finding where it talks about the review's findings.

Editing the declaration text (the consultant's priming for this tool) textually to avoid JSON round-trip churn.

Now typecheck. Checking the repo's typecheck/test commands.

Fresh worktree lacks the generated control-app artifacts (known); copying them from the main checkout.

Typecheck clean. Now writing the UATs, modelled on REQ-427's workers harness.

Baseline first: running the existing REQ-427/REQ-379 workers suites against my change.

Existing suites pass. Checking how a client's Publish is exercised in tests, for the third UAT.

Writing the UAT file.

All four pass. Checking they actually depend on the change: disabling the host gate should fail the first UAT.

The gate is what makes UAT 1 pass. Now the regression scope: every suite touching the critic, the plan's publish path, the client-message hook, and the priming budget.

Five failures across three files. Baselining those three on the unchanged `xgd-working` checkout.

Same five fail on clean `xgd-working`, so they predate this change. REQ-466 is a prompt-size budget, though, so I'll compare its numbers to make sure I didn't push it further.

Pre-existing either way (working's checkout is ahead of my branch base and reads larger); my text adds about 1 KB. Now the node-side scope.

Ticket body updated. Committing on the branch.

Now I'll lock the merge, pull `xgd-working` into the branch, and re-run the UATs against what will actually land.

Green after the merge. Bumping the version, then merging back with the retry loop (other sessions keep committing tickets to the tip).

Working moved in the meantime, so this landed as a merge commit. Trying the gate; if it refuses, I'll loop.

REQ-628 is implemented and merged into `xgd-working`. The ticket is at `free_coded` (2 commits, version 0.2.731, 3 points) and the branch is cleaned up. I had no questions that needed answering first, so I went ahead.

**What changes for the client:** when they press Publish, the consultant now puts the review's findings to them as suggestions. That's one short message with at most three, most important first, each with why it matters. A real fault (broken link, form that doesn't send, unreadable text, something cut off on a phone) goes first, is called a fault, and comes with a recommendation to fix it before publishing. Nothing on the site changes until the client answers, and they can publish without answering.

**How it works:**
- **The host refuses changes.** While a pre-publish review has open findings and the client hasn't written since it ran, the consultant can't commission a builder or change the site. That covers `Delegate`, every site write except `publish`, `set_design`, `choose_look` and `edit_image`. Each refusal says "ask your client which of the review's suggestions they want first". Reads, `answer_finding` and `publish` still run.
- **The client's next message lifts the hold.** It's recorded on the plan as `client_replied_at`, so it survives a restart. The host can't tell *which* finding a message asks for, so any client message lifts the hold, and the instructions tell the consultant to fix only what the client took up.
- **The hand-back and Publish are no longer held.** Open pre-publish findings no longer hold the consultant's hand-back. Ready to publish only needs the review to have run, not every finding answered.
- **No re-check:** fixing a high-severity pre-publish finding no longer triggers another review.
- **Recording:** the consultant answers `fixed` for what the client accepts and `dismissed` with their words for what they decline. It leaves out findings that would undo a client decision.
- **Cost tracking (REQ-438):** the review's cost window now ends when the client replies, so fixes they choose afterwards aren't counted against the review.

**Tests:** I wrote four UATs in `tests/test_UAT_FC_REQ-628_prepublish_suggestions.workers.test.ts`: the three from the ticket's test plan plus one for the consultant's instructions. All pass, before and after merging `xgd-working`. With the host check switched off, the "not auto-fixed" test fails, so it really tests the refusal. The 40 nearby suites pass except for seven tests in four files (REQ-466, REQ-458, REQ-416, REQ-472). Those fail the same way on unchanged `xgd-working`.

**Decision for you:** the REQ-466 failure is the consultant's prompt-size budget. Its prompt is already about 217k against a 205k limit, and my new instructions add about 1 KB. Someone will need to trim the prompt or raise the budget; that isn't part of this ticket.

The ticket body keeps your original text and adds an "As implemented" section describing all of the above, so it's ready to promote to `ready_to_reconcile` whenever you choose.

<!-- xgd-chat-end -->