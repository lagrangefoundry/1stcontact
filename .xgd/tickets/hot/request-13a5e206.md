---
uid: request-13a5e206
id: REQ-162
type: request
title: 'The product ticket store: D1 schema, the TypePack, and the material types'
created_by: xgd
created_at: '2026-08-31T20:32:40.203324+00:00'
updated_at: '2026-09-01T00:01:02.779719+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-aa271bc5
  commits:
  - working_sha: fc117f1d35954aae5db47665181c29ea07f2a086
    reconcile_sha: null
    main_sha: null
  - working_sha: 2284bf4bbd6277afa4d0d22aa9ce6d01f97e9333
    reconcile_sha: null
    main_sha: null
  - working_sha: bc36b2cce9bd85641ebef3bff2bb459f4209b425
    reconcile_sha: null
    main_sha: null
  version: 0.2.20
  orphan_commits:
  - old_sha: fe97d3bc344f6b637416ce69b5e6043fe3759e10
    new_sha: 28b2974007f6b7024b576dcee4f80a5c1fd039bc
  - old_sha: 9255f773b5e1635c06628775eddbff1535bade50
    new_sha: a9021e4749b53b238eccdde1e37a98605e170e02
  - old_sha: 920dbb7cd600d110562ec0fa6eef839d98a35d7b
    new_sha: b6aa3a2026603fe04f8cd04c920d2a7ec5f4fb65
---

# The product ticket store: D1 schema, the TypePack, and the material types

## The gap is larger than "add three types"

[[DOC-38]] §6 rests on every piece of client material being a ticket, and
[[DOC-10]] §8 homes chat sessions the same way. Neither exists.

- No `@lagrangefoundry/ticketing` import anywhere in `tools/` or `apps/`.
- `db/migrations/` holds `0001_site_store.sql` and `0002_revisions.sql` — the
  *site* store. There are no ticket tables.
- Chat does not persist to a ticket store.
- There is no product TypePack of any kind.

So `material`, `reference` and `brief` have nowhere to be defined, and
[[REQ-159]]'s corpus predicate names types that cannot exist. This ticket stands
the store up and defines the types in it.

## Prerequisite: refresh the installed component

Deliverable 3 cannot be built against the component currently in the shared
artifact store at `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing`
— it predates lagrange-framework REQ-104 and has no `attachments.js`,
`blob_store.js` or `blob_store_node.js`.

The source has them. `lagrange-framework` on `xgd-working` carries
`fad535e8a4 [FREE-CODED] REQ-104: ticket attachments — a BlobStore port with
typed records`, and the files are present in the checkout. So the fix is one
deliberate operator action:

```
bin/install --lang js --component ticketing --env /Users/martin/lagrangefoundry
```

Narrow by design — one package, no siblings, no third-party dependencies. The
install route exists precisely so that shared-store updates happen when an
operator asks rather than implicitly, so it is a step in this ticket rather than
an assumption of it.

## What it delivers

**1. The schema.** `SCHEMA_STATEMENTS` from the ticketing component, as
`0003_ticket_store.sql` beside the existing two. The `DB` binding is already
declared in `apps/control-app/wrangler.toml` (top level and under
`[env.production]`), so no new binding is needed.

**One shared `tenants` registry, and it needs an ALTER.** `0001_site_store.sql`
already creates `tenants (id, name, status, created_at)`. Ticketing's
`SCHEMA_STATEMENTS` creates the same table *plus* `config TEXT NOT NULL DEFAULT
'{}'`, and its `IF NOT EXISTS` means that definition silently no-ops — leaving
`accessor.putTenant()` to fail on a missing column. So the migration runs
`SCHEMA_STATEMENTS` **and** `ALTER TABLE tenants ADD COLUMN config`.

One registry rather than two, deliberately. [[DOC-10]] §4.1 makes the tenant the
hard information barrier and the site store already refuses a non-`active` tenant
at handle construction; a second registry would be two places for one fact that
could disagree about whether an account is active. That is a security property,
not bookkeeping.

