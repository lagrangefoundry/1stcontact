---
uid: comment-d5e94ad8
id: COMMENT-7807
type: comment
title: Comment on bug BUG-349
created_by: xgd
created_at: '2026-11-05T02:29:46.407240+00:00'
updated_at: '2026-11-05T02:42:42.400298+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-62b414ac
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1ef7814f-3387-4e69-b66c-4e78a665df80",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d2ded4f1-904d-4638-b231-b07a80e8ef81-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T02:28:54.269419+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d2ded4f1-904d-4638-b231-b07a80e8ef81-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T02:42:41.780485+00:00" -->
#### Claude
Reading the existing cue-hiding mechanism (BUG-285's `isHostCue`) to extend it to builder results.

Tracing how the host's round prompt is recorded as a user turn, to find where to attach a host-origin marker.

Checking whether the framework's `promptStream` can carry a marker onto the recorded user turn (e.g. `cued`/`speaker`).

Working out which rounds' prompts are the client's own words vs. the host's (MessageState.prompt assignments).

Scope is clear and the ticket body is complete; no questions needed. Moving to `free_coding` and cutting the branch.

Now implementing. First, the marker and recognizer in `roles.ts`:

Now marking the rounds at record time.

Same class of leak at 6005: an interrupted delivered-result round would be handed back as the client's unsent message. Checking `previousTurn`.

Fixing the doc-comment placement (my `hostWrote` landed between `messageRound`'s existing docblock and the function).

Code done. Now the UAT — looking for an existing test that drives a real detached Delegate → delivered round, to reuse its rig.

Writing the UAT now. Checking how BUG-277 makes a round error so the host carries on with its cue.

Writing the workers UAT (builder result + error carry-on through the real route, then reload) and a node UAT for historic unmarked turns.

Running the new UATs and the neighbouring BUG-285/BUG-277 suites.

Both pass. Confirming the builder-result UAT is red without the fix:

Red reproduces the exact symptom. Now checking the marker alone does the job (historic heads disabled):

Marker alone suffices. Now typecheck and the neighbouring suites (opening cue, interrupted turn, tester timeline, delegation).

Two REQ-295 failures — checking whether they're pre-existing by running the same suite on the main checkout (unchanged code):

Those two fail identically on clean xgd-working — pre-existing, not mine. Typechecking the touched packages:

Clean. One more check — that a `speaker` on an ordinary consultant session isn't read as a room anywhere:

All clear. Preparing the commit — checking the project's version-bump convention first.

Committing the work on the branch, then updating the ticket body before merging back.

Now updating the ticket body, preserving the existing sections and adding what landed:

Merging back: lock → merge xgd-working into the branch → bump → xgd-merge → move-to-free-coded (retry loop per the memory, since ticket commits race the tip).

Landed at free_coded on the first attempt. `host-core.ts` auto-merged with newer xgd-working changes, so re-running the UATs against the merged tip:

BUG-349 is fixed and merged into xgd-working. When the Site chat reloads, builder results and the host's cues no longer appear as the client's messages, and the consultant still receives exactly what it got before. The ticket is at `free_coded` (version 0.2.779, 2 story points), so promoting it to `ready_to_reconcile` is up to you.

**The fix**
- **Marking:** every user turn the host writes is now saved with a `speaker: "host"` tag. That covers builder results, carry-on, stall, error and review cues, the finished cue and the opening cue. The framework stores this tag but never sends it to the model, so the consultant's history doesn't change. One rule decides it: a round is the host's if its prompt isn't the client's own message, or if the message is itself a host cue.
- **Hiding:** one check, `isHostTurn`, skips a user turn if it carries the tag, matches a `*-cue` template (the earlier BUG-285 fix), or is an old untagged turn starting with `[The result of your Delegate call with handle ` or `[The host, not your client`. The second test covers old transcripts like this site's, and stored transcripts are never rewritten.
- **Where it applies:** the reload replay, and the tester timeline.
- **A second leak, also fixed:** if a builder-result round died partway through, it would have been handed back to the client as their own unsent message. The same check now stops that.
- **Live panel:** no change was needed, because it never draws user turns from the live stream.

**Tests**
- **Builder-result reload test (real route):** fails without the fix, with the builder's JSON in a client bubble. It passes with the fix, and still passes with only the tag and the old-transcript check switched off. It also confirms the consultant's next round still receives the builder's result.
- **Carry-on cue test:** after an errored round is carried on, reload shows only the client's message.
- **Old-transcript test:** an untagged builder result, and a cue in wording no current template uses, are hidden; the client's own messages around them stay.
- **Existing suites:** the neighbouring suites pass and the typecheck is clean. The two new test files and the BUG-285 and BUG-324 suites were run again after the merge and still pass.
- **Already broken:** two REQ-295 delegation tests fail, and fail the same way on xgd-working without my change.

The ticket body has a "What changed" section and a UAT list added below your original text.

<!-- xgd-chat-end -->