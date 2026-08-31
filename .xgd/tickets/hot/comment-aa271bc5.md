---
uid: comment-aa271bc5
id: COMMENT-1878
type: comment
title: Comment on request REQ-162
created_by: xgd
created_at: '2026-08-31T20:44:16.045382+00:00'
updated_at: '2026-08-31T20:48:33.306435+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-13a5e206
  kind: chat_transcript
---

<!-- xgd-turn id="1ffc1607-5b85-4477-b882-1d2de767309c-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T20:43:53.861671+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="1ffc1607-5b85-4477-b882-1d2de767309c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T20:48:33.286096+00:00" -->
#### Claude
I've surveyed the ground. Six things need a decision before I cut code — five have obvious defaults, one is a genuine blocker.

## 1. Blocker: the installed ticketing component predates the work this ticket depends on

The shared artifact store at `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing` has no `attachments.js`, no `blob_store.js`, no `blob_store_node.js` — it's from before lagrange-framework REQ-104/107/108. The `BlobStore` port, `R2BlobStore`, `ATTACHMENT_SCHEMA`, `bindScopedStore`'s blob scoping — none of it is there. Deliverable 3 cannot be built against it.

The fix is one deliberate operator action, and I've dry-run it: `bin/install --lang js --component ticketing --env /Users/martin/lagrangefoundry`. It's narrow — one package, no siblings, no third-party deps, nothing else in the store is touched.

**May I run it?** The install route's whole point is that updates only happen when an operator asks, so I'm not taking it unilaterally.

## 2. `tenants` already exists, and its shape disagrees

`0001_site_store.sql` creates `tenants (id, name, status, created_at)`. Ticketing's `SCHEMA_STATEMENTS` creates the same table plus `config TEXT NOT NULL DEFAULT '{}'` — and `IF NOT EXISTS` means its version silently no-ops, so `accessor.putTenant()` (which INSERTs `config`) would fail with `no such column`.

Proposed: the migration runs `SCHEMA_STATEMENTS` **and** an `ALTER TABLE tenants ADD COLUMN config`. One shared tenant registry serving both stores — the site store and the ticket store agree on what a tenant is, which is what DOC-10 §4.1 wants. The alternative (a second registry table) would be two places for one fact.

## 3. The acceptance line about construction doesn't match the component

> "a store constructed without a `BlobStore` fails at construction rather than at first use"

The component does the opposite by design: `TicketStore` without `blobs` refuses `attach`/`attachments` at call time and is otherwise fully conforming ("a capability, not an obligation"). It only throws at construction if handed an *un*scoped blob store.

Proposed: satisfy the intent at **our** wiring layer — `ticketStoreFor(env)` throws if `env.BLOBS` is missing, the same way `storeFor` throws on a missing `TENANT_ID`. A control-app deployment with no blob bucket is misconfigured, and should say so at construction rather than 500 inside an upload months later. The component's own policy stays as upstream wrote it.

## 4. Bucket name

`1stcontact-material` — distinct from `1stcontact-sites`, declared top-level and under `[env.production]`, added to `vitest.workers.config.mts` so the UAT runs against a real R2. Keys stay `t/<tenant>/blob/<sha256>`, which is what `R2BlobStore` already composes.

Note this needs `wrangler r2 bucket create 1stcontact-material` before the next production deploy — miniflare conjures it locally, Cloudflare won't.

## 5. What "readable back through it" means

Acceptance says *"a ticket created through the Worker is readable back through it."* Ingestion is out of scope and the Library UI is REQ-161, so I read this as **the Worker's wiring, not new HTTP routes**: a `.workers.test.ts` that boots the real Worker env, takes the store through the same `ticketStoreFor(env)` the Worker would, creates a `material` and reads it back — inside workerd, against real D1 and real R2.

Adding `/api/tickets/*` now would put API surface in this ticket that REQ-161 owns and nothing yet calls. **Confirm no HTTP routes?**

## 6. The two open questions in the body

- **`reference` as its own type** — keep the separation. A capture is N attachment records (one per member, so re-extraction can read `capture.json` without pulling 23MB), and it has a lifecycle `material` doesn't. Recorded in DOC-38 §9 and I see no reason to reverse it.
- **`brief` as a type** — keep it a type, with `fields.site_slug`. "One per site" isn't "one per tenant", and a tenant may own several sites; a well-known ticket of another type would need the same field anyway plus a convention to find it.

---

Everything else is settled: migration `0003_ticket_store.sql` beside the existing two (and its line added to `tests/support/d1-site-factory.ts`'s explicit `MIGRATIONS` list), a `src/generated/ticketing.js` shim written by `1c assets` exactly as `ai-workers.js` is done — bare specifiers don't resolve from a linked worktree — the pack merging `chatSchemas()` from `@lagrangefoundry/ai` with `ATTACHMENT_SCHEMA` and the three new types, and UATs pinning both wrangler halves, cross-tenant refusal, and the field enums.

Answer 1 and 5 and I'll cut the branch and build it.

<!-- xgd-chat-end -->