**2. The store, tenant-scoped at construction.** `MultiTenantTicketStore`, with
`forTenant()` supplying the scoped accessor. Per [[DOC-10]] §4.1 the tenant is
the hard information barrier and is bound into the handle — never passed per
call, so no call site is trusted to remember it. `TENANT_ID` is already a var in
the Worker's config.

**3. The blob store, in its own bucket.** `lagrange-framework` REQ-104 shipped
the `BlobStore` port with R2, filesystem and in-memory implementations, and has
the ticket store **reject attachment ops at construction** when none is injected.
So the store is not fully built until one is wired in, which is why this lives
here rather than in ingestion.

**It must not share `1stcontact-sites`.** That bucket is bound by
`apps/public-site` — the Worker whose entire job is serving bytes to the public
internet by path. Attachment blobs are the client's private material: brand
guidelines, positioning papers, competitor captures. Putting them in a bucket a
public Worker can read leaves only routing code between a client's confidential
document and a public URL.

This is the same class of mistake as BUG-31 ([[DOC-12]] §7), where a `--sandbox`
deploy shared a keyspace with a real site and could overwrite its published
bytes. The remedy there was namespacing by prefix; here it has to be a separate
bucket, because the failure mode is not overwrite but **disclosure**, and a
prefix is a convention while a bucket boundary is not.

**The bucket is `1stcontact-material`.** Keys stay `t/<tenant>/blob/<sha256>`
per [[DOC-38]] §7.2 — content-addressed for dedup and cacheability,
tenant-prefixed because a global content address would be both an existence
oracle across the tenant barrier and a contradiction of [[DOC-37]] erasure.
Declared in **both** wrangler blocks, since a named environment inherits neither
vars nor bindings, and added to `vitest.workers.config.mts` so the UAT runs
against a real R2.

**It must be created before the next production deploy:**
`wrangler r2 bucket create 1stcontact-material`. Recorded here rather than left
to the implementer's memory because miniflare conjures the bucket locally and
Cloudflare does not — so its absence is invisible in every test and appears only
in production.

**Enforcement lives at our wiring layer, not the component's.** The component
refuses `attach`/`attachments` at *call* time when no blob store is injected, and
is otherwise fully conforming — attachments are a capability, not an obligation,
which is the same optional-capability shape that keeps the Python file-backed
store conforming. That is correct upstream behaviour and should not be changed.
What we add is `ticketStoreFor(env)` throwing when `env.BLOBS` is absent, exactly
as `storeFor` throws on a missing `TENANT_ID`: a control-app deployment with no
blob bucket is misconfigured and should say so at construction rather than 500
inside an upload months later.

**4. The TypePack**, carrying:

- `material` — client uploads and fetched background (4a, 4b, 3c)
- `reference` — capture bundles (3a, 3b)
- `brief` — the per-site canonical decisions document
- the chat schemas ([[DOC-10]] §8), so sessions can persist as tickets

Fields on `material` and `reference`, per [[DOC-38]] §9:

```
rights:        owned | licensed | third_party
republishable: bool
exportable:    bool
origin:        uploaded | captured | fetched | site
kind:          document | image | font | capture
source_url:    string
```

`republishable` and `exportable` stay explicit rather than derived from `rights`,
because [[DOC-38]] §4.2 shows they invert between a client's own site and a
third-party reference — any rule deriving one from the other is wrong for half
the cases.

## What this unblocks

- [[REQ-159]] — the project KB's corpus is a predicate over these types.
- [[REQ-160]] — the session cursor lives on a chat ticket.
- [[REQ-161]] — the Library lists these tickets.
- Ingestion — it creates them.
- [[DOC-10]]'s chat persistence, which has been designed since June and blocked
  on exactly this.

## Out of scope

