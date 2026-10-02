---
uid: comment-8fb60143
id: COMMENT-4649
type: comment
title: Comment on request REQ-358
created_by: xgd
created_at: '2026-10-02T01:21:43.574056+00:00'
updated_at: '2026-10-02T02:20:56.847120+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-1f0b2ce5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1c568e42-c1e2-4d0f-8719-20faefaf2521",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="57d69eac-4a75-4350-87dc-f0aa25eec8e7-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T01:19:28.645700+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="57d69eac-4a75-4350-87dc-f0aa25eec8e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T02:20:54.828620+00:00" -->
#### Claude
Ticket is at `free_coding` and branch `free-REQ-358` is cut. Now reading REQ-357's group-chat code to scope the rename.

Mapping the KB build: the system landscape is `authored`, so I'm finding where that map comes from and why the rebuild skipped it.

Dev D1 holds two `assistant-<site>` chat tickets, so I'll re-key them with a data migration. Checking how a session resumes from its ticket and which tables carry session ids.

Now doing the rename. Collecting every reference to the group-chat agent across code, client and tests.

zsh doesn't word-split; switching to an explicit list.

Now the REQ-357-specific values and prose, by line.

Now the JSON configs: backends, instances, group-chat names, priming.

Now reading DOC-64 to write the priming pointers and the rewrite.

Rewriting DOC-64 next. First checking an existing UAT (BUG-65 "priming names no documents") that may collide with requirement 3.

Writing the priming changes now (coordinator keys, DOC-64 pointers in both roles). Checking that a JSON round-trip preserves `priming.json`'s formatting first.

Now the data migration that retires pre-rename `assistant-<site>` sessions and their rooms.

Migration archives exactly the 2 old sessions, 2 rooms and their transcripts, leaves the consultant sessions alone, and is a no-op on re-run. Registering it in the manifest.

Now the landscape. Reading `kbBundle`/`kbSkew` to make a map that doesn't cover the index count as skew.

Implementing the map-coverage check in `kb.ts` now; the shared fixture and two direct map writers will pass coverage.

Writing the `kb.ts` changes.

Updating the shared KB fixture and the two tests that hand-write a map and then check coherence.

Running the KB suites.

Three expected follow-ons. Looking at the two KB ones.

The BUG-48 fixture re-indexes without redrawing the map, which a real build never does. I'll make its rebuild step write the map too, and fix the remaining literal.

Extending the REQ-357 names test to the shipped KB documents. Checking which system-KB documents currently use the code names.

DOC-56's two hits are the "Alice" typeface, so it gets the same exemption `platform-fonts.json` has. Reading the REQ-357 workers test harness to add the REQ-358 cases there.

Updating the REQ-357 workers test to pin `coordinator` names, leaving the transcript's `assistant` wire role as is.

Adding the two REQ-358 workers cases (DOC-64 in both assembled primings; a pre-rename room is recreated after migration 0024).

Now the node-side UAT file for REQ-358. Checking how BUG-156 drives `kbEnsure` with stubbed model seams.

Now rewriting DOC-64 in role terms (consultant / coordinator), substance unchanged.

DOC-64's update landed straight on xgd-working's ticket store, which is what the KB export reads. Running the node suites.

All 9 node suites pass (the shipped-landscape case skips in a worktree, as designed). Now the workers suite.

The worktree lacks the gitignored `apps/control-app/src/generated/` build output; copying it in from the main checkout.

`ready` is false on open, so the coordinator never gets a round. Taking a baseline in the main checkout to separate environment from regression.

Baseline passes in the main checkout. Checking whether the worktree can resolve the shared `@lagrangefoundry` components.

Still failing with the shared components linked, so likely real. Surfacing the open error.

The import of `assistantRole` wasn't renamed (my sed matched only call sites). Fixing, then typechecking.

Typecheck is clean. Rerunning the workers suite.

All 9 pass. Checking the migration case isn't vacuous: it should fail with the migration skipped.

The case fails without the migration and passes with it. Running a wider regression scope over priming, roles, KB and builder-session suites.

While the regression batches run, reading the repo's free_coded promotion notes.

Tests are running in the background. Meanwhile, updating the ticket body: keeping the operator's spec intact and appending what landed and the decisions made.

Checking the describer hypothesis directly: does the Claude Code CLI describer work from this sandbox?

Most failures match known pre-existing ones (delegation suites, workspace-origin). Baselining the three questionable files in the main checkout.

Every failure reproduces on clean xgd-working, so none are regressions. Committing and merging back.

Ticket is at `free_coded` (version 0.2.435), and the branch is cleaned. Last step: regenerate the system landscape with the new code, using the documented KB-release command.

The rebuild completed. Checking the new map and running the shipped-landscape UAT against it.

REQ-358 is implemented and merged into xgd-working, and the ticket is at `free_coded` (version 0.2.435, commit `66a61f2c90` plus the version bump). I also rebuilt the knowledge base, so the map now includes DOC-63 and DOC-64.

**1. The second agent is now `coordinator`.** That covers the role key, the backend (`claude_coordinator`), the priming keys, the permissions grant, the display-name entry, the spend role, the coordinator's tool list and its session id (`coordinator-<site>`). The transcript's `user`/`assistant` roles are unchanged. Agent and panel text now say "the coordinator", never "your assistant".
- **Existing rooms are recreated, not re-keyed.** A new migration (`0024`) archives the old `assistant-<site>` sessions, the rooms that list them, and their transcripts. The next open creates a fresh room alongside the consultant's existing conversation, which is untouched.
- Re-keying wouldn't work: the old session's message history is stored under the old session id, and SQL can't move it.
- Without the migration, a room opened before the rename fails to open at all; I confirmed that in a test. Your local dev database has two such rooms. The dev server only picks up the migration and the new code on `bin/deploy --env dev`.

**2. Code names.** DOC-64's title and body are rewritten to "the consultant" and "the coordinator", with the substance unchanged. The display-name test now also scans every system knowledge-base document. DOC-56 is exempt because "Alice" is a typeface in the font catalogue there.

**3. DOC-64 in both primings.** Both the consultant's group-room text and the coordinator's role text say to read DOC-64 before the first turn in the room.
- **This partly overrides BUG-65**, which banned any document id in priming. Its test now skips the group-chat-only text, so everything sent without a group chat still names no document.
- A new test replaces BUG-65's protection: every document id named in priming must be in the system knowledge base.

**4. Why the landscape went stale.** The build writes the index, then the chunks, then the map. On 2026-10-01 the index and chunks were rewritten at 16:10 but the map wasn't. From then on, `1c kb ensure` reported "nothing to build" and `1c assets` shipped the old map, because nothing compared the map against the index.
- I couldn't find which run did it or why the map step stopped. It wasn't a missing credential: the describer works from here.
- **Fix:** the map now records which documents (at which versions) it was built from. A map that misses an indexed document counts as stale, so `ensure` rebuilds it and `1c assets` refuses to ship it. A failure at the map step now says so explicitly.
- **Result:** the regenerated map covers all 14 indexed documents. DOC-64 sits in the "Builder AI roles…" section, whose description covers both roles, the plan and how a build runs.

**Tests:** the REQ-357 room tests (now pinned to the new names) and the new REQ-358 ones (DOC-64 in both primings, the migration, the coordinator naming, the map check) pass, along with the knowledge-base suites I adjusted. A wider run of 87 test files had 13 failures across 6 files. The same failures appear on clean xgd-working: the delegation tests and three knowledge/workspace tests that fail only because of where the worktree sits.

<!-- xgd-chat-end -->