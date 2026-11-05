---
uid: comment-1a13a557
id: COMMENT-5599
type: comment
title: Comment on bug BUG-271
created_by: xgd
created_at: '2026-10-24T19:48:25.383650+00:00'
updated_at: '2026-10-24T20:05:21.719461+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8224a6a2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "158300bd-8bfe-40d5-960d-3336c4d5f6f2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6a5e2af8-5c85-4a61-970c-b7c4ef6f0426-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T19:46:09.629802+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6a5e2af8-5c85-4a61-970c-b7c4ef6f0426-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:05:16.498766+00:00" -->
#### Claude
I've read BUG-271 and the critic's core module. Next I'm looking at the host half (`criticFor`), the rubric and the REQ-427 tests so I can build the cold read in.

Headings are `text` nodes with `heading.level`, so I can build the page text from the stored L1 tree. Checking what `store.readPages` returns for sectioned pages and the shared header and footer.

I have the node shapes I need. Checking the BUG-258 and REQ-438 UATs for anything that pins the critic to a single request.

Branch is cut. Reading my worktree-setup notes before I run anything in the new worktree.

Worktree is set up. Taking a baseline of the three critic UAT files before I change anything.

Every check now has a phrase. Updating the `LayoutCheck` interface, and checking whether any test builds its own checks that would now need the field.

Next, the page text in reading order. I'm adding it to `segments.ts` beside `pageSegments`, so it walks the same tree `describe_page` maps.

Checking that a component instance's `slot` field really names the L1 slot node it fills.

Confirmed: a component's `slot` names the L1 slot node it mounts into. Now the critic core: five findings, the cold-read turn's text, and the informed turn's heading on the brief.

Core is done. Now the host: `criticFor` sends the cold read (page words plus pictures) as turn one, then the brief as turn two in the same session.

Now the role: fill `{checked_elsewhere}` and `{max_findings}` in the rubric from the registry and the constant, and pin `image_turns` so the pictures survive into the second turn.

Now the rubric itself. My notes say a JSON round-trip of `priming.json` churns ~100 lines, so I'll splice the critic entry in as text.

Rubric spliced cleanly with the file's escape style. Checking whether any test pins the old rubric wording or the three-finding cap.

Nothing pins the old wording, and BUG-267's "brand presence" phrase is kept. Type-checking.

Typecheck is clean. Updating the REQ-427 UATs to the two-turn shape: the cold read is the critic's first request and the brief arrives in its second.

Now the BUG-258 and REQ-438 UATs.

I can seed the plan directly with `sitePlan(...).write`. Checking the heading-role and theme shapes so the fixture validates.

I have everything for the fixture. Writing the BUG-271 UAT, reusing REQ-427's real-route harness.

The fixture's positioning card is invalid: it needs two or three "hearing" lines. Reading the card rules.

All four BUG-271 UATs pass. Running the wider regression scope: the critic suites, the layout-check and REQ-415 suites, and the priming suites.

Regression scope is green: 13 files pass, and 2 skip because they need Chromium. Committing the work on the branch.

Committed. Next I'll append what landed to the ticket body (keeping what's there), then do the merge-back tail.

The CLI view truncates the body, so I'll check the stored ticket file directly.

The body update is on `xgd-working`. Now the merge-back tail: lock, merge working into the branch, bump the version, fast-forward back, then promote.

Now cleaning up the branch, as its own call.

BUG-271 is done: merged into `xgd-working` and the ticket is at `free_coded` (commits `6754e1de…` and `987bae13…`, version 0.2.617). I haven't promoted it to `ready_to_reconcile`; that's your call.

**What the critic does now**
- **Cold read first.** A review is now two turns of one critic session. In the first, the critic gets only what a visitor has: each page's text in reading order, with headings marked, and its pictures at desktop, tablet and phone width. It gets nothing from the plan. It answers as a stranger: who runs this, who is speaking in each section, what can I do here, what isn't explained, and what the layout makes me see first, miss or misread.
- **Then the informed review.** The brief comes in the second turn, so the critic compares the cold read against what the client asked for. Any gap is a finding, and it is told never to correct the cold read using the brief. The pictures stay visible into this second turn, so they're only sent once.
- **Page text.** It's built from the same stored page that `describe_page` reads, so body text no longer depends on 9px pixels.
- **Rubric.** Messaging now has the four comprehension checks: names introduced before they're relied on, "I"/"we" anchored to someone, a second brand explained, and quotes, reviews and call-outs looking different. Style now owns spacing, section widths, crops and column heights.
- **"Checked elsewhere" can't drift.** The list is generated from a new short description on each layout check. The edges check only flags a section that departs from an edge most sections share, so sections at five different widths stay the critic's to judge.
- **Up to five findings** instead of three. A sixth is dropped.

**Two things that changed along the way**
- **Spend recording.** A review now makes two model requests, and the second was overwriting the first's spend row. The second turn's rows now continue the numbering from the first.
- **Older tests.** The REQ-427, BUG-258 and REQ-438 tests assumed the critic made a single request, so I updated them to the two-turn shape. BUG-258 now also checks that the pictures are still images in the second request. One REQ-427 assertion was already failing before I started, on JSON spacing (`"still_owed":0`); I loosened it.

**Tests:** the four new UATs in `tests/test_UAT_FC_BUG-271_the_critic_reads_as_a_stranger.workers.test.ts` pass, along with the critic, layout-check, REQ-415, BUG-267, priming and session suites (64 passed). 31 tests that need Chromium were skipped.

Everything ran against a scripted critic, so I haven't seen how a real model reads Dina's page. The dev site serves a frozen snapshot, so you'd need `bin/deploy --env dev` before re-running her review.

<!-- xgd-chat-end -->