- **Ingestion.** This ticket defines the types; nothing here creates a `material`.
- **Migrating existing chat sessions** into the store. Chat currently lives
  elsewhere; moving it is [[DOC-10]]'s business and can follow.
- **The knowledge base over these types** — [[REQ-159]].

## Acceptance

- The ticketing schema applies as a migration; `wrangler d1 migrations apply`
  finds it beside the existing two.
- A blob bucket distinct from `1stcontact-sites`, declared top-level and under
  `[env.production]`, with a UAT pinning both — matching how every other binding
  in that file is protected.
- Attachment ops work through the wired store, and `ticketStoreFor(env)` throws
  when the blob binding is absent. (The *component's* call-time refusal is
  correct and stays as upstream wrote it.)
- A handle constructed for tenant A cannot read or write tenant B's rows —
  asserted, not assumed.
- `material`, `reference` and `brief` validate with [[DOC-38]] §9's fields, and
  reject a bad `rights` or `kind` value.
- Chat schemas are merged into the same pack, so one store serves both.
- A ticket created through the Worker is readable back through it — asserted by a
  `.workers.test.ts` that boots the real env and goes through the same
  `ticketStoreFor(env)` the Worker uses, against real D1 and real R2 inside
  workerd. **No HTTP routes**: `/api/tickets/*` belongs to [[REQ-161]], and a
  workers test against the real env is a stronger assertion than an HTTP
  round-trip, not a weaker one.

## Both open questions are now settled

- **`reference` keeps its own type.** A capture is N attachment records, one per
  bundle member, which is what makes [[DOC-13]] §9's "capture once, re-map
  forever" workable: re-extraction reads `capture.json` without pulling the whole
  bundle, and the largest real bundle measured is 23MB. It also has a lifecycle
  `material` does not.
- **`brief` keeps its own type, with `fields.site_slug`.** "One per site" is not
  "one per tenant" and a tenant may own several sites, so a well-known ticket of
  another type would need the same field plus a lookup convention. Sites are rows
  in the `sites` table rather than tickets, so a slug is the right shape.

## Implementation notes carried from review

- `src/generated/ticketing.js`, written by `1c assets` exactly as `ai-workers.js`
  is: bare `@lagrangefoundry/*` specifiers do not resolve from a linked worktree.
  This is a known trap in this repo, not a novel problem — it has already bitten
  the builder/webui path.
- The new migration's line belongs in `tests/support/d1-site-factory.ts`'s
  explicit `MIGRATIONS` list.

---

## What landed (free-coded, 2026-08-31)

Implemented as scoped. The two open questions above resolved as the body already
proposed: `reference` keeps its own type, and `brief` is a type carrying
`fields.site_slug` — "one per site" is not "one per tenant", and a well-known
ticket of another type would need that field anyway plus a lookup convention on
top of it.

**`db/migrations/0003_ticket_store.sql`** — `SCHEMA_STATEMENTS`, transcribed,
because wrangler's migration runner reads `.sql` off disk and cannot import a JS
constant. A transcription is a fork unless something checks it, so
`UAT_FC_REQ-162 every statement in SCHEMA_STATEMENTS is in the migration`
asserts each one appears in the file: an upstream schema change now fails this
repository's suite instead of leaving the deployed database a version behind.

*One statement is not a transcription, and it was not foreseen when this ticket
was written.* `0001_site_store.sql` already created `tenants` — without the
`config` column `Accessor.putTenant` INSERTs. The component's own `CREATE` is
`IF NOT EXISTS`, so it sees that table and leaves it alone, and the first tenant
registration through the ticket store would have failed with `no such column:
config` against a migration that appeared to have applied cleanly. `ALTER TABLE
tenants ADD COLUMN config` reconciles them. Removing that one line fails 13 of
the 15 workerd UATs, which is how it is known to be load-bearing rather than
decorative. One registry serves both stores deliberately: a deployment must not
hold a tenant one store thinks is active and the other has never heard of.

