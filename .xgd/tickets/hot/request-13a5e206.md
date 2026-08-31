---
uid: request-13a5e206
id: REQ-162
type: request
title: 'The product ticket store: D1 schema, the TypePack, and the material types'
created_by: xgd
created_at: '2026-08-31T20:32:40.203324+00:00'
updated_at: '2026-08-31T21:18:30.309311+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-aa271bc5
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

## Prerequisite: the installed component predates REQ-104

Deliverable 3 cannot be built against the component currently in the shared
artifact store — it has no `attachments.js` and no `blob_store.js`.

**Reinstalling from the plain checkout will not fix it.** `bin/install` resolves
`COMPONENTS = REPO / "components"`, so it copies from whichever checkout it runs
in, and the code is not in either obvious one:

```
main                  attachments.js absent
xgd-working           attachments.js absent      <- the plain checkout
resync-577be0d7       attachments.js present     <- only here
```

The commit is `a60537ee3c [FREE-CODED] REQ-104: ticket attachments — a BlobStore
port with typed records` (2026-08-26), stranded on an **in-flight resync scratch
branch** whose most recent activity is its own resync report.

So the real prerequisite is: **land REQ-104/107/108 on `xgd-working`** — by
completing the resync or by replaying the three commits directly — verify
`components/ticketing/js/src/attachments.js` exists in the plain checkout, and
only then run `bin/install --lang js --component ticketing`.

Worth doing deliberately rather than quickly: BUG-1303 in the `xgd` repo was a
resync strip commit leaking onto `main` and deleting 26,017 ticket files, so an
unfinished resync is not a neutral thing to install out of.

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
