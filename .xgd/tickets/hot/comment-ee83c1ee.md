---
uid: comment-ee83c1ee
id: COMMENT-2294
type: comment
title: Comment on request REQ-197
created_by: xgd
created_at: '2026-09-06T18:42:25.009976+00:00'
updated_at: '2026-09-06T19:09:14.136952+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-704fe21e
  kind: chat_transcript
---

<!-- xgd-turn id="1c624d85-507e-4f97-95e0-1be1a82790e0-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:41:47.517184+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1c624d85-507e-4f97-95e0-1be1a82790e0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:09:14.043132+00:00" -->
#### Claude
Design is clear from the ticket, [[CHAT-39]] and the neighbouring tickets (REQ-196/198/199). Starting work.

Now register the type and widen `query` with `sort`.

Now the workerd suite against a real tenant store.

Now lock, merge back into `xgd-working`, then record the commit.

REQ-197 is implemented and landed at `free_coded`.

## What was built

**`apps/control-app/src/templates.ts`** — the whole of it, and it never knows which business it serves: the store handle it is given is already tenant-bound, so a customer's business holds its own templates through the same code with no platform-only branch.

- **The type** — `template_key` (a *closed* `invite | signin | lapsed` vocabulary), `subject`, optional `placeholders`, required non-empty body. Registered in `productTypePack()`; the schema lives beside the renderer so declaration and reader cannot drift. All four refusals are real and verified: missing key, missing subject, empty body, and a `sign-in` typo are each rejected at the write, not at the send.
- **`templateFor(store, key)`** — looks up by key, **newest wins**, and seeds the default if the business has never had one (seed-if-absent, same shape as `ticketStoreFor`'s tenant registration). Replacing a template is writing a new ticket; the one REQ-198's records will point at survives.
- **`renderTemplate`** — substitutes in subject and body, and refuses on three counts: a declared token absent from the body, a declared token with no value (empty and whitespace count as none), and *any* token left unsubstituted — the last catches a token added to the copy and never declared. The refusal names the template key, the ticket uid and the token.
- **Three seed templates**, business-neutral, each declaring only `{{cta_url}}`. The invite carries a welcome, an anchor styled as a button, and the same URL again in full outside any anchor with "if that button does not work… paste".

## Decisions I made (all recorded on the ticket)

The body is **HTML and one part** — the multipart question stays deferred; a button cannot exist in plain text. The seed **names no business**, because the same seed is written into whichever store asks and naming us would put our name in a plumber's mail; a `{{business_name}}` token was rejected as worse, since it would fire the refusal on the ordinary path. `TicketStore.query` gained `sort` as a consequence of "newest wins".

## Tests

`tests/test_UAT_FC_REQ-197_render.test.ts` (9, node — the pure contract) and `tests/test_UAT_FC_REQ-197_templates.workers.test.ts` (7, workerd against real D1 — registration, seeding idempotence, two businesses that cannot see each other's templates, replacement, and an edit changing what renders). 31 passing including the REQ-162 store suite; no new typecheck errors (`session-knowledge.ts` TS2459 is pre-existing, confirmed against the base commit).

## Two things worth knowing

**Contention.** Four or five sibling sessions were merging concurrently. The `move-to-free-coded` version gate requires your bump commit to *be* the tip of `xgd-working`, and every session's ticket auto-commits kept displacing it — it took eleven attempts to find a window. The side effect is **ten stray `chore: bump version for REQ-197 [FREE-CODED]` commits** on `xgd-working` (package.json version scalar only) that are not in `fields.commits`. They are harmless unowned co-travellers and will ride along in the next bundle, but they are noise, and the gate's tip rule looks like a real friction point under this much parallelism.

**Nothing consumes this yet** — by design. REQ-199's invite modal will call `templateFor(store, 'invite')`; until REQ-134 mints a token to put in `{{cta_url}}`, the placeholder contract will correctly refuse the send, which is the right failure.

Ticket is at `free_coded`, version `0.2.103`, commits `242a8bf969…` and `bb73eb6d06…`. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->