---
uid: comment-074bab15
id: COMMENT-3271
type: comment
title: Comment on request REQ-283
created_by: xgd
created_at: '2026-09-19T19:34:01.151420+00:00'
updated_at: '2026-09-20T18:25:33.810977+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7ccc3268
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a8d92802-4844-40a3-97d7-21a360b75fbc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ab369da3-90e4-4177-8136-40735578da09-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T19:33:21.663788+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ab369da3-90e4-4177-8136-40735578da09-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T19:54:21.253061+00:00" -->
#### Claude
Now let me make the changes. Starting with `host-core.ts`.

Now add the agent surface into `extraSurfaces`:

Now the priming/manager block:

Now add `HostDeps.summary`, the `sessionContextSurface` helper and `summaryTriggerText`:

Now I'll revise that block for the ledger-as-log design:

Now let me update `ledger-core.ts` with a read port and entry splitting:

Now `roles.ts` — the provider names, renderers and registration:

Now add the memory renderer and registration to `roles.ts`:

Now the prose in `priming.json` — templates, the reminder entry, and the stale `about` note:

Now update the "TEMPLATES ARE PROSE TOO" note, which no longer counts right:

Now finish `host-core.ts`: fix the provider registration and add the two helpers.

Now fix the `summaryTrigger` wiring I added earlier, and add `sessionContextSurface`:

Now add `sessionContextSurface` and wire imports:

Now the imports in `host-core.ts`:

Now the Worker wiring — `ai.ts` and `tickets.ts`:

Now the `read()` implementation on `chatLedger` and `append_body` on `TicketStore`:

Now `append_body` on the `TicketStore` interface:

Now let's typecheck:

Now the new UAT. Let me check the workers-test harness for D1 + the scripted model client:

Now let me write the UAT files.

<!-- xgd-turn id="ea9391ba-56a8-488b-9bfe-57f35b5f0631-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T19:54:36.764886+00:00" -->
#### You
Sorry there were some last minute changes to the ticket, please re-read them

<!-- xgd-turn id="d803a954-0015-4e56-a177-d3c6fb72ee7d-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T20:16:22.102530+00:00" -->
#### You
That's fine

<!-- xgd-turn id="d803a954-0015-4e56-a177-d3c6fb72ee7d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T20:17:09.966144+00:00" -->
#### Claude
Good — nothing to change then. That decision is already recorded in the ticket body under "What to do" point 3, so reconciliation will see the reasoning rather than having to rediscover it.

REQ-283 stands as committed: `181f744`, status `free_coded`, version 0.2.284, session lock released.

<!-- xgd-turn id="ea9391ba-56a8-488b-9bfe-57f35b5f0631-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T20:13:41.650824+00:00" -->
#### Claude
Now let me rework that block for the operator's decision — the frame as a chat-ticket field:

Now update `sessionContextSurface` for the narrowed grant:

Now `roles.ts` — the memory source becomes one read, and the note replaces the frame:

Now fix the two stale provider-name doc comments in `roles.ts`:

Now the ledger surface gains the narrow verb. First the declaration:

Now the operations, the cap check, and the surface constructor:

Now the host adapter in `ledger.ts`:

Now the chat schema field, and reverting the `append_body` addition (no longer needed):

Now revert the `SummaryStore` wiring in `ai.ts`:

Now the workerd suites that touch the chat host and the ledger:

Now let me write the REQ-283 UAT:

All 13 pass. Now the node-side half — the `1c` host is told and offered none of it:

Now let me run the broader chat/AI suites to catch anything else this moved:

Now a broad sweep of the workers project plus the AI-adjacent node suites:

Now let me bring the ticket body in line with what was built:

Now commit and record the free-coded state:

Both suites pass; the combined-run failure was my invocation (no `--project`, so each file got collected by the wrong project).

## Done — REQ-283, free-coded as `181f744`, version 0.2.284

I re-read the ticket mid-implementation and rebuilt against the operator's **DECIDED** section — the frame is a field on the chat ticket, `SummaryStore` is not used. That changed the design substantially from where I'd started.

**What landed**

1. **Delivery** — the highest-value fix. `LedgerDeps` gains a `read()` (a port read, not a declared operation: a tool is a capability a model may skip, and it would skip it on exactly the long turns that need it). A provider rebinds the product tier's `session.summary` entry to render the standing note whole, then a tail of 8 ledger decisions. `null` when nothing has been decided.

2. **The standing note** — `fields.frame` on the chat ticket, written by a new `set_standing_note` verb on the ledger surface (in `KeepLedger`, surface version 1→2), under compare-and-set. The cap is upstream's `checkFrame` reused directly — it's pure — raised as a declared `NOTE_TOO_LONG`; `host_detail` carries both byte counts through so the model can shorten by a known amount.

3. **Self-inspection** — `AgentToolbox` granted `InspectContext` **minus `summary`**. The three summary operations read a `SummaryStore` this host doesn't have and upstream refuses without one, so they're withheld together rather than shipped as operations that always fail.

4. **The product tier adopted** — the stale BUG-45 note deleted. `transcript_pointer`'s *condition* is rebound to a host-level one: the framework's checks `ctx.chatTicketUid`, which the archive stamps on the first drain — after the priming is assembled — so a session would never have been told where its transcript was until resumed in a fresh isolate. `tool_transcript_note` stays declined on its own merits by binding no reader.

**Three decisions you may want to overrule**
- **No session scope** on the agent axis (open within the tenant). The barrier is `forTenant`, and it's the reach REQ-228 already decided on; an allow-set can't be computed before the first turn archives a ticket.
- **No `opts.summary`** on `SessionManager` — its only use is the `/compact` hint, which this backend never asks for.
- The ticket's original "What to do" list is now superseded in the body, with the supersession stated explicitly.

**Tests** — workers project 1230/1230 green; node project's 6 failures are pre-existing (verified against a stashed tree: repo-tree scans and an EISDIR from an untracked dir). Six existing suites needed `registerMemoryProviders(providers, null)` added to their hand-built registries — that's the role loader refusing an unregistered provider name, working as designed.

<!-- xgd-turn id="043d6c13-2c01-4246-b1ef-83a368d86caf-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T20:14:12.458674+00:00" -->
#### You
**No session scope** on the agent axis (open within the tenant). The barrier is `forTenant`, and it's the reach REQ-228 already decided on; an allow-set can't be computed before the first turn archives a ticket. <-- what does this mean?

<!-- xgd-chat-end -->