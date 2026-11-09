---
uid: comment-fceab690
id: COMMENT-8141
type: comment
title: Comment on bug BUG-409
created_by: xgd
created_at: '2026-11-09T18:34:34.704370+00:00'
updated_at: '2026-11-09T20:52:20.457092+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6abcdd97
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7ac5ad6f-17e5-40dd-8ebc-572d1de294d8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="48ea8a9b-1c79-4b46-846f-ac14d274d4c7-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:33:49.777486+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="48ea8a9b-1c79-4b46-846f-ac14d274d4c7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:36:58.697043+00:00" -->
#### Claude
Checking BUG-409 against its neighbours (BUG-405, PLATFORM_ISSUE-14) to see if any part is a duplicate, then sizing the code.

Sizing the five parts: the host hold (part 3) is a small change in `continuedTurn`. The "proposed plan" state (part 2) is a new feature, so I'm checking how the plan and the Input board are built.

I haven't changed any code yet. BUG-409 isn't a duplicate: BUG-405 covers the hold for layout findings only, and nothing else open covers plan hand-over, plan approval or opening a piece's page. Before I build, I need your call on a few points, because part 2 contradicts a decision already in the code.

**1. Part 2 conflicts with REQ-657 and REQ-638.** An approval step already exists: `agree_plan` records the client's agreement in their own words. But both tickets deliberately made it optional ("Welcome, never required", "Nothing waits for the plan"). There are two ways to do part 2:
- **(a) Light (my recommendation).** If `set_plan` rewrites a plan that hasn't been agreed, or replaces one that has, the plan is marked unagreed. The Input board then shows it as "Proposed — waiting for you", with the last agreed plan folded underneath. The consultant must ask for approval in its hand-over, and approving goes through `agree_plan`. No tool refuses work before approval. This matches the DOC-82 direction (a client-owned plan, no new host gates).
- **(b) Full, as the ticket is written.** `set_plan` stores a separate pending proposal and the live plan stays unchanged until it's approved. The host also refuses work on later steps the client didn't ask for until then. That is a new gate and reverses REQ-657.

**2. The approve control on the Input board.** I'd add "Approve" and "Suggest changes" buttons. Each one sends a chat message in the client's name ("I approve the plan" / "I'd like to change…"), and the consultant records it with `agree_plan`, so the approval stays in their words. The alternative is a direct button action that records approval without going through the consultant. Is sending a chat message OK?

**3. Duplicate links on a collection card (part 5).** I'd hide the photo link from screen readers and from tabbing, because it repeats the name link. That leaves one link per piece, and clicking a piece by name works. This changes the shared site framework, so every published shop gets it on its next publish. Is that OK? I'd also make `screenshot` accept a piece's name or slug and open `/shop/<slug>`, and add that address to the knowledge base.

**4. One ticket.** I'd keep all five parts on BUG-409 (about 13 story points with option 1a). Also, BUG-405's session is editing the same lines in `continuedTurn` right now. I'll reuse its "the reply asks the client a question" check and merge after it lands. That may mean a small manual merge.

If you're happy with 1a, button-sends-a-message, hiding the photo link, and one ticket, reply "go" and I'll implement it.

<!-- xgd-turn id="0832fb48-a9f8-4ecb-91b9-cdebfddce501-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:26:59.890835+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="0832fb48-a9f8-4ecb-91b9-cdebfddce501-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:52:19.479176+00:00" -->
#### Claude
Links already exist: `#show=plan` opens the plan on the Input board. Starting the free-coding flow.

Worktree is ready. Starting with part 5's card change in the framework.

Card change is written. Next, the `screenshot` tool, so a piece can be opened by name or slug.

Wiring `screenshot`'s product lookup: `PictureDeps` has no catalogue access, so I'm finding where the host builds those deps and how it reads the catalogue.

Plan for the product lookup: add an optional `products` reader to `PictureDeps`, fed from the preview renderer's catalogue. Checking what `PreviewRenderer` exposes.

Adding the `product` field to `screenshot`'s picture source, resolved through a new `products` reader.

`screenshot` can now take a piece by name or slug. Next, adding the `/shop/<slug>` address to the knowledge base. Finding the doc that covers the shop.

Now the hold itself (part 3) in `continuedTurn`.

Hold and pending-question tail are in. Now the plan state in `plan-core.ts`.

Plan state is done. Now the review hand-over wording in `critique`'s result, then the Input board UI.

Now part 4's rule. I'm adding a sentence to rule 12 ("Check what builders made") in the consultant's rules.

Now the Input board: the "Proposed — waiting for you" badge, Approve and Suggest changes buttons, and the earlier agreed plan folded underneath.

The only typecheck errors are in two files I didn't touch (`material-import.ts`, `zip-reader.ts`). Typechecking the other packages.

Typechecks pass. Writing the UATs, starting with the card. First checking how `click "<name>"` finds its target.

Card UATs pass. Next, the `screenshot`-by-product UAT. Looking at how BUG-338's suite drives `screenshot`.

Screenshot UATs pass. Next, the plan UATs. Looking at how REQ-657's tests drive `set_plan`/`agree_plan` and the plan panel.

Writing the plan UATs. The test plan says the board shows the agreement "in the client's words", so I'm also adding the client's quote under "Agreed with you".

