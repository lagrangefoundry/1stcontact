---
uid: comment-0e43e7e5
id: COMMENT-3027
type: comment
title: Comment on request REQ-263
created_by: xgd
created_at: '2026-09-17T03:13:28.633123+00:00'
updated_at: '2026-09-17T03:24:33.192206+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2023723f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d4c82ef5-8b59-49ee-9330-e8eedcc71f2a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d7a3bc1c-ff90-4bcb-8855-2830ef28749a-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:13:00.322249+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d7a3bc1c-ff90-4bcb-8855-2830ef28749a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:24:33.142813+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me check the dependency state and the current code.

Now let me check whether the upstream `immutable` mechanism exists in the ticketing package.

The mechanism exists in the framework but the shared store copy is stale. Let me read the upstream contract carefully.

Let me understand the upstream wiring and the existing 1stcontact test/write paths in parallel.

The dependency is confirmed present in the framework but not yet propagated to the shared store. Let me start the free-coding flow while that's pending.

Complete picture. Let me verify no other write paths touch email tickets.

Now let me write the declaration.

Now the TypeScript surface — the `locked` block a read carries, and the pack's view of the declaration.

Now the UATs.

Now let me add `archive` to the typed store surface and fix the test imports.

The tests run and fail exactly where the stale dependency predicts. Let me verify by pointing the worktree's generated shim at the framework source directly.

All 10 pass. Now the regression scope.

While that runs, let me update the ticket body to cover the technical consequences the UATs assert.

Full `workers` project: 119 files, 1078 tests, all passing with the lock in place. Now the commit.

Done. REQ-263 is at `free_coded`, commit `2a099a8`, merged into `xgd-working`.

## What landed

**The declaration** — `email` in `apps/control-app/src/tickets.ts` gains the `immutable` rule from the ticket verbatim: `freeze: ['body', 'title', 'fields.*']`, excepting the four delivery-lifecycle fields, with the declared refusal message. No `when`, so content is frozen from create.

**Three typed-surface additions**, each because something now reads what it names:
- `Ticket.locked` — the block a read carries when a rule matches, omitted otherwise
- `LockRule` + `immutable?` on `ProductTypePack.schema()`
- `TicketStore.archive` — needed to assert that the lock does *not* reach the erasure path

**10 UATs** in `tests/test_UAT_FC_REQ-263_email_record_is_frozen.workers.test.ts`, covering the ticket's five-item test plan plus three consequences I added to the body: the declaration read off `productTypePack()` itself, the `locked` block riding on a listing (not just `get`), and the shipped `sendRecordedEmail` / `applyDeliveryEvent` driven end-to-end through the lock.

## One thing you need to run

**The lock is inert until the framework's ticketing component is installed into the shared store:**

```
cd /Users/martin/lagrangefoundry/lagrange-framework
python3 bin/install --lang js --component ticketing
```

REQ-160 is `free_coded` in the framework, but `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing` is the Sep-16-13:56 snapshot — `validation.js` is 463 lines there against 653 in the source, with no `lockRules`. The stale `TypePack` ignores an `immutable` key it doesn't know, silently rather than loudly, so nothing breaks — but nothing enforces either. I can't run install scripts and that path is outside my sandbox.

**How I verified without it:** I temporarily repointed the worktree's gitignored `generated/ticketing.js` shim at the framework source, which is exactly the post-install configuration. Against that:
- all 10 REQ-263 UATs pass
- the full `workers` project passes — 119 files, 1078 tests, zero failures, with the lock enforcing
- `tsc --noEmit` on control-app is clean

I restored the shim before committing, so the worktree left no hand-edited generated file behind.

For completeness on what you'd see today, before the install: 4 of the 10 pass (the declaration assertion and the three "still allowed" cases) and 6 fail — every case asserting a refusal or a `locked` block. That's the stale dependency, not the change.

<!-- xgd-chat-end -->