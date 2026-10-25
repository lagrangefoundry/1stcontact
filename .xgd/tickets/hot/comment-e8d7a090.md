---
uid: comment-e8d7a090
id: COMMENT-5555
type: comment
title: Comment on request REQ-427
created_by: xgd
created_at: '2026-10-22T21:00:59.841736+00:00'
updated_at: '2026-10-22T22:16:25.822841+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5eb69904
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0a9f4c9c-14ab-4477-81d9-2c19890bb91a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a9178425-5b1b-4300-ab5e-489cdcd3bacc-user" -->

<!-- xgd-chat role="user" ts="2026-10-22T20:59:56.919423+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a9178425-5b1b-4300-ab5e-489cdcd3bacc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-22T21:47:16.243533+00:00" -->
#### Claude
I'm reading the host's continuation and looked-at gate code (REQ-409/415), which the critic's hold has to reuse.

I'm checking whether tool-result images reach a model as images today (the ticket's "must verify first"), since that decides how the critic gets its screenshots.

I'm reading the framework's delegation runtime to see whether a delegated session can be handed images in its opening message.

Found it: the framework's manager accepts a list of content blocks (images) as a turn's content (REQ-111). Reading that entry point now.

Reading how the plan's existing triggers (first draft done, Publish opening) fire, so the critic's due points reuse them rather than adding parallel ones.

Mapping the plan surface's operations (`set_stage`, `show_client`, `set_decision`) so I can attach the critique and its answers there.

I'm putting `critique` and `answer_finding` on the plan surface as a group that's only granted when a critic exists. Checking the camera's viewport options next, for the 1280/900/375 shots.

Reading how a role is built and registered on the site's session manager, so the critic can be added as a fourth role beside the builder and coordinator.

I've settled the design and am checking how the framework bills a worker's spend to its caller, so the critic's Opus spend is attributed the same way and isn't lost.

Now reading the story board's shape (positioning card, hearted notes), which goes into the critic's brief.

I have the full picture. Writing `critic-core.ts` first: the plan record, due points, answers, the brief, and parsing the report.

Now wiring it into `plan-core.ts`: the field, the due points, the two operations, the publish gate and the plan-entry line.

Now the declaration: two operations, a `Critique` group, and the new error codes in `plan-surface.json`.

Declaration done. Next: `PLAN_KEYS`, the critic's priming and role, its backend entry, then the host wiring.

Writing the critic's own priming (the rubric and report format) and the hold's continuation cue into `priming.json`, spliced as text to avoid churning the file's escapes.

Now the host side. Checking the framework's `registerBackend` signature and the stream event kinds before writing `criticFor`.

Adding the imports, then registering the critic on the site's manager and granting the `Critique` group where a browser and a plan exist.

Checking what `GET /api/plan` returns, so the UAT can read the critique record back the way the host stores it.

The suite is written; running it in workerd now.

No critic request was made at all, so the `critique` call is failing before it reaches the model. Dumping the consultant's tool results to see why.

The manager refuses image content unless the registered backend declares vision, so I'll build the adapter first and register it with its own capabilities, as the delegation surface does.

The framework expects a different image block shape from the one the camera returns. Checking what the manager accepts.

User-turn content uses the framework's neutral shape (`{type:'image', mediaType, data}`), while the camera produces Anthropic's. Converting at the boundary.

Three of four pass; the last failure is only my assertion's JSON spacing. Fixing it.

All four pass. Checking they can fail: temporarily disabling the hold, then the image conversion.

13 failures. Some are likely pre-existing (memory notes REQ-416 is red on clean working), so I'm running the same files in the main checkout for a baseline.

Only 42 characters over. The consultant doesn't need the critic's lens list (that's the critic's own priming), so I'll trim that from the `critique` description and leave headroom.

Still unchanged, so I'm guessing. Reading what BUG-129 actually measures.