**`apps/control-app/src/tickets.ts`** — `productTypePack()` and
`ticketStoreFor(env)`.

- Three new types with the [[DOC-38]] §9 field block shared verbatim between
  `material` and `reference`, since [[REQ-159]]'s corpus predicate and
  [[REQ-161]]'s Library both query across the two.
- `republishable` and `exportable` are **required**, not defaulted. A
  fail-closed `false` default was considered and rejected: the failure it
  produces is not a refusal anyone sees, it is a corpus silently marked unusable
  and indistinguishable from one genuinely marked so. §4.2's "explicit" only
  means something if a create that omits them is refused.
- No `status` vocabulary on the three new types. §9 specifies six fields and no
  lifecycle; the component already ships `archive`/`unarchive`, and a status enum
  invented here would be a lifecycle nothing implements and every later ticket
  would have to honour.
- Chat schemas are imported from the AI component rather than restated, because
  `TicketSessionArchive` is what reads them back and a local copy would drift
  from the code that depends on it.

**The acceptance line about construction, resolved at the wiring layer.** The
component does the opposite of what that line asks, deliberately: a store built
without a `BlobStore` refuses `attach`/`attachments` at first call and is
otherwise fully conforming — correct for a general component that cannot know
whether its host has bytes to store. This host does, so `ticketStoreFor` raises
`BlobsNotConfiguredError` at construction, in the same shape `TENANT_ID`'s
absence already had. The component's own policy is left as upstream wrote it.

**Tenant bootstrap, register-if-absent.** `forTenant` refuses an unregistered
tenant and a freshly migrated database has an empty registry — BUG-36's dead
builder, on this store. The row is made to exist, but only after a read proves
it absent: `putTenant` is an upsert that overwrites `status`, so registering
unconditionally would reactivate a deactivated tenant on the next request and
turn suspension into a suggestion.

**`1stcontact-material`**, declared in both wrangler blocks and added to
`vitest.workers.config.mts` so the UATs run against real R2.

**`1c assets` emits a ticketing shim**, exactly as REQ-146 does for the AI
library: a bare specifier resolves from the main checkout and not from a linked
worktree, so the specifier is resolved at build time and written out as an
absolute re-export.

### Evidence

15 UATs in workerd against real D1 and both real R2 buckets
(`test_UAT_FC_REQ-162_ticket_store.workers.test.ts`) — create-and-read-back
through the Worker's own wiring via two independent handles, cross-tenant
refusal on rows *and* on bytes, attachments landing in `BLOBS` and provably not
in `SITES`, the §9 field rules including `required_when` on `source_url`, and a
chat session persisting as a ticket with its `chat_transcript` comment. 7 static
UATs (`..._ticket_store_bindings.test.ts`) pin both wrangler halves, the bucket
separation, and the schema-drift check.

Both security-critical claims were mutation-tested rather than assumed: wiring
the blob store to `SITES` fails the disclosure UAT, and dropping the `ALTER`
fails 13 of 15.

### Collateral

`test_UAT_FC_REQ-143_store_bindings` asserted `bucket_name` occurrences
file-wide were exactly 2 and identical. That was the same claim while `SITES`
was the only bucket, and became wrong — not merely imprecise — the moment a
second bucket was added correctly. It now pairs by binding name, which is what
it always meant.

Prose in three new files had to stop spelling the component scope: AC-960 holds
it to a single declaration, because a restatement would read as "not installed
yet" rather than as a defect.

### Not done here

Ingestion, chat-session migration into the store, and the knowledge base over
these types ([[REQ-159]]) remain out of scope as written above. No HTTP routes
were added — [[REQ-161]] owns the Library surface, and nothing yet calls one.

**Operator note:** `wrangler r2 bucket create 1stcontact-material` is needed
before the next production deploy. Miniflare conjures the bucket locally;
Cloudflare does not.