Now the plan-tool UAT (the real consultant toolbox over the real plan surface).

Plan-tool UATs pass. Now the Input board UAT in the real builder (jsdom).

Board UATs pass (3 run, none skipped). Next, the host-hold UAT, modelled on REQ-428's promise suite.

Passes. Checking that it fails without the hold, by disabling the hold temporarily.

The UAT fails without the hold, so the fix is what makes it pass. Next, part 1's hand-over: checking how existing suites drive `critique`.

Adding one more board case: the hand-over's `[the plan](#show=plan)` link, clicked in the chat, opens the plan on the Input board.

Now the review hand-over UAT, on REQ-427's critic harness.

The tool result clips long strings, so the model only sees part of my `say`. Checking how other `say` results avoid clipping.

The fix is to attach `say` after the clip, the way `said()` does. Moving it out of the edit in `set_plan`.

Plan UATs pass. Running the neighbouring suites: plan, critic, holds, catalogue render, screenshot and priming budgets.

Five failures. Running the same five suites on clean xgd-working to see which were already failing.

All five fail on clean xgd-working as well. Two of them are prompt-size budgets, so I'm comparing the sizes to see how much I added.

Same failures on both sides, so neither comes from my change. Running the suites that touch catalogue rendering and the rules text.

One extra failure on my side: `REQ-416_stop_building_stops_the_work_from_any_request`. Re-running it on its own to see if it's load.

It passes on its own, so it was load. Running lint on the changed files.

Two stray symlinks (`packages/framework/framework`, `packages/site-schema/site-schema`) came from my worktree setup. Checking them before removing.

No linter is installed at the root. Re-running the typecheck after the last edits.

Typechecks are clean. Updating the ticket body before committing, so every UAT is backed by its wording. I'm keeping the existing sections and adding "What changed" and design notes.

Ticket updated. Committing on the branch, then merging with the version bump.

Committed (`043020be`). Now the merge-back sequence: lock, merge xgd-working into the branch, bump the version, then fast-forward back.

Re-running the BUG-409 UATs after merging xgd-working in, since `plan-core.ts` auto-merged.

It moved to `free_coded`, but printed a version warning. Reading the full message.

Commits and version are recorded on the ticket. Setting story points, then cleaning up the branch.

Branch cleaned. Checking that the main checkout has no links left pointing into the deleted worktree.

Main checkout is clean. Last step: the KB wording, which no test pins, in "What the tool can do today".

I've implemented all five parts of BUG-409, merged them into xgd-working, and left the ticket at `free_coded` (commits `043020be` and `530e3c38`, version 0.2.855, 13 story points). The six new UATs pass (12 tests). I also confirmed that the hold test fails when the hold is switched off.

1. **Review hand-over:** after a review, the consultant is now told to end with one hand-over:
   - the verdict in a sentence;
   - the findings that matter, most important first;
   - the plan as numbered steps with a link that opens it on the Input board;
   - one question asking the client to approve the plan, and nothing else asked.
2. **Proposed plan:** a plan the client hasn't agreed, or a rewrite of one they had, now shows on the Input board as "Proposed — waiting for you", with the plan they agreed before folded underneath.
   - **Approve** sends "I approve the plan." in the chat as the client's own message, and the consultant records it with `agree_plan`.
   - **Suggest changes** puts "I'd like to change the plan: " in the message box and sends nothing.
   - Once agreed, the board shows "Agreed with you" and the client's words.
   - A plan only moving forward (next → now → done) stays agreed, and no tool is refused while a plan is waiting.
3. **Nudges held:** while the consultant's last message ends on a question, the host no longer sends its "still owed" reminder. The task stays owed, and the reminder comes after the client answers. If the host does carry a reply on, the consultant is told to end by asking the same question again.
4. **Checks stay the consultant's:** one sentence added to rule 12. If a tool stops a check the client asked for, the consultant says what it couldn't check and why, and doesn't ask the client to do it unless it genuinely needs them.
5. **Opening a piece:** `screenshot` now accepts a piece's name or slug and opens `/shop/<slug>`; an unknown name is refused with nearby names and the address form. On every catalogue card, the photo's link is hidden from screen readers and tabbing but still works on a click, so `click "<name>"` finds one link. Shops pick this up at their next publish. I also updated the knowledge-base doc "What the tool can do today" to give the `/shop/<slug>` address. That doc ships from the main ticket store, so the wording goes out with the next deploy.

**Decisions to check:**
- **No "quick owed task" exception.** The host can't tell whether an owed task is quick, so the reminder is always held while a question waits. The consultant can still do a quick task on its own in the same message.
- **"Just build it" agreements.** If the client agreed before any plan was written, the first plan written counts as agreed. Any later rewrite shows as proposed.

**Things you should know:**
- **Prompt budget:** the consultant's authored prompt was already over its budget on clean xgd-working (202,798 against 191,200). My rule-12 sentence brings it to 203,085. As you asked earlier, I haven't trimmed anything here; the overrun is noted in the ticket for a separate review.
- **Failing tests not from this change:** nine suites fail identically on clean xgd-working (REQ-473, REQ-466, BUG-405, REQ-428, REQ-452, REQ-454, REQ-416). One REQ-416 case (`stop_building_stops_the_work_from_any_request`) failed only during a large batch run and passed on its own.

<!-- xgd-chat-end -->