BUG-129 passes. Now updating REQ-415's ready-to-publish UAT: with a critic present, publishing also needs the review, so the scripted consultant calls `critique` before marking the stage again.

REQ-415 and REQ-427 now pass together. Moving to the node project, starting with suites that touch the declaration, priming, backends and plan.

Only REQ-362 is new; the builder-workspace-origin extras are the known worktree-location artifact. Reading REQ-362's failure.

The spend meter prices per backend name, so `claude_critic` needs its own rates entry; otherwise its spend would go unpriced. Adding it at Opus 5.5 rates.

REQ-362 passes. Now the whole node project, in three foreground batches.

Many of these look like the worktree-location artifacts. Baselining every failing file in the main checkout.

Most of these are webui resolution in a worktree. But REQ-115's tab-label check scans product code for a quoted "Site" (per memory), so I'll read those messages before dismissing them.

That second hit is a built `dist-assets` copy in the worktree, not my change. Batch 1 is clean. Running the UAT files in two batches.

That's a `bin/copy-to-cloud` subprocess test, unrelated to this change. Rerunning it alone to see whether it's a flake, alongside the last UAT batch.

Batch 3 adds no new failures. Confirming BUG-134 is location-bound rather than mine.

`aiStatus` lists only the consultant and settings roles, so that's fine. Running lint on the changed files.

The repo has no linter configured. Re-running both typechecks after the later edits.

`module-assets.ts` was rewritten by a tool run (a known side effect), so I'm reverting it before staging. Then updating the ticket body to describe what landed, keeping the operator's text.

Ticket body updated. Committing on the branch, then merging back per the version-gate recipe (merge working in, bump on the branch, fast-forward).

Running the merge-back loop: lock, merge working in, bump, fast-forward, then the gate. It retries because other sessions' ticket commits can land on the tip.

Another session landed changes in `host-core.ts`, `plan-core.ts` and `roles.ts` while I worked. Resolving the conflicts by hand.

REQ-428 (another session) added a parallel "promise" hold in the same places. Resolving by keeping both: the order is layout faults, then the review, then promises.

Resolved. REQ-428 hides its cue from the client's stored transcript (`isPromiseContinuationCue`), so I'm checking how the layout cue is hidden, since my review cue must be hidden the same way.

The client's transcript comes back from `POST /api/ai/session`. Adding an assertion that the reopened conversation carries no trace of the review cue.

Merge resolved and typechecks. Running the suites that meet in this merge: REQ-427, REQ-428, REQ-415, BUG-129 (REQ-428 may also have grown the priming), and REQ-171.

All 11 pass, BUG-129 included. Now the node-side suites for REQ-428 and REQ-171, plus REQ-409's continuation suite.

No failures (19 skipped). One more full workers run on the merged tree before committing the merge.

Committed, and the suite passes. Checking that the new transcript assertion actually fails without the filter.

The assertion fails without the filter, so it carries weight. Adding the transcript point to the ticket body, then running the merge-back loop.

The gate passed: REQ-427 is `free_coded` at 0.2.583. The overlay re-check script wasn't at the printed path, so I'll run it through the CLI over the range the fast-forward brought in.

No tickets needed re-hiding. Confirming the ticket state, then tearing down the branch.

Done. Saving three non-obvious lessons to memory before reporting.

REQ-427 is built and merged into xgd-working. The ticket is at `free_coded` (version 0.2.583, three commits recorded) with its body updated to what landed, and the branch is cleaned up. Promoting it to reconcile is your call.

**One change from the ticket's design:** the critic does not go through `Delegate`. A `Delegate` brief can only be text, so a critic opened that way could not be shown the screenshots as images, which is the problem the ticket's "must verify first" item warned about. Instead the host opens the critic as its own one-turn session, the same way it opens a builder. It gets its own instructions (the rubric), its own Opus backend `claude_critic` (with its own entry in `prices.json` so its spend is priced), no tools at all, and a private session that closes after it answers. Its spend counts against the message's spend ceiling. Its opening message is the brief plus real image blocks.

