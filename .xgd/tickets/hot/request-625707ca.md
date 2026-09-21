---
uid: request-625707ca
id: REQ-289
type: request
title: 'Content copy between stores: GET /api/export, bin/copy-to-cloud, bin/copy-from-cloud'
created_by: EPIC-16
created_at: '2026-09-21T00:08:58.636330+00:00'
updated_at: '2026-09-21T00:08:58.636330+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ac9e4976
---

Parent: [[EPIC-16]]. Asked for by the operator on 2026-09-20, after a session that
established three things at once: `publish` names two different operations, the
Lagrange Foundry site exists only in a gitignored directory, and nothing in the
system can read content out of a store in any direction.

## Why

**`publish` is overloaded.** It means: take a draft, freeze it as a version, make
that version live. `bin/publish` uses the same word for *copy bytes from this
laptop to Cloudflare* — a different operation on a different axis. Both
`bin/publish`'s header and [[DOC-41]] §3 already carry a paragraph apologising
for the collision, which is the defect rather than the mitigation.

**The only content path points the wrong way.** `bin/publish` / `1c push` read
`storage/sites/<slug>/`, the git-tracked file tier. The sites that actually exist
were built in the builder and live in the local D1/R2 under
`apps/control-app/.wrangler/state/`. So there is no command that moves a
builder-authored site to production, and [[EPIC-16]] §C step 5 does not work for
the one site that needs to travel.

**And the same gap is a live data-loss exposure.** The Lagrange Foundry draft —
`site_936dd7c92e5e14df694dd9a80433aa4f`, 190 authored changes, one 23.7 KB L1
page, 17 assets — exists in exactly one place: a gitignored miniflare directory,
with zero published revisions to fall back to. `1c reset` is documented as
removing precisely that directory. There is no backup and nothing would notice.

## Why it is a new command and not a rename

Node cannot open the source. Miniflare's D1 is a SQLite file whose layout is an
implementation detail, and R2 is a second SQLite plus a blob directory beside it.
Reading those directly is a third store adapter with no contract behind it —
which is the same argument `import-site.ts` already makes for why import is
port-to-port and writes through the Worker.

So export is that argument in reverse: **the Worker reads, through the very store
it serves from**, and the command is two HTTP calls with the origins chosen by
direction. One route; and dev→prod, prod→dev and backup are the same route.

## Behaviour

**The export route.** `GET /api/export` returns the authenticated business's site
as **the same payload shape `/api/import` accepts** — `slug`, `siteJson`, `pages`
(name + document), `assets` (name + base64 bytes). Export followed by import
yields a draft identical to the original: same `site.json`, same page documents,
same asset bytes under the same names. The two routes are a matched pair, and a
change to the payload shape that touches one must touch the other.

**It resolves its target the way import does.** The business comes from the
authenticated scope, not from a query parameter. A business holding more than one
site is refused as unresolvable ambiguity — the same refusal `/api/import` makes,
in the same words — rather than resolved by first match. A business holding no
site is a 404 naming the business.

**The commands.** `bin/copy-to-cloud <business>` reads from the local builder and
writes to the deployed one; `bin/copy-from-cloud <business>` is the same two calls
with the origins swapped. The direction is in the name because the operator has to
be able to read it back later and know which way the bytes went.

- `<business>` is the business's **name** as it reads in the builder, e.g.
  `"Lagrange Foundry"`. It resolves to a tenant independently on each side.
- `--origin` overrides the non-cloud end, as `bin/publish` allowed, so the pair
  works against a dev server on any port.
- The cloud end needs the Cloudflare Access service-token **pair**
  (`CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`), exactly as `bin/publish
  --production` did. `CLOUDFLARE_API_TOKEN` is refused like no credential at all.

**The target business must already exist.** Copying to a business that is not on
the far side fails with a message telling the operator to create it in the builder
first. **The command never mints a tenant** — a deployment acquiring a business
nobody signed up for, from a laptop script, is the failure this refusal exists to
prevent. Production holds one tenant and no sites today, so this path is reached
on the very first use.

**The BUG-51 guard is preserved and passed through.** `/api/import` refuses a
target carrying changes authored in the builder; `--force` is how the operator
says they meant it. `bin/copy-to-cloud` forwards it and reports the refusal
naming the business and the change count.

**Data classes, and the one asymmetry.** `--site` is the default and the only
class implemented here. `--contacts` is **recognised and refused on
`copy-from-cloud`**, with a message giving the reason — contacts are real people's
data, and pulling them onto a laptop puts them in a dev store running
`ACCESS_DEV_OPEN=1`. That refusal is in the code before the feature exists, so
that building `--contacts` later cannot quietly make it symmetric. On
`copy-to-cloud`, `--contacts` reports that it is not implemented yet. Neither is
an "unknown flag" error: the flag is known, and what it means is a decision this
ticket records.

## Acceptance

The first real use is the backup: `bin/copy-from-cloud` is not what saves the
Lagrange Foundry draft — `GET /api/export` against the **local** builder is, and
the export lands somewhere committable. That round trip is the proof the route
works, and it is why this ticket is ahead of the pipeline children.

[[DOC-41]] §2 and §3 name `bin/publish` as the content path. Both sections are
updated here to name the new pair, and to state that a site's home is the
builder's store.

## Boundaries

- No `--contacts` implementation in either direction.
- No change to `/api/import`'s write path, its scope resolution or its refusals —
  export is built to match it, not the other way round.
- The retirement of `storage/sites/`, `bin/publish` and `1c push` is the sibling
  ticket. This one leaves them in place, so the backup does not wait on a delete.