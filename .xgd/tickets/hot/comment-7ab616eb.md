---
uid: comment-7ab616eb
id: COMMENT-5622
type: comment
title: Comment on request REQ-455
created_by: xgd
created_at: '2026-10-25T01:27:00.092293+00:00'
updated_at: '2026-10-25T01:53:40.433157+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b077e25f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fef448df-12f4-465a-97ba-f7f09806dea8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e38df615-7e42-41d9-8a36-e102175e6c8e-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:25:41.475502+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e38df615-7e42-41d9-8a36-e102175e6c8e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:53:38.029959+00:00" -->
#### Claude
Let me set status and cut a branch, then read the REQ-450 code.

Reading the REQ-450 copy code and its tests on the new branch `free-REQ-455`. Next I need the real formats of the transcript, the tool transcript, the ledger and the decision log.

Pulling real Dina's Diner records from a copy of the local dev D1, to see the actual formats the cut has to handle.

Found Dina's site chat in the dev store. Now reading its transcript and tool transcript to see their formats.

Now reading the framework's own tool-transcript and segment code. If the framework already parses these formats, the cut should reuse its parsers.

Checking how 1stcontact reaches the framework, so the transcript cut reuses its parser rather than writing a new one.

Checking whether the framework's `Session` parser round-trips Dina's real transcript byte for byte. If it does, the cut can use it.

Reading the ledger entry format and the existing tool-transcript parser (`workLogCalls`) in `ledger-core.ts`.

Most of the formats are clear now. Next: whether the change log (`ticket_changes`) keeps full plan versions to rewind to, and how the store exposes it.

The change log does keep a full field image of every plan version, and `store.changes()` reads it. Checking how big that scan gets for Dina.

Baseline is green: 7/7 REQ-450 UATs pass in the worktree. Now writing the cut. Checking two last details: plan-core's section bounds helper and the ledger surface's op names.

Writing `first-draft-cut.ts`: the cut point, the chat cut, and the plan rewind. It reuses the framework's `Session`, `workLogCalls`, `ledgerEntries`, `seedPlan` and the store's change log.

Adding the store's own `changes` read and `changeFloor` to the `TicketStore` type.

Now wiring the cut into the copy's last step in `first-draft.ts`, and recording it on the marker so a finished copy can still report it.

Now the popup's completion line, so it names the cut and its time.

Typechecking.

Typecheck is clean. Before writing the UATs I need two things: how the REQ-450 dialog test drives the popup, and what makes the direction "agreed".

Writing the workers UAT. The source is seeded through real D1 writes, with the plan's pre- and post-cut versions written either side of a real instant, so the change log straddles the cut.

Seeding error only: a captured reference needs `source_url`. Fixing the fixture.

Six of seven pass. The one failure is the fixture's fault: its "no hand-over" source still had a later reply linking `#show=draft`, which by the ticket's own rule is a hand-over. Fixing the fixture.

All 14 pass: 7 REQ-455 and 7 REQ-450. Now a jsdom UAT for the popup's completion line, driven the same way as REQ-450's dialog suite.

The handover case passes. The other two read the first dialog's text because the DOM is only reset between tests, so I'm splitting the cases into separate tests.

UATs pass. Next I'll run the cut on Dina's real records from the dev store, to confirm it lands at 01:24:18 with the right note and decision count.

Vitest finds nothing when handed this many paths at once (a known quirk), so I'm running them in batches of 30.

Ten failures across nine files. To see whether any are mine, I'm running the same files in the main checkout, which doesn't have my changes.

Nine of the ten fail on base too, so they predate this change. The tenth, `BUG-58_invite_modal_fits`, passed on base, and it does load `people.js`. Running it alone in the worktree:

Playwright times out waiting for a selector. A memory says builder pages 404 in worktrees, so this may be location only. To check, I'll run it in the worktree with `people.js` reverted to base.

It still fails with base `people.js` in the worktree, so it is the worktree location, not this change. Moving on to the ticket body and the commit. First, the promotion-gate memory:

Updating the ticket body. I'm appending a "What landed" section and leaving the existing spec untouched.

Committing on the branch, then merging into `xgd-working` under the lock.

REQ-457's session holds the merge lock. I'll wait for it to release.

Merged. A quick re-run of the REQ-455 and REQ-450 suites on the merged `xgd-working`, in case anything landed concurrently:

Now releasing the lock and removing the branch, as a call on its own.

REQ-455 is implemented and parked at `free_coded`. The work is commit `fcba5d4` plus the version bump `a052c30` (0.2.634), merged into `xgd-working`. I didn't need to ask anything first; the ticket was specific enough.

**What the copy does now.** A first-draft test copies the source's history only up to the first-draft hand-over:
- **Cut point:** the first assistant reply that links `#show=draft`. Without one, it cuts at `first_pass_at`; with neither, it copies everything.
- **Site chat:** the transcript drops the hand-over turn and everything after it, and the tool transcript drops entries from the cut on. The standing note becomes the last one set before the cut.
- **Plan:** decisions go back to the last version before the cut, taken from the store's change log. If the log has been pruned that far, any decision settled after the cut goes back to its seed state. Decision-log entries after the cut are removed.
- **Stages:** they re-settle through the host's existing rules on the plan write.
- **Popup:** the completion line now ends ", cut at the first-draft hand-over, 01:24", ", cut at the first build, 01:18", or ", full history".

Most of it reuses existing code: the framework's transcript parser, the tool-transcript and ledger parsers in `ledger-core.ts`, the seed plan, the draft-link builder, and the store's change-log read. The new code is `apps/control-app/src/first-draft-cut.ts` and one small helper, `keepLogEntries`, in `plan-core.ts`.

**Checked on Dina's real records** (a copy of the local dev D1, run outside the app):
- The cut lands at 01:24:18, and the transcript ends right after the 2,000-person catering exchange.
- The standing note at the cut doesn't contain "UGLY".
- Decision-log entries 1–5 are kept and 6–7 dropped.
- `visual_concept` comes back as `proposed`, its state before it was hearted.

I haven't run a real copy through the popup in the running app.

**Choices you may want to check:**
- **Decision log:** neither the decision log nor the old chat-body ledger records when an entry was written. I cut both back to the highest entry count reported by a decision or standing-note tool call before the cut.
- **Unreadable transcripts:** a transcript that isn't a valid session file is now copied as it is. Without this, REQ-450's own UATs failed the whole copy, because their fixtures use simple placeholder transcripts.
- **REQ-450's test fixture:** it stamped the first build at the same instant as the client's answers, so the new cut rewound those answers. I moved the build an hour later; none of REQ-450's assertions changed. That ticket is at `ready_to_reconcile`, so its reconcile will see this edit.
- **Stage note:** a stage the rewind reopens (Dina's "Other sites") shows the host's own "reopened" note.

**Tests:**
- 7 new UATs on the copy route and 3 in the popup pass, with REQ-450's 7 copy and 3 popup tests also passing (20 in all). Typecheck is clean.
- 82 nearby suites have 10 failures. 9 fail the same way in the main checkout without my change.
- The tenth, `BUG-58_invite_modal_fits`, times out in Playwright. It still times out in the branch worktree with my `people.js` change reverted, so it's the worktree location, not this change; I didn't run it in the main checkout.

The ticket body keeps your spec and adds a "What landed" section with these decisions and the test list, so it's ready for reconcile whenever you promote it.

<!-- xgd-chat-end -->