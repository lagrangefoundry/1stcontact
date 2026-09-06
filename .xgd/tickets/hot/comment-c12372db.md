---
uid: comment-c12372db
id: COMMENT-2299
type: comment
title: Comment on request REQ-201
created_by: xgd
created_at: '2026-09-06T19:45:57.601473+00:00'
updated_at: '2026-09-06T19:51:33.403232+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4f1e365c
  kind: chat_transcript
---

<!-- xgd-turn id="95662907-1fc0-4f19-812b-27cbb681c639-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:45:13.870956+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="95662907-1fc0-4f19-812b-27cbb681c639-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:51:32.859540+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Now let me look at the material route handlers and the ticket-store access on the server.

I've read the ticket and traced both halves end to end. The design is clear, but there is one hard blocker I can't clear myself, plus two decisions I want your call on.

## What I found

**The mechanism exists upstream and is not installed here.**

`lagrange-framework` has REQ-136 landed on `xgd-working` (`components/ticketing/js/src/changes.js`, `store.watch()`, `store.changes()`, `accessor.readChanges/changeHead/pruneChanges`, and the `ticket_changes` + `ticket_change_floor` DDL in `SCHEMA_STATEMENTS`). REQ-136 is at `ready_to_reconcile`.

But this app resolves ticketing through the shared artifact store:

```
apps/control-app/src/generated/ticketing.js
  → export * from "/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js"
```

That store was installed **Sep 3**; the framework's ticketing source is **Sep 6**. The installed copy has no `changes.js`, no `watch`, no `readChanges`. And `/Users/martin/lagrangefoundry/node_modules` is outside my sandbox's write allow-list — `touch` there returns `Operation not permitted`, so I cannot run `bin/install`.

**Q1 (blocking).** Please run, in `lagrange-framework`:

```
bin/install --lang js --component ticketing
```

I could write both halves against a fake store and ship code that typechecks and passes its own UATs while being provably non-functional against the real store. I'd rather not — that's a half-present feature in the sense CLAUDE.md forbids, and it would mean the change-log tables land in the migration untested.

**Q2.** The baseline migration needs `ticket_changes` + `ticket_change_floor` added — `test_UAT_FC_REQ-162 every statement in SCHEMA_STATEMENTS is in the migration` will fail the moment the install lands otherwise. `0001_baseline.sql`'s own header says siblings edit it in place rather than adding `0002`. **Has `0001_baseline` already been applied to the remote D1?** If it has, editing in place won't re-run and I should write `0002_ticket_changes.sql` instead. If it hasn't (or you're happy to wipe), I'll edit in place per the header.

## The design I'd build

**Server** — one new route, reusing the SSE framing `streamTurn`/`streamTail` already establish:

- `GET /api/material/changes?since=<seq>` → `text/event-stream`. Opens `store.watch({filter, fields, since})`, emits one frame per event with `id: <seq>` so the browser's `EventSource` carries the cursor in `Last-Event-ID` on reconnect — that is the reconnect/backoff/cursor requirement satisfied by a browser primitive rather than hand-rolled.
- The filter is the Library's own scope, expressed once: `MATERIAL_TYPES` → `type=material OR type=reference`. Field scope `['title', 'body', 'fields']` — what the list and detail actually draw, excluding `links`/`status` churn. `enter`/`exit` arrive regardless, per DOC-24 §5.
- Tenancy is free and structural: `openTickets()` already returns the scoped handle and `readChanges` carries `WHERE tenant_id = ?`. There is no unscoped path to reach for. The cross-tenant UAT asserts this directly with a second tenant.
- **A frame carries a `MaterialRow`, not a raw ticket.** `rowOf()` is a pure function of `{uid,type,title,fields,updated_at}` and the change event's after-image carries exactly those — so `enter`/`update` ship a finished row with no extra D1 read, and `exit` ships just the uid. The client's render path is unchanged.
- **Poll cadence: `changePollMs: 2000`, not the component's 50ms default.** An open tab at 50ms is 20 D1 queries a second, forever. Two seconds is comfortably inside "the AI writes one seconds later". Taking this as my call unless you object.

**Client** — `library.js` gains a subscription; the component contract does not change.

- On mount: `transport.list()` as today, then subscribe from the cursor that read returned, so nothing between load and subscribe is lost. That means `/api/material` must return `{material, seq}` — one added field.
- `enter` splices a row in, `update` patches in place, `exit` removes; then the existing `apply()` → `listDetail.setItems(visible())`. Selection, rail state and detail scroll are the component's and survive untouched.
- Business switch: close the subscription, `clear()`, `refresh()`, resubscribe. `refresh()` stays for that path and for `reset`.
- Subscription is injected through the existing `transport` seam, so the UATs drive it directly — same doubles-only-at-the-network rule the current library suite uses.

**Q3 — one consequence worth your sign-off.** DOC-24 lists `body` in `UNLOGGED_PATHS`: the log records that a body moved, never what it now says. So AC1 ("the AI description appears on the already-open tab") cannot be served from the event alone. The list row is fine — `description_status` is a *field* and travels in full. But to show the **text**, the client must re-fetch `transport.item(uid)` when a body-change event names the material whose detail is currently open. One extra request, only for the open detail, only when its body actually changed. That's the honest reading of the mechanism rather than a gap in it — confirming you're happy with it before I write the AC language for it.

Nothing else is unclear. Say go on Q1/Q2 (and Q3 if you disagree) and I'll cut the branch and build it.

<!-- xgd-chat-end -->