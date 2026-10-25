---
uid: comment-a8d4d9e9
id: COMMENT-5600
type: comment
title: Comment on request REQ-446
created_by: xgd
created_at: '2026-10-24T19:50:15.642286+00:00'
updated_at: '2026-10-24T20:12:17.634900+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-e8c3ebcf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6de4b324-e94e-4887-991b-aad14c6d29b1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b376fcd8-1539-41f7-83ba-ef4bd7782d75-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T19:48:29.754623+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b376fcd8-1539-41f7-83ba-ef4bd7782d75-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:12:16.008447+00:00" -->
#### Claude
I've read the REQ-446 ticket and the relevant notes from past sessions. Next I'm finding where the "preserve verbatim" instructions, the `Delegate` description and BUG-271's cold read live.

Still mapping the code. Next I'm finding where the `Delegate` tool description and the builder's priming are defined.

Still looking for where the `Delegate` tool's description is defined. It isn't in this repo's surface files, so it probably comes from the framework.

Found the main instruction to change: the consultant's "Commissioning construction" section tells it to quote the client's words verbatim in the brief. Now checking which tests pin that wording.

Found existing host-side "contains the text" checks the consultant can already ask for. I plan to reuse them so a builder that rewrites the copy is caught. Checking how they match.

Baseline is green. Now I'm moving REQ-446 to `free_coding` and cutting its branch.

Most of the briefing method is pinned by REQ-342/BUG-233 tests. So I'll write the new rules compactly and tighten unpinned wording nearby to pay for them. Drafting the priming edits now.

480 characters over the cap. Tightening my own rules further and looking for wordy unpinned text to trim.

Now updating the splice script with the tighter wording and the extra trims, then re-applying it to a clean copy.

Still 234 over. Looking at the two check-wording paragraphs in the briefing method, which repeat each other.

Fits now: 99,996 against the 100,000 cap. Reviewing the priming diff.

No size cap applies to the builder's priming. Adding the "place the copy unchanged" rule to the builder's role text, in both copies.

The builder rule is in. Now adding the comprehension check to the critic's messaging lens: an unintroduced name or "I" counts as high severity when it sits in the first screen or first section.

Now checking the talker and the other surfaces for any remaining "keep the client's words verbatim" instructions.

No other verbatim-copy rules found. Next I'm writing the UATs, modelled on BUG-225's workers test, which already scripts a builder writing text and gets back host-settled text checks.

Now updating BUG-233's method test. REQ-446 explicitly replaces the "quote verbatim" wording that test pinned.

Running the new UATs alongside the budget, BUG-233, REQ-408, BUG-225, REQ-342 and REQ-354 tests.

All 46 pass. Now running the wider set: every test that reads `priming.json`, plus the critic suites.

14 failures across 6 files. Running those 6 files on clean `xgd-working` to see which failed before my change.

12 of the 14 fail on clean `xgd-working` too. Two are mine: REQ-397 and REQ-427. Looking at them.

Checking whether the REQ-427 failure comes from my priming change or from the worktree's location. Running it with the original `priming.json` restored in the worktree.

REQ-427 also fails in the worktree without my change, so it's a location artifact and not my diff. REQ-397 is mine: it pins the parallel-builds wording I trimmed. Reading what it expects.

Re-adding the pinned clause puts the priming at 100,094, 95 over. Checking whether the next paragraph of the parallel-builds text is pinned before tightening it.

Priming is at 99,992, now under the clean baseline of 99,995. Re-running the full priming-related set.

The remaining failures match the clean baseline, plus the REQ-427 location artifact. Now updating the ticket body with what landed, then committing.

That append didn't land. Retrying with `--append-body-file`.

Ticket body updated. Committing on the branch now.

Committed. Now landing it with the retry loop from my notes: lock, merge `xgd-working` in, bump the version, fast-forward back, and move the ticket to `free_coded`.

