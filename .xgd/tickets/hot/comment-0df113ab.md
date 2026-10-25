---
uid: comment-0df113ab
id: COMMENT-5625
type: comment
title: Comment on request REQ-458
created_by: xgd
created_at: '2026-10-25T16:58:23.379346+00:00'
updated_at: '2026-10-25T17:13:50.828223+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c62cf8fc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a7cf33a3-a0fb-4df8-b395-516c557f2338",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5733e962-2f44-47ec-8770-986955fcbf0c-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T16:56:54.568938+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5733e962-2f44-47ec-8770-986955fcbf0c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T17:13:49.025067+00:00" -->
#### Claude
Let me cut the branch and mark the ticket, then study the code.

I'm reading the plan/critique code to map where the first-pass trigger, the review hold, and the hand-over refusal live before writing anything.

Still mapping the code: I'm working out how to tell builder-written pages apart from a fresh site's starter, which is what the new site-state first-pass trigger depends on.

Now looking at `show_client` and `set_stage` handling, where the new refusals go.

Found an existing `nothingBuilt` helper that recognises the starter page — reusing it for the site-state check.

Design is settled. Reading the BUG-275 UAT to reuse its harness.

Writing the code now. First checking that a builder's `set_l1` write is journalled with its page.

Now show-core: a `building` guard on the draft target.

Now plan-core: the review-first refusal on `show_client`, and the review-first steering in the plan entry.

Now the host: turn tracking for running builders, the `building` guard, and the site-state first pass.

Code is written; I'm typechecking and setting up the worktree (it's missing generated control-app artifacts, a known fresh-worktree gap).

Typecheck is clean. Writing the UAT file now.

Two of three pass. The second `Delegate` gets a different refusal than `scope_held`; finding where it comes from.

Both refusals fire (the first message's carry-on rounds reach them). I'll make the test find them by content rather than position, and check the full wording.

All three pass. Running the regression scope (BUG-275, BUG-249, REQ-427, REQ-445 and neighbours).

The long path filter matches nothing (a known vitest quirk); using short ID filters instead.

Three failures. Two are known pre-existing (BUG-249 stalls-twice, REQ-416 priming). Checking REQ-431, which touches `show_client`.

That's a JSON-spacing assertion on a `story` target, not my code path. Confirming all three fail identically on clean xgd-working.

All three predate this change. Now the node (non-workers) suites in scope.

REQ-428's plan-entry test is noted as pre-existing in BUG-275, but it reads agenda lines, which I changed, so I'm comparing its failure against clean working.

Identical on clean working, so pre-existing. Checking any surface-declaration suites that read `plan-surface.json`.

All failures predate this change. Now the commit: checking the version-bump convention first.

Before committing, I'm updating the ticket body so every UAT is backed by its wording, keeping the existing text.

Now commit the code, then merge back following the version-at-tip order.

Merging xgd-working into the branch first, then bumping the version on the branch so the bump lands at the tip.

The printed script path doesn't exist; using the CLI form from the protocol instead.

The ticket is at `free_coded`. Now tearing down the branch.

REQ-458 is implemented and merged into xgd-working. The ticket is at `free_coded` with both commits recorded (`7a6cb8eb76`, and the version bump to 0.2.636 in `04b087a197`). The three new UATs pass. Every failure in the regression run also fails the same way on clean xgd-working.

**What changed**
- **The first pass is recorded from the site.** At the start and end of every consultant round, the host checks four things: the plan has no `first_pass_at`, the assistant has written pages, the site is more than the starter page, and no builder still holds a page. If all hold, it records the first pass the same way a finished build does. The first-draft review then falls due even when the turn that built the draft vanished, stalled or was lost to a restart.
- **The first draft isn't handed over before its review.** This applies only where the host runs a critic. Until the review has run and every finding is answered:
  - `show_client` of the draft is refused with a new `DRAFT_NOT_REVIEWED` code.
  - The plan entry tells the consultant to run the review first, and leaves out REQ-445's "Your first draft is ready" lead.
  - Setting First draft to done was already impossible before the client has seen and answered the draft, so no new rule was needed there.
- **A build still running is named.**
  - A `scope_held` refusal now names the builder, the consultant turn that started it, and tells the consultant not to say the draft is ready.
  - Until the client has had the first draft, `show_client` of the draft is refused with `DRAFT_BUILDING` while a builder holds its pages. After that, later rounds with parallel builders behave as before.

**Where I narrowed the ticket**
- **No check on every plan write.** The ticket says "the next plan write or consultant turn"; I only check on consultant rounds. Every hold and refusal is read inside a round, so that is enough.
- **"Written by the assistant" comes from the change journal, not page contents.** Imported or seeded sites, including every test fixture, therefore don't fall due for a first-draft review.
- **No first pass while a builder is still running.** Otherwise the critic would review a half-built draft. A builder whose turn vanished is picked up once its lease is released or expires, which is 5 minutes idle by default.
- **The turn is named only in the process that started the build.** After a restart, refusals still name the builder but not its turn.

**Tests:** `tests/test_UAT_FC_REQ-458_no_unreviewed_first_draft.workers.test.ts` covers the three cases in the ticket's test plan. I ran the BUG-275, BUG-249, REQ-427 and REQ-445 suites plus the related ones. Six fail, and each fails the same way on clean xgd-working:
- BUG-249 stalls-twice
- REQ-416 priming
- REQ-431 inline link (a JSON-spacing assertion)
- REQ-428 plan entry
- REQ-361
- REQ-408 weakest point

I didn't check the new tests against the old code: they import new exports, so they would fail on import rather than on the behaviour.

The ticket body now describes the design as built. It is ready for you to promote to `ready_to_reconcile` when you want.

<!-- xgd-chat-end -->