**What it does:**
- **Consultant's tools:** `critique(focus?)` and `answer_finding` (fixed, decision or dismissed). The consultant only gets them where there is a browser and a plan.
- **What the critic sees:** the brief, built from the plan alone — the client's brief, the positioning card and whether it was confirmed, hearted notes, decisions, the comps note, and its previous findings with their answers. Plus the pages changed since its last review (all pages the first time, at most three), each at 1280, 768 and 375. Tablet is 768, the camera's existing preset, rather than ~900. It never sees the consultant's conversation.
- **When it's due:** when the first builder session completes, when looks are shown to the client (once per page), and before publishing. "Before publishing" means the client opening Publish, or any refused attempt to mark Ready to publish. Ready to publish is then refused (`NOT_CRITIQUED`) until that review has run and every finding is answered.
- **Hold:** while a review is due or a finding is unanswered, the consultant's hand-back is carried on under the existing continuation limit and spend ceiling (REQ-409). The order is layout faults, then the review, then REQ-428's promises.
- **Re-check:** one only, after a fixed high-severity finding. A `decision` answer opens the decision on the plan.
- **The client never sees it:** nothing about the review appears on their plan panel or in the conversation they reopen. The consultant is told the top finding is the weakest point to name to them.
- **Log:** every review, finding and answer is kept on the plan's `critique` record, and the tool calls are in the audit log.

**Changed elsewhere:**
- REQ-415's ready-to-publish test now runs a review before marking the stage, because publishing waits for the review too.
- REQ-428 landed in the same files while I was working, and I merged the two by hand.
- I trimmed the new tool summaries to fit the consultant's prompt-size limit (BUG-129). It now sits only just under the limit.

**Tests:**
- `tests/test_UAT_FC_REQ-427_the_critic.workers.test.ts` has 4 passing tests, covering the four items in the ticket's test plan.
- To check they can fail, I broke the hold, the image blocks and the transcript filter one at a time; each turned the right test red.
- After the merge, the full workers project matches the clean-working baseline: 1684 pass, and the 11 failures are the same ones that fail on clean working.
- The node project shows no new failures. A few tests fail only because they run in a worktree (missing `.xgd/tmp` and webui packages, and a built `dist-assets` copy that trips one check); they don't touch this change.

**One existing gap I left alone:** REQ-415's layout-fault cue still shows in the client's reopened conversation, though the review and promise cues are hidden.

<!-- xgd-turn id="6c1c6cb2-2a20-4336-8454-99d7bf55d9e3-user" -->

<!-- xgd-chat role="user" ts="2026-10-22T22:14:50.993589+00:00" -->
#### You
Is this finished?

<!-- xgd-turn id="6c1c6cb2-2a20-4336-8454-99d7bf55d9e3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-22T22:16:23.857813+00:00" -->
#### Claude
Yes, my part is done. I've just checked:

- **Ticket:** REQ-427 is at `free_coded`, version 0.2.583.
- **Commits:** all three recorded commits are on xgd-working.
- **Branch:** the branch and worktree are cleaned up.
- **Ticket body:** it keeps your original design and adds a "What landed" section. That section records the main change from your design: the critic runs as its own one-turn session with real screenshots, not through `Delegate`.

Still open:

1. **Reconcile:** promoting it to `ready_to_reconcile` is your call. I don't set that status.
2. **Not tried live:** it's only been tested in the scripted UATs. No real consultant run has used the critic yet, and dev won't have it until someone runs `bin/deploy --env dev`.
3. **Left out of scope:** the items under the ticket's "Deferred" heading. Also the gap I mentioned: REQ-415's layout-fault cue still shows in the client's reopened conversation, though the review and promise cues are hidden. That needs its own change if you want it fixed.

<!-- xgd-chat-end -->