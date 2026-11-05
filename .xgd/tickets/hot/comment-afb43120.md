---
uid: comment-afb43120
id: COMMENT-5946
type: comment
title: Comment on bug BUG-324
created_by: xgd
created_at: '2026-10-31T22:48:05.577510+00:00'
updated_at: '2026-10-31T23:28:16.759565+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-306659ae
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "26303579-8d56-46be-9e33-652506ff3620",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c83c3202-6105-4ab5-9d5b-e98af74036a9-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T22:46:39.553060+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="c83c3202-6105-4ab5-9d5b-e98af74036a9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T22:53:04.693032+00:00" -->
#### Claude
Reading the ticket and the code for the carry-on cue, the restore-to-box path and the memory path, so I can scope it and raise any questions.

Checking why the hidden-cue filter missed the carry-on cue (it should already be hidden by its `-cue` name).

Quick measurement: parsing the largest dev junction into retained, frozen records, the way the cache does.

I have enough to ask the questions that decide the memory fix. First I'll record the findings on the ticket, keeping the existing body as it is.

I've diagnosed the bug but not changed any code yet. The memory fix depends on four decisions, so I need your answers first. The findings are written up on BUG-324.

**What's wrong**
- **The cue shown as the client's message (symptoms 2–3).** When a turn dies, the code checks whether its prompt made it into the conversation history. The carry-on cue is deliberately hidden from that history, so it never matched. The dead carry-on was then treated as the client's own unsent message: painted as theirs at 21:47:08 and put back in their box. The fix is small and in this repo: a host cue is never treated as the client's message, and the client gets the "The work stopped…" notice with Carry on instead.
- **Memory (symptom 1).**
  - **Screenshots are kept in full in the session's log.** The largest local dev log is 27.6 MB, and 21.3 MB of that is 42 screenshots at about 0.5 MB each. Every screenshot makes the session's log permanently bigger.
  - **The framework never lets go of those logs.** Framework BUG-102 (landed 10-29) added a shared cache that keeps every session log an isolate has read, for every business, and never clears it.
  - **The measured cost:** one cached session of this size holds 32.6 MB, and the first read in a fresh isolate peaks at roughly 90–110 MB.

  That fits everything in the log: memory growing as the day went on, a screenshot-only turn dying, and another business's turn dying in the same isolate. I haven't yet confirmed that the 01:07Z production deploy includes that framework change; the local framework copy does.

**Questions**
1. **The framework cache.** The fix belongs in lagrange-framework. It could cap the cache by size and evict the oldest session, or drop a session's entry when its turn ends. Under our cross-repo rule I'd only file a ticket there, with the measurements and a suggested design. Shall I file it? And do you want it treated as blocking for this ticket's memory target?
2. **Screenshots in the log.** Which do you want?
   - (a) Keep screenshots out of the log: log a short reference instead and leave the image only in what the model is sent. That's also a framework change, since the framework writes tool output to the log.
   - (b) Shrink them here: encode the screenshot's image as a small JPEG/WebP, about 5× smaller. It's a mitigation, not a bound.
   - (c) Both. I'd suggest (c), with (b) done in this ticket.
3. **Logs that grow for ever.** Even with 1 and 2, a session's log never shrinks. Should this ticket compact it when no turn is running and it passes a size limit (start a fresh log seeded with just the conversation history), or leave that out of scope?
4. **The memory test.** I can't get Ariel's production log from here. Is it acceptable to test against a synthetic session at the 27.6 MB dev-log size and at 3× (screenshot-heavy, like the real one)? Or can you export Ariel's?

