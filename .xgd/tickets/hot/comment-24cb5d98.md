---
uid: comment-24cb5d98
id: COMMENT-5539
type: comment
title: Comment on bug BUG-241
created_by: xgd
created_at: '2026-10-21T01:22:24.425004+00:00'
updated_at: '2026-10-21T01:38:11.977114+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-0e27dba8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "64fce642-2b38-477f-b526-3113b3f33fd3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="93dbc7d7-c8aa-4f6c-afd0-5503bfe759f0-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T01:21:41.689828+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="93dbc7d7-c8aa-4f6c-afd0-5503bfe759f0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T01:38:10.533136+00:00" -->
#### Claude
Ticket is fully specified; I've set it to `free_coding`, cut branch `free-BUG-241`, and am now locating the priming reminder, host cues, and the chat bubble join.

Found the cue templates and the consultant's priming; now reading `chat.js` to see where consecutive assistant segments get concatenated into one bubble.

The bubble join is in the vendored `webui-chat`: it does `current.markdown += ev.content`, so nothing separates one segment from the next. Next I'm checking which events mark a segment boundary.

Segment break is in the backend wrapper. Now adding the same break between continuation rounds in `continuedTurn`.

Priming section and reminder are in. Now rewriting the host cues: the layout continuation, the REQ-409 continuation, and the post-build report. Checking which tests pin their current wording first.

All three cue sources are rewritten. Now updating the UATs that pinned the old wording (BUG-235, REQ-415, REQ-283).

Passing. Confirming the continuation test fails without the fix:

The test fails without the fix and passes with it. Now running the neighbouring suites: the three I edited, plus REQ-409, REQ-416, REQ-400 and the priming/roles tests.

Several failures. Some look like mine: BUG-65 bans DOC ids in priming, and I wrote "DOC-7". Others look environmental (workers suites failing to load). Reading the specific failures:

BUG-65 and REQ-171 are mine. The rest are environmental: missing `generated/` artifacts in a fresh worktree, and a stale `logDir` option. Checking what REQ-171 measures:

The per-turn reminder has a 600-char budget and the tail already used 598 with the old line, so the replacement can't be longer than the old one (80 chars).

Reminder is 82 chars, which puts the tail at exactly 600 against a `< 600` check. Trimming two characters:

Now running the second batch of priming-related suites:

The REQ-357 failure is mine: "Bob" is the coordinator's display name, and I quoted `…off?**Bob,` in a host-core comment. Rewording it:

Checking that the remaining failures are pre-existing: first the cause of the workers-suite load failures, then a clean-tree baseline for the node ones.

Missing `generated/` artifacts in the fresh worktree (a known location artifact). Copying them from the main checkout so the workers suites can actually run:

Rerunning everything that previously failed:

Seven files still fail. Several match known pre-existing failures (delegation suites, knowledge suites, the REQ-285 `logDir` error). Confirming all seven against a clean tree:

All seven fail the same way on the clean tree (27 failures there against 26 with my change), so none of them are regressions. Running lint and typecheck:

Typecheck is clean for host-core. Next: version bump and commit.

Committing. Per the version-gate memory, I'll skip the manual bump and let `move-to-free-coded` bump the version itself.

Committed `2554af92`. Now updating the ticket body to describe what landed, keeping the existing content.

Ticket body updated. Locking the branch and merging into `xgd-working`:

The conflict is with BUG-240, which added three `talker-cue` templates next to my `talker-discovery` edit. Resolving to keep both: my wording plus BUG-240's new templates.

Conflict resolved. Checking whether BUG-240's tests pin any of the talker wording I changed, then running both sets of UATs on the merged tree:

All 11 suites pass on the merged tree, including BUG-240's and the workers suites. Running the ticket rematerialize step, then moving the ticket to `free_coded`:

Ticket is `free_coded`, with the code commit and the auto version bump (0.2.564) recorded. Cleaning up the branch:

BUG-241 is done and merged into `xgd-working`. The ticket is at `free_coded` with two commits: `2554af92` (the code) and the automatic version bump to 0.2.564. I did not promote it to `ready_to_reconcile`; that's your call.

**1. Bold breaking in the live chat.** The cause was narrower than the ticket guessed. The framework already puts a blank line between text segments within one turn. The join only happened between a round and the continuation the host starts for it (REQ-409/415): the continuation is a new turn, but it streams into the same live bubble with nothing in between. The "…about 5 minutes._The opening movement…" case was the same thing. Now the first words of each continued round start a new paragraph, in `continuedTurn` in `host-core.ts`. The stored transcript was already fine, since it keeps rounds as separate turns. No change was needed in the vendored `webui-chat`, so there's nothing to file upstream. I first added a break after every tool call too, but that doubled the framework's own, so I took it out.

**2. Consultant priming.** A new section, "What your client hears", holds your vocabulary table and both `bc` rules, in both consultant priming orders. The old one-line reminder is replaced by a short pointer to the section: "One person to the client, naming none of our machinery: 'What your client hears'." It has to be that short: the per-turn reminder has a 600-character limit (REQ-171) and was already at 598. I also took "IMAGE-5 / DOC-7" out of the section, because naming a DOC id in priming fails BUG-65; it now just says Library labels are the client's own words.

**3. Host cues.** The two continuation cues and the report the host attaches after a build now:
- say they are guidance for the consultant, not words for the client;
- say "the build you started" instead of naming builders or "the layout check";
- tell the consultant to call it checking the page on a computer and a phone.

I also adjusted the talker cue: it no longer says "the worker's status" or "passed it on". Error messages the consultant might quote aren't reworded one by one; the new priming rule (anything from the host is guidance, not words to repeat) covers them.

**Tests**
- A new test file, `tests/test_UAT_FC_BUG-241_one_voice_and_separate_segments.test.ts`, with four tests:
  - the paragraph break shows live and after a reload;
  - a continued round starts a new paragraph (this one fails without the fix);
  - the priming has the new section and the old line is gone;
  - the cue wording.
- I updated the BUG-235, REQ-415 and REQ-283 tests that pinned the old wording.
- On the merged tree, those suites plus BUG-240's, REQ-416, REQ-409, REQ-171, BUG-65 and REQ-357 all pass (60 tests).
- Seven other files fail (REQ-174, REQ-285, REQ-295, REQ-342 and the reconciliation-assistant suites), and they fail the same way with my change removed.

**Merge**
- The merge conflicted in `priming.json` with BUG-240's new `talker-cue` lines; I kept both sides.
- The coordinator's own vocabulary reminder in group chat is unchanged; the ticket only covered the consultant.

The ticket body now has an "Implementation (as landed)" section describing all of this.

<!-- xgd-chat-end -->