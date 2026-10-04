---
uid: comment-809d2084
id: COMMENT-4902
type: comment
title: Comment on request REQ-387
created_by: xgd
created_at: '2026-10-04T20:50:27.145059+00:00'
updated_at: '2026-10-04T21:03:00.910883+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-1f611f31
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6d0f31ca-1b96-46f7-8dbb-7327b01bdc98",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5011f90a-d0eb-48c3-aff6-2f68b8687eff-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T20:49:15.243416+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5011f90a-d0eb-48c3-aff6-2f68b8687eff-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T21:02:58.136992+00:00" -->
#### Claude
Waiting on the exploration agent.

Reading how the host composes the library surface per role; `readOnlyGrant` already exists, which looks like the reuse point.

Still mapping the design: the builder deliberately gets no client corpus or catalogue (REQ-355), so I'm checking whether the Library's `get_library_item` alone carries document text verbatim.

Found that REQ-355's UAT explicitly asserts the builder has *no* catalogue access. This ticket supersedes that part (reads only). Writing the ticket scope now, then cutting the branch.

Worktree ready. Now the Library surface changes.

Now the edits to `library-core.ts`.

Explorer confirmed the map. Now the declaration (`library-surface.json`).

Surface and host-side port done. Next: compose the read-only Library into the builder in `host-core.ts`, sharing the coordinator's composition.

Now the tests. Checking how the REQ-228 suite calls the operations so the new one matches.

Writing the workerd UAT (real route, real upload, real worker session).

Now the node UAT for paging, then run both.

Node suites green, including the declaration validator. Now the REQ-355 fence update, then the workerd suites.

The real path works end to end. Only my spacing assumption about the serialized JSON was wrong. Fixing the assertion to a regex.

Both failures match a known pre-existing pair from my notes (verdicts gained `by`/`reason` fields upstream). Confirming that's the failure shape, then the node delegation/priming suites.

Those two node failures are also on the pre-existing list. To be certain about all four, I'm running them on the unchanged main checkout as a baseline.

Identical four failures on clean `xgd-working`, so none are from this change. Now typecheck and lint in the worktree.

Typecheck clean on touched files. One more regression check on the `KnowledgeGet` text-view path I refactored (BUG-185).

All green. Now commit, following my notes on how version bumps work in this repo.

Committing on the branch (only my files; per my notes, `move-to-free-coded` without `--version` does the bump itself to avoid the tip race).

Before merging back, updating the ticket body so it matches what landed. The only change from the scope I wrote is the final test-plan details.

Now lock and merge back into `xgd-working`.

Ticket is `free_coded` with both commits and version 0.2.489. Tearing down the branch.

The memory index hit its size warning, so I'm compacting it by shortening the longest hook lines.

The compacted index fits (16.8KB) and every entry is kept. Writing it back.

Same 137 entries, nothing new was added, so the compacted version is safe to write.

Another session keeps writing to the memory index, so I'm not doing a wholesale rewrite that could wipe out its additions. My one new entry is in. I'm leaving the size warning for a quieter moment.

REQ-387 is done and parked at `free_coded`: commits `bf12b970` (the change) and `68ed07cf` (version bump to 0.2.489), merged into `xgd-working`, branch cleaned up. When a consultant delegates a build, the builder can now find the client's uploaded documents and read their exact wording.

**What the builder gets**
- **Library, read-only.** It can use `list_library` and `get_library_item`, but cannot place, re-role or delete anything. This is the same read-only set the coordinator already had, and both now go through one shared helper in `host-core.ts`. If a write operation is added to the Library later, the builder won't get it.
- **A document's actual words.** `get_library_item` previously returned only the description, which for a document is a short summary written so it can be found again, so it couldn't be quoted. It now takes an optional `text: true` and returns the document's own text in 20,000-character pages, with a pointer to where the next page starts. Pictures and fonts return `text: null`. Without the flag the answer is unchanged, so the consultant only pays for the text when it asks.

**Where I departed from the ticket:** I did not give the builder the `project` knowledge base. That knowledge base indexes the chat transcripts as well as the uploads. REQ-355 deliberately keeps the conversation away from the builder, and its code comments explain why. Reading documents through the Library gets the builder the text without the conversation. The ticket's other option, letting `Delegate` attach Library items to the brief, would need a change in the framework repo (`@lagrangefoundry/ai`), so I didn't do it. Both decisions are recorded in the ticket body.

**This overrides part of REQ-355.** One of its tests checked that the builder had no Library access at all. I narrowed it so it still blocks Library writes, the ledger and `Delegate`, but allows Library reads. The ticket body says so explicitly so reconcile treats it as a deliberate change.

**Tests**
- New in-workerd test through the real routes: a reference document is uploaded, the consultant delegates, and the builder lists the Library, finds the document and reads a testimonial word for word. A second check confirms it is offered no Library write.
- New test of the paging itself: no flag means no change, a document longer than two pages reassembles exactly, and an item with no text returns `null`.
- The surrounding suites I ran (Library, delegation, REQ-355, REQ-343, coordinator, knowledge text view) pass. Four tests fail, and they fail identically on a clean `xgd-working` without this change: two REQ-295 delegation result tests, REQ-341's worker page/palette grant test, and REQ-122's primed-manual test.

Separately, the memory index is near its size limit. I didn't compact it because another session was editing it at the same time.

<!-- xgd-chat-end -->