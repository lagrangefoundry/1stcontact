---
uid: comment-7de137b7
id: COMMENT-5798
type: comment
title: Comment on bug BUG-306
created_by: xgd
created_at: '2026-10-28T01:30:05.365590+00:00'
updated_at: '2026-10-28T01:50:21.311066+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c8e64e08
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c270bbb9-3ab1-4509-bfa1-33581ba94d59",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T01:30:00Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T01:30:00Z" -->
#### You
I started the FD build on Dina 8 - no mention of the hero motion? Maybe we need your guard after all - explain how it would work.

<!-- xgd-chat role="assistant" ts="2026-10-28T01:30:00Z" -->
#### Claude
Option A: refuse the first-draft Delegate until signature_effect is chosen or declined in the client words, as one more ordered hold after design and structure; the effect goes into the first brief. Option B: hold the hand-over instead. Recommended A. Also: Dina 8 bc turn at 01:16 still got three guides despite BUG-304.

<!-- xgd-chat role="user" ts="2026-10-28T01:30:00Z" -->
#### You
Yeah the talker is not picking up your agenda item at all. ok lets go with A I have spent too long trying to get this to work without.

<!-- xgd-turn id="81e24da6-6a8d-4019-bcb8-a73fdbb31b2c-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T01:31:58.554488+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="81e24da6-6a8d-4019-bcb8-a73fdbb31b2c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T01:50:19.767170+00:00" -->
#### Claude
Ticket is scoped and at `free_coding`; branch `free-BUG-306` cut. Now making the worktree runnable and reading the hold/agenda code.

Found the existing design/structure holds; now reading the plan-core helpers and BUG-304's agenda machinery to add the effect hold alongside them.

Reading the guide-delivery code and now checking the Dina 8 dev store for the 01:16 turn's three guides.

Tracing why Dina 8's 01:16 turn got three guides: checking whether the deployed snapshot really has BUG-304's one-guide rule.

Still on the three-guides forensics: checking whether the dev worker actually reloaded the BUG-304 snapshot before the 01:16 turn.

Plan history shows the 01:16 write was the pre-BUG-304 algorithm (three entries, none marked passed). Checking the snapshot's compiled `guidesDue` to see which code actually ran.

Investigating point 4 (talker agenda): the talker shares the consultant's reminder providers, so I'll prove it with a workers UAT modelled on REQ-428's. Reading those fixtures now.

Now writing the plan-core change: replacing BUG-304's agenda machinery with the hold predicate, the brief line and the hand-over sentence.

Now account-core: the `effect_first` refusal, and the host's brief hook generalised from the structure line alone to the host's lines (structure and effect).

Next: replay stamping in eval-builder, then the test helper.

Typecheck is clean. Next: checking for leftover hero-pass references in the surface JSON and priming files, then the DOC-75 rewrite.

Rewriting DOC-75's first-draft guide (ask before the build, record it, brief it with the draft). First checking which tests pin its current wording.

DOC-75 updated. Now the UATs; looking at how REQ-460 tested `structure_first` so the new hold test uses the same real path.

Writing the UATs now. Checking how REQ-477 drove the real guide hand-over path, so the one-guide replay test goes through `guidesDue` rather than the pure function only.

Now writing the node UAT file (agenda, guide text, and the Dina 8 one-guide replay through the real host).

Node UATs pass (3/3). Now the workers UATs: the hold through the real routes, first-draft-only, and the talker's agenda.

The plan validator requires a parked decision to carry the client's answer, so the helper and the replay stamp both need one. Fixing.

Workers UATs pass (3/3). Now retargeting BUG-304's suite: removing the assertions on the deleted agenda/hero-pass machinery and keeping the still-valid recording, brief and one-guide checks.

Related node suites pass (15/15). Now the wider blast radius: every suite that scripts `Delegate`, reads the agenda/hand-over, or replays builder cases.

REQ-452/454 are new hold refusals: their plan fixtures write design and structure but no effect. Checking whether the AC1058 and BUG-252 failures predate my change.

AC1058 and BUG-252 fail identically on clean xgd-working (pre-existing). Updating the REQ-452/454 plan fixtures to include a declined effect.

Node side is green except the two pre-existing failures. Now the 79 affected workers suites, in batches.

Batch results are in. REQ-448 and REQ-460 are mine (fixtures that write design/structure by hand). Baselining the others on clean xgd-working before touching anything.

Adding the effect answer as a scripted step, the same way these suites already script the structure step.

REQ-448/460 green. Last checks: the priming/reminder budget suites and the hand-over suites that pin `FIRST_DRAFT_LEAD`.

All green apart from the pre-existing failures. Committing on the branch.

Now updating the ticket body with what landed (keeping the original), before the merge and promotion.

Ticket body updated. Now the merge-back and promotion, using the retry recipe from memory.

Done. Now updating two memory notes with what this session learned.

BUG-306 is in: the host now refuses to start the first draft until the client has decided the hero's signature effect. It's merged to xgd-working, and the ticket is at `free_coded` (version 0.2.690, commits `ec2b643a9f` and `0aff7675a3`).

**Biggest finding: Dina 8 wasn't running BUG-304's code.** The plan's change history in the local D1 shows the 01:16 turn recorded the focus-task, comparison-board and design guides in one write, with none marked passed. BUG-304's code always marks the guides it skips as passed, so that write came from the older code. The deployed snapshot (`b7e4a15516`) does contain the fix, but `dev-worker` had been running since 23:59Z. It logged a reload at the 01:11 deploy and still ran the old code.
- **The three guides:** no path in the current code hands over more than one. A test replays Dina 8's 01:16 plan through the real host and gets only the design guide.
- **The talker:** it does read the agenda. A talker round gets the same plan entry as the consultant, and a test checks that line by line. The agenda item was missing on Dina 8 because the old code didn't have it.

**What changed:**
- **The hold:** a new `effect_first` refusal comes after the design and structure holds. Until `signature_effect` is chosen or declined with the client's words, the refusal tells the consultant what to do:
  - ask in a message of its own;
  - offer two or three effects with its pick;
  - say how to see it ("Open in new tab" / "View on your phone");
  - record it with `set_decision`, then build.

  Once a first pass exists, nothing is held. Under `bc` your answer counts.
- **Effect built with the draft:** if the client chose an effect, the host adds a line to the first-draft brief. It keeps text and any scrim clear of the moving part, uses local contrast, and gives four checks at computer and phone widths.
- **BUG-304's machinery removed:** the during-the-build agenda item, the separate hero pass and the "still to come" sentence are gone. The hand-over still names a chosen effect and how to see it.
- **DOC-75:** the first-draft guide now says to ask before building and that the effect is built with the draft.
- **Replays:** builder cases recorded before this rule replay with the effect declined, so they aren't refused.

The ticket cited BUG-305 for the text-over-motion rules, but they come from BUG-304; I corrected that in the body.

**Tests:** six new tests pass (three node, three in the workers runtime). I trimmed BUG-304's tests to the parts that still apply and gave four other suites' fixtures an effect answer. Every suite that touches building or the agenda was run. Nine tests still fail, all with the same results on clean xgd-working: REQ-295 (2), REQ-416 (2), REQ-436, REQ-458, REQ-466/473's prompt budget, AC1058 and BUG-252.

**Before Dina 9:** deploy, then restart the worker itself. `bin/dev restart dev` alone isn't enough:
```
bin/deploy --env dev
bin/dev restart dev-worker access-sim public-site
```

<!-- xgd-chat-end -->