Someone else changed `priming.json` on `xgd-working` while I worked. Looking at the conflict.

BUG-271 (the critic's cold read) landed on `xgd-working` while I worked, with its own comprehension wording in the messaging lens. I'll keep its text and add only REQ-446's severity rule on top.

The "One that is not" sentence reads ambiguously after their text. Rewording it.

BUG-271 brings its own UAT, so I'm checking what its fixture test already covers before deciding whether REQ-446 needs one too.

BUG-271's UAT already drives the fixture page through the cold read to a messaging finding. REQ-446's addition is the severity rule, so my critic UAT now pins that rule against the merged rubric.

Re-measuring the budget and re-running the suites on the merged result, since BUG-271 and REQ-445 also changed the priming.

Budget is fine at 99,990. One new failure, REQ-408 `weakest_point`, arrived with the merge. Checking it on clean `xgd-working`.

That failure is already on clean `xgd-working` from REQ-445's merge, not mine. Completing the merge commit and resuming the land loop.

Ticket is at `free_coded`. Cleaning up the branch and worktree.

I implemented REQ-446 and moved it to `free_coded` (commits `24bbce5`, `8227c12`, version 0.2.619). The branch is merged into `xgd-working` and cleaned up.

**What changed (all instruction text in `priming.json`):**
- **Consultant, briefing builders:** I removed the "quote the client's headline and notes verbatim" paragraph. A brief that puts words on the site now carries the consultant's finished copy. The builder places it unchanged and reports a line that won't fit. A brief that isn't about words carries no copy and nothing from the story board.
- **Catching a rewrite:** the consultant asks for each passage of copy as a "page home contains the text …" check. That check type already existed (BUG-225), and the host answers it from the page itself, not from the builder's report. So a builder that rewrote the copy comes back "failed", with what it actually wrote. No new mechanism was needed.
- **Consultant, story board:** the copy is "true to their words and voice, written for a stranger", with the rules from the ticket: introduce before relying, anchor the voice, order for the visitor, keep the voice (nothing invented), and related lines make one paragraph.
- **Builder:** place the brief's copy exactly as written; never rewrite, shorten or reorder it; report any line that needs cutting, and the consultant decides.
- **Critic:** an unintroduced name or "I" in the first screen or first section is a high-severity finding.

**Things to know:**
- **Priming cap:** the consultant's priming was 5 characters under its 100,000 limit before this change. I paid for the new rules by shortening wording that no test pins, without changing its meaning. It now sits at 99,990.
- **BUG-233's test changed:** it pinned the old "quote … verbatim" wording, which REQ-446 replaces. It now pins the new wording and still checks BUG-233's own point: no story board in a brief that isn't about words.
- **BUG-271 landed while I worked:** its cold read and comprehension wording arrived on `xgd-working` mid-session. I kept its critic text whole and added only the severity sentence. That resolution, and the matching UAT, sit in merge commit `7fe401b`, which isn't in `fields.commits` because reconcile only cherry-picks ordinary commits. The ticket body spells out the final wording so reconcile reproduces it.
- **The cold-read fixture test** the ticket asked for is already covered by BUG-271's own UAT. REQ-446's test pins the severity rule.

**Tests:** five new UATs in `tests/test_UAT_FC_REQ-446_copy_written_for_a_reader.workers.test.ts`. Two of them run a scripted build through the real route: copy placed as written comes back passed, and rewritten copy comes back failed showing the rewrite.

I ran the 60 test files that read the priming. Everything passes except 13 failures, and each one fails the same way on clean `xgd-working`:
- REQ-285 (6)
- REQ-342 "rides every turn" (3)
- REQ-295 (2)
- AC1320 (1)
- REQ-408 `weakest_point` (1), which arrived with REQ-445's merge

One more, REQ-427, failed only before the BUG-271 merge, and only in the branch worktree. It failed there with my change removed too, so it comes from the worktree's location, not this diff.

Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->