---
uid: request-13a5e206
id: REQ-162
type: request
title: 'The product ticket store: D1 schema, the TypePack, and the material types'
created_by: xgd
created_at: '2026-08-31T20:32:40.203324+00:00'
updated_at: '2026-08-31T20:42:52.483388+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
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

## What it delivers

**1. The schema.** `SCHEMA_STATEMENTS` from the ticketing component, as a
migration beside the existing two. The `DB` binding is already declared in
`apps/control-app/wrangler.toml` (top level and under `[env.production]`), so no
new binding is needed.

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

Keys stay `t/<tenant>/blob/<sha256>` per [[DOC-38]] §7.2 — content-addressed for
dedup and cacheability, tenant-prefixed because a global content address would be
both an existence oracle across the tenant barrier and a contradiction of
[[DOC-37]] erasure. Declared in **both** wrangler blocks, since a named
environment inherits neither vars nor bindings.

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
- Attachment ops work through the wired store; a store constructed without a
  `BlobStore` fails at construction rather than at first use.
- A handle constructed for tenant A cannot read or write tenant B's rows —
  asserted, not assumed.
- `material`, `reference` and `brief` validate with [[DOC-38]] §9's fields, and
  reject a bad `rights` or `kind` value.
- Chat schemas are merged into the same pack, so one store serves both.
- A ticket created through the Worker is readable back through it.

## Open questions

- **Whether `reference` earns its own type** or is `material` with
  `kind: capture` ([[DOC-38]] §13). Decided in favour of separation; this is the
  last cheap moment to reverse it.
- Whether the `brief` is a type or a well-known ticket of another type, given
  there is exactly one per site.
