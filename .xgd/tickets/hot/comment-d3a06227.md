---
uid: comment-d3a06227
id: COMMENT-6241
type: comment
title: Comment on request REQ-627
created_by: xgd
created_at: '2026-11-01T21:22:47.012982+00:00'
updated_at: '2026-11-01T23:00:25.852405+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4663dfd6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "afcc9dd2-a0f3-414b-bebf-0cf7fed85124",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7401363f-939b-4c86-a265-2df69cb6793a-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T21:20:40.121104+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="7401363f-939b-4c86-a265-2df69cb6793a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T21:31:40.065712+00:00" -->
#### Claude
Depends on REQ-624 and lagrange-framework REQ-232 — checking their state first.

Both dependencies are landed on xgd-working. Now REQ-624's implementation (the runner this builds on).

Now how 1st Contact loads the framework and whether the loaded copy has REQ-232.

The shared store already carries REQ-232. Reading the REQ-624 runner code.

I'm still reading how the host currently wraps Delegate, so I can see what detached mode would break before I change anything.

I have enough to see the design gaps; I'm writing up the questions on the ticket now rather than starting code.

I haven't written any code yet: there are five design gaps to settle first. Both dependencies are in place. REQ-624 is `ready_to_reconcile`, and lagrange-framework REQ-232 is on its xgd-working and in the shared framework copy this repo loads. But switching the Site consultant's Delegate to REQ-232's non-blocking mode would silently break five things. I've added these questions to REQ-627's body; the ticket stays at `draft`.

1. **The extra fields 1st Contact adds to a builder's result would be lost.** Today it adds `wrote`, `activity`, `ended`, a summary for a builder that reported nothing, and the trimmed account of changes. In non-blocking mode the framework records its own plain result, and offers no hook to change it before recording. My recommendation is a small hook in lagrange-framework. I'd file that as a ticket there and write no framework code from here. The other options are overriding a framework-internal method (fragile), or going without these fields.
2. **Replacing a builder that ran out doesn't fit.** Today a builder that runs out of calls, time or context is replaced inside the same Delegate call. I recommend dropping that for non-blocking passes. The consultant's next round sees `ended` and what was changed, and delegates the rest as a further build step. Keeping it would need a new framework API.
3. **The account of what a builder changed breaks across steps.** The opening snapshot of the site is held in memory, keyed by an object that doesn't survive into the step that ends the pass. Without a fix there's no change list, no `wrote`, and every check the host answers itself comes back unreported. The same breaks the saved build cases. I propose saving the snapshot under the builder's session id, in R2 where the host has it and in memory for the CLI and test suites. Is that acceptable, or should it use a different store?
4. **The rule from BUG-296 would stop every non-blocking builder as soon as it starts.** That rule stops a consultant turn's builders when the turn ends, and a non-blocking hand-off ends the turn straight away. I propose exempting these builders from it. Stop would still reach them through the framework's own stops and the job's Stop. Can you confirm?
5. **The "still building…" lines would go quiet.** The framework says a non-blocking pass prints no progress lines. I recommend the build step write those lines itself, so the panel shows them as it does today. The other option is to accept the silence until REQ-625's "k of n" counter lands.

This is bigger than the ticket reads, about 13–20 points. The host's per-builder bookkeeping (spend metering, the first-pass tracking, layout faults owed) has to carry from one step to the next, the way REQ-624 carries the message state.

Once you answer, I'll cut the branch and build it.

<!-- xgd-turn id="d552e367-f8b8-4488-8f6f-9d11228b598d-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T22:35:03.883752+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="d552e367-f8b8-4488-8f6f-9d11228b598d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T22:36:24.524767+00:00" -->
#### Claude
The operator answered all five. Decision 1 needs a framework hook that doesn't exist yet, so I'm checking whether one is already ticketed or built, and where REQ-625's step list stands.

No hook exists yet and nothing has been filed for one; REQ-625 has landed. Filing the lagrange-framework ticket now, as decision 1 directs.

Not quite. Your answers settle the design, but one prerequisite is missing.

**The blocker is decision 1.** 1st Contact adds its own fields to a builder's result: `wrote`, `activity`, `ended`, the summary for a builder that reported nothing, and the trimmed change list. Those fields can only reach a non-blocking result through a framework hook, and that hook doesn't exist. I checked the framework copy this repo loads and the lagrange-framework tickets. As you directed, I filed it as **lagrange-framework REQ-630** (`request-87b5f9c9`) and wrote no framework code. It covers a `passResult` hook that shapes a non-blocking pass's result before it's recorded, in both the JS and Python peers, with its own test plan. I added REQ-630 to REQ-627's body as a new dependency.

Everything else is settled. Your decisions 2–5 are clear, and REQ-625's planned-steps list, which decision 2 adds to, has already landed.

I see two ways forward:
- **Wait for REQ-630 (my recommendation).** I build REQ-627 in one go once the hook is in the framework copy, and every test passes when committed.
- **Start now.** I build everything except the result fields, wiring the hook in by name. The test for those fields would have to wait for REQ-630, since I can't commit failing tests. That splits the work across two sessions.

Which do you want?

<!-- xgd-turn id="204d1ae6-501c-4a9e-8719-3a5c66fc8713-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T22:38:01.695614+00:00" -->
#### You
If you need LF work that's easy, just raise an LF ticket and I will get it done

<!-- xgd-turn id="204d1ae6-501c-4a9e-8719-3a5c66fc8713-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T22:38:41.254226+00:00" -->
#### Claude
Understood. The one piece of lagrange-framework work REQ-627 needs is already filed as **REQ-630** (`request-87b5f9c9`, still `draft`). It adds a `passResult` hook that lets 1st Contact add its fields to a builder's result before the result is recorded, in both the JS and Python peers. It's small and self-contained, and its test plan is in the ticket.

Nothing else in REQ-627 needs framework changes, so REQ-630 is the only blocker. Once it's merged into lagrange-framework's xgd-working and the shared framework copy has been reinstalled, tell me and I'll cut the branch and build REQ-627 in one go.

<!-- xgd-turn id="13ed0f23-d8a6-4a63-b167-ed38b1788c65-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T23:00:22.192625+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-chat-end -->