The cue fix and the scroll fix (symptom 4, which I'll trace as I implement) don't depend on these answers. Say "go" on those and I'll start them now, on their own branch.

<!-- xgd-turn id="808d83e5-716b-4dcd-8577-1c235f32eba4-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T23:15:21.780996+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="808d83e5-716b-4dcd-8577-1c235f32eba4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T23:28:14.072189+00:00" -->
#### Claude
Filing the framework ticket first (draft, ticket only, no code there).

Framework ticket is lagrange-framework BUG-105 (`bug-14fa0939`). Now checking whether production's 01:07Z build included the cache.

Production's current build (redeployed 22:40Z) contains `RECORD_CACHES`. The 01:07Z build came 27 hours after BUG-102 landed. Moving to the code in the worktree.

Fix 1: `interruptedTurn` must not treat a host cue as the client's words.

Now the scroll (symptom 4): tracing what repaints on a lost turn.

`paint()` destroys and remounts the chat, so a lost-turn repaint loses scroll position. Checking what the chat component exposes for scrolling.

Implementing the scroll-keeping helper in `chat.js`.

Now the screenshot shrink. Finding where the screenshot tool encodes its image.

Low-detail screenshots already go through a lossy encoder (BUG-229). Checking what the logged screenshots actually were: their media type, detail level and size.

Implementing the change in fidelity-core: one encoder for every detail, keeping the PNG whenever it is the smaller of the two.

Important: BUG-229's UATs say the junction already keeps no image bytes, which would contradict my screenshot finding. Checking.

After BUG-229 the junction is dominated by `context` records: 14.6 of 19.1 MB, and 10.1 of 13.6 MB. Looking at what they are.

Each turn writes one ~134 KB `context` record (the whole priming, reminder and volatile system text). Over 106 turns that is 14 MB, and it grows linearly with turn count. Checking who writes it.

The framework's manager writes a full `CONTEXT` record on every turn. Checking how much of it repeats from turn to turn.

A 19.1 MB post-BUG-229 junction holds 35.6 MB of heap once cached. Correcting framework BUG-105: replacing the image item with the priming dedupe.

Writing the UATs now, starting from the BUG-312 workers suite, which already stages a lost carry-on turn.

Writing the server-side UAT: a dead carry-on turn, with the pending record the real turn would have written.

All pass. Checking that the new UAT fails without the fix.

The UAT fails without the fix and passes with it. Now the panel UATs for scroll and for what the client sees. Looking at how the BUG-294 panel suite triggers a lost-turn chase.

Both pass. Checking the scroll UAT fails without the `chat.js` change.

The scroll UAT fails without the change and passes with it. Running the regression scope: the panel and lost-turn suites.

Five failures. Checking whether they're pre-existing by running the same files without my changes.

The same five fail without my change, so they're pre-existing. Running the workers suites that touch interrupted/lost turns.

All 58 pass. Running lint and typecheck on the changed files.

Typecheck is clean. Checking this project's version-bump and free_coded gate conventions before committing.

Before committing I'll sync the ticket body so every UAT traces to it. Re-reading the current body first in case it changed again.

Ticket is synced. Committing on the branch.

Committed as `59ec4e66`. Now merging back with the retry loop from the promotion memory: lock, merge working into the branch, bump, fast-forward, then the free_coded gate.

Saving one memory, since the misdiagnosis is easy to repeat.

BUG-324 is at `free_coded` with the cue fix and the scroll fix. The memory fix isn't here: it has to be done in the framework, and one of my earlier findings was wrong, which changes your Decision 2.

**The correction.** I told you screenshots were filling the session log. They aren't: the log I measured dates from 10-18, and since BUG-229 (10-19) screenshots are stored as placeholders. On newer logs, three quarters of the size is a ~134 KB record the framework writes on every turn. It repeats the whole priming text, which was unchanged in 100 of 106 turns. A 19.1 MB log takes 35.6 MB of memory once the framework's cache holds it, and that cache never lets go.

Because of that:
- **Screenshot shrink: built, then reverted before commit.** It would have lowered the image quality the model sees and saved no memory. Undo the revert if you still want it for other reasons.
- **Framework ticket: lagrange-framework BUG-105 (`bug-14fa0939`), at draft.** It asks for both of your cache changes (drop a session's cache when its turn ends, and an LRU cap by bytes). In place of the screenshot item, it asks the framework to write the priming text only when it changes. That should cut log growth from about 180 KB to about 65 KB per turn. The memory UATs belong with that ticket.
- **Production:** the build live now (redeployed 22:40Z) has the cache. The 01:07Z build can't be downloaded, but it was built 27 hours after the cache landed, so it almost certainly had it.

**What landed** (commits `59ec4e66…`, `3699fb37…`, version 0.2.718, 3 story points):
- **Cue shown as the client's message (symptoms 2–3).** One cause: when a turn dies, the server checks whether its prompt made it into the conversation history, and the cue is always hidden from that history. Now a dead turn whose prompt is a host cue isn't reported as the client's message. The client sees the "The work stopped…" notice with Carry on, and their composer is left alone. A dead turn with the client's own words is still handed back as before.
- **Scroll (symptom 4).** The repaint after a lost turn now puts the reader back where they were: at the bottom stays at the bottom, scrolled up stays put.

**Tests:** four new UATs pass, and the two that cover the fixes fail without them. The 11 workers suites that cover lost and interrupted turns pass. Of the 36 panel suites, five tests fail (AC1065, AC1070, BUG-64, BUG-244, REQ-127), and they fail the same way without my change.

The ticket body is updated with the corrected findings, the as-built test plan, and a note that Fix 5 (deploying BUG-320) is yours to do.

<!-- xgd-chat-end -->