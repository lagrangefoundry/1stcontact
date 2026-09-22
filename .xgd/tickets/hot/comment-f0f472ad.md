---
uid: comment-f0f472ad
id: COMMENT-3656
type: comment
title: Comment on bug BUG-137
created_by: xgd
created_at: '2026-09-22T18:02:04.536486+00:00'
updated_at: '2026-09-22T19:06:46.905659+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f65d693a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8fe2bf3a-d7ba-42cb-bcc6-f1d8f24a209b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7ef8e790-fd47-470d-af49-80828d3a550b-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T18:01:29.150882+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7ef8e790-fd47-470d-af49-80828d3a550b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T18:33:43.137312+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Design is clear. Let me record the decisions on the ticket before coding.

Ticket updated and set to `free_coding`. Now cutting the branch.

Now let me implement the rewrite in `chat-copy.ts`.

Now the implementation. First, the imports and the new address machinery:

Now `writeChats` itself:

Now `writeComments`, which needs to re-address the transcript header:

Now the router: resolve the destination's own ids and map the refusal to a 409.

Now the CLI output for `strays`:

Now update `bin/copy-to-cloud`'s header, which documents the `--chats` contract:

Now let me typecheck.

Now the tests. First the new BUG-137 suite:

Now update the REQ-294 suites for the derived ids and the `strays` count:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="41364e0c-c5c7-4971-a8a8-52b207b45343-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T19:01:52.726785+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="41364e0c-c5c7-4971-a8a8-52b207b45343-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T19:06:46.227884+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state.

The ticket body is fully populated and the implementation is uncommitted on the branch. Let me review what landed.

Implementation looks complete. Let me typecheck and verify the APIs used exist.

Both typecheck clean. Now the tests — let me review the new UAT file first.

Generated assets are present. Running the BUG-137 suite now.

All 6 pass. Now the two REQ-294 suites that were updated.

All green — 71 tests across the direct and adjacent scope. Let me check the version-bump convention and the remaining diff.

Everything is green and the ticket body already documents all of it. Now committing.

Now merge working in, bump the version on the branch tip, and fast-forward back.

Merged clean — but router.ts took substantial incoming changes. Re-verifying.

All green post-merge. Now the version bump, which must be the tip commit.

Fast-forwarded cleanly. Now the gated status move.

BUG-137 is complete and landed on `xgd-working` at `free_coded`.

## What was built

The rewrite is the **destination's**, in `POST /api/chats/import` — it's the only side that knows its own ids, and it already resolves its own business from the authorised scope. A `--backup` file therefore stays source-faithful and can be imported anywhere.

**Addressing is re-derived, never patched.** The import reads which of the two subjects a conversation is off its session id, then calls the same four `host-core.ts` functions that mint them (`sessionIdFor`, `businessSessionIdFor`, `siteBackendName`, `businessBackendName`) with the *destination's* id. Even the two recognised prefixes are read out of the derivers rather than spelled — a literal `'site-'` would be this ticket's own bug one layer up.

Three more places carried source ids and are re-addressed too: `fields.backend`, and the `<!-- xgd-session -->` header's `id`, `backend` and `chat_ticket_uid`. Fixing `session_id` alone would only have moved the failure — the conversation would appear in the right pane with its composer frozen on *"Unknown backend claude+site:…"*. `backend_ref` is cleared; the turns are untouched.

**Refusals, all 409 with nothing written:** a session id in no form the product mints, a destination holding two sites, a payload naming two source sites or businesses, and a `site-…` conversation arriving at a business with no site.

**An empty session is a placeholder, not a conversation** — written over without `--force` and counted `created`. This supersedes REQ-294's "kept" rule for the empty case only, because the deployed builder auto-creates exactly such a session, and keeping it would preserve the emptiness over the history while reporting success.

**Rows stranded by a pre-fix copy are archived**, bounded to exactly the ids this import re-addressed, so a re-run is idempotent rather than leaving a second invisible copy. Counted as `strays` and printed by `bin/copy-to-cloud` when non-zero.

## Verification

All in the foreground: `tsc --noEmit` clean for both `control-app` and `generate`; **41 tests passing** across the six new BUG-137 UATs, the two updated REQ-294 suites, and the adjacent BUG-134/REQ-289 copy suites — re-run after merging `xgd-working` in, since `router.ts` took substantial incoming changes from REQ-297. A wider sanity sweep of the session-addressing suites (REQ-160, REQ-239, BUG-38) also passed.

REQ-294's UATs seeded session ids in a form the product never mints (`sess-a`, `sess-shape`) — which is precisely why its round trip could pass while carrying addresses that pointed at nothing. They now seed real derived ids and assert the re-addressing.

Commits `67da3561fd` + `75ee93b883` (v0.2.319), branch merged and cleaned. The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->