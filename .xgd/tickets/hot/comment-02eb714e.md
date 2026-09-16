---
uid: comment-02eb714e
id: COMMENT-3009
type: comment
title: Comment on request REQ-251
created_by: xgd
created_at: '2026-09-16T00:24:30.878076+00:00'
updated_at: '2026-09-16T00:47:09.324937+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d118c0fc
  kind: chat_transcript
---

<!-- xgd-turn id="a069e4fe-3681-478d-94fe-ca65ce834814-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T00:24:00.624002+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a069e4fe-3681-478d-94fe-ca65ce834814-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T00:47:08.480654+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Now let me look at the settings pane and the chat panel's change-notification mechanism.

Now the AI surface declaration.

Now the host side: where `SITE_CHANGED` events are emitted.

Now let me look at the workers-side BUG-43 test and the scripted model client — the vehicle for "somebody has to drive it".

Now let me look at the REQ-239 settings session workers test — the existing precedent for driving the settings assistant.

Now I have the full picture. Let me record my plan on the ticket and start.

Ticket recorded. Now cutting the branch.

Good — worktree has REQ-249's work and node_modules. Starting with the host-side signal.

Now I'll add the write-counting seam to `settings-core.ts`.

Now close the `announced({` call and thread the hook through the toolbox.

Now the host side — the event kind, the counter, and the settings branch of `streamPrompt`.

Now wire the counter into `buildBusiness` and emit the signal in the settings branch of `streamPrompt`.

Baseline green. Now the client half — `chat.js`.

Now the pane's re-read. First a `refresh` on the hostname section that leaves a half-typed candidate alone.

Now the pane's `reload()`, and the api helper for re-reading the record.

Now the pane's `reload()`.

Now update the pane's transport JSDoc and wire `app.js`.

Now the declaration — reconciling its vocabulary with REQ-249's shipped copy.

Now the tests. Starting with the end-to-end suite that drives the assistant.

Now writing the end-to-end drive suite.

Good — `HOSTNAME_TAKEN` is asserted and passing. Now the vocabulary suite tying the declaration to REQ-249's shipped copy.

Now the browser half — the signal and the pane's re-read.

Let me verify these tests actually fail against the bug — a quick falsification check.

The origin half of the signal is uncovered — nothing proves the host emits the frame. Let me look at BUG-43's precedent and close that gap.

Now covered end to end. Let me also falsify the "derived from the declaration" claim, then run the full suite.

Every claim falsifies. Now the regression scope — everything touching the settings surface, the chat pane, and the builder.

These are REQ-238's tests pinning wording I renamed beyond what this ticket requires. Reverting the structural names — the ticket's rule is about `domain`, not `hostname`.

All green. Now the wider regression scope — the chat pane, the builder, and everything reading the settings surface.

While the full sweep runs, let me review my own diff.

One hazard in the new lookup: an event kind like `constructor` would hit `Object.prototype`. Fixing with a null-prototype map.

Pre-existing failure, unrelated to this change. Let me check the sweep.

527 pass across every file that depends on what I changed; the one failure is the pre-existing BUG-67 one I confirmed on a clean tree. Now committing.

Now merging back into `xgd-working`.

A clean additive conflict with REQ-250, which landed meanwhile. Aborting to re-base my version bump above theirs.

Resolving both conflicts — keeping both new methods, and the higher version.

Before committing the merge, let me verify the merged result actually works — both REQ-250's and REQ-251's tests.

Finally, syncing the ticket body to what actually shipped.

Done. REQ-251 is at `free_coded`, commit `5800000879` merged into `xgd-working` as `bf384e9f97`, version `0.2.210`.

## What I built

**The pane and the chat now know about each other.** `business_changed` is a new event kind beside `site_changed`, emitted by the settings branch of `streamPrompt`. It's *derived* — a count of write operations that actually returned, where "which ops are writes" is read out of the declaration's own `effect: "write"` entries rather than a list beside it. So a refused claim announces nothing, and a future settings operation is announced the day it's declared. `app.js` hands `settingsChat` the one line the site chat has had since BUG-43.

**The pane re-reads rather than being written to.** The signal carries a count and nothing renderable, so `settings.reload()` goes back to the routes the tab already reads on open. No new route: the name comes from `/api/businesses`, which the shell already fetches. A re-read that finds no news changes nothing — a half-typed hostname candidate survives a turn that renamed the business.

**The declaration and the field say one set of rules**, tied together by test: the pane's exported sentences are imported and their phrases required to appear in the declaration, so a rewrite of either turns the other red.

**Somebody drove it.** Twelve cases take real turns through the Worker's route table over real D1. None of the three address operations had ever been called through the shipped host — this is the first time several candidates are checked in one turn, the first time each refusal is produced, and the first time the race exists at all (produced by landing a rival's claim in the gap between the model's check call and its claim call).

## Three things worth your attention

**The verification limit.** A scripted model can't prove the model *chooses* to check several candidates before speaking, or *declines* to claim when told "just pick one" — those are judgement, and the declaration is where they're asked for (I strengthened the "just pick one" absence explicitly). The suite proves those behaviours are reachable and correct when taken. If you want a live observation to close the ticket's "unobserved" falsifier properly, you'd need to run it — there's no API key in `.dev.vars.local` here. Say the word and I'll record what it actually said on the ticket.

**Two names left as `hostname`.** The `absences` headings REQ-238 pins, and `hostname_label`. Your rule is about `domain`; renaming those would have broken REQ-238's evidence for no gain, and the overview now states explicitly that `hostname` is the declaration's word for the operations and not a word to say out loud. If you'd rather they change too, that's a one-line edit plus updating REQ-238's two tests.

**A merge you should know about.** REQ-250 landed on `xgd-working` mid-session and also added a method to `hostname.js` (`reveal()`). The conflict was additive — both methods kept — and I re-based my version bump above theirs to `0.2.210`. I verified both tickets' suites pass on the merged result before committing.

One pre-existing failure remains in `test_UAT_FC_BUG-67_backend_settings` (`rejects a malformed document at install`) — I confirmed it fails on a clean tree, so it's not from this work, but it is red on `xgd-working` right now.

<!-- xgd-chat-end -->