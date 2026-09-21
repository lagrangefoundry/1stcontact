---
uid: request-625707ca
id: REQ-289
type: request
title: 'Content copy between stores: GET /api/export, bin/copy-to-cloud, bin/copy-from-cloud'
created_by: EPIC-16
created_at: '2026-09-21T00:08:58.636330+00:00'
updated_at: '2026-09-21T00:35:12.735065+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ac9e4976
  commits:
  - working_sha: 37fddc2bd99e1000af31ecefaaecb9da3a02368a
    reconcile_sha: null
    main_sha: null
  version: 0.2.301
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


## How it is built

These are the decisions the implementation session settled. They are consequences
of the behaviour above rather than additions to it, and they are recorded here so
the UATs that pin them have language to point at.

**A business is named, and the name is resolved on each side independently.**
`<business>` is matched against `GET /api/businesses` on that origin — the
switcher's own list, which reports exactly what that caller may operate and
nothing else. The match is case-insensitive and exact; two businesses answering
to one name is refused as ambiguity rather than resolved by first match, for the
same reason `/api/import` refuses a business holding two sites. A name that is
not in that list is refused with the list the side did offer, because "no such
business" and "not yours" are the same sentence from the outside and the list is
the only useful half of it.

**Nothing here addresses a business by id on the wire except the prefix.** Once
resolved, both calls are made against `/b/<businessId>/api/…` — the prefix
`scope.ts` already defines — so the target of the read and the target of the
write are each stated explicitly rather than left to "whichever one you may
open first".

**The commands are `bin/copy-to-cloud` and `bin/copy-from-cloud`, and both are
one implementation.** They forward to `1c copy-to-cloud` / `1c copy-from-cloud`,
which is the same code with the origins swapped — the direction is a parameter,
and it is in two names because the operator reads the name back, not the
parameter. (`1c copy` is the structured-edit verb and is untouched.)

**The Access service-token pair is sent to whichever end is behind Access, which
locally means `bin/access-sim`.** The pair is *required* for the cloud end and
*sent* to any end when it is set, because the local builder run behind
`bin/access-sim` is reached exactly the way production is — that is what
`--origin` is for. Half a pair is refused before either call is made, and
`CLOUDFLARE_API_TOKEN` is named in that refusal as the credential it is not.

**`--backup <path>` reads the source side and writes nothing to the
destination.** This is the acceptance case above made into a supported command:
the Lagrange Foundry backup is the local builder's own export landing in a file
the operator can commit, and the alternative is a hand-built `curl` that has to
know a business id. The direction still says which side was read — `bin/copy-to-cloud
--backup lf.json "Lagrange Foundry"` reads the local builder, because local is
what to-cloud reads.

**Export and import share one reader, so the payload shape cannot come apart.**
`readSitePayload` — the function `1c push` already reads a draft with — is split
so that the read and the capture-rights gate are separate, and `GET /api/export`
calls the read. The gate stays on the write side: it is `/api/import`'s, it
already runs there against the destination's own bundles, and a read of a store
the caller already owns publishes nothing.

## Test plan

UATs named `test_UAT_FC_REQ-289_*`:

- `…_export.workers.test.ts` — in workerd, over a real D1 and a real R2, through
  the route table: `GET /api/export` answers the payload `/api/import` accepts;
  export → import into a SECOND business reproduces the draft exactly (same
  `site.json`, same page documents, same asset bytes, text and binary alike) and
  the site key is the one thing that differs, because a copy must not carry the
  source's address; a business holding two sites is refused 409 saying nothing
  was read; a business holding none is 404 naming the business.
- `…_copy.test.ts` — the command, against a recorded transport: the direction
  chooses which origin is read and which is written; the business name resolves
  to each side's own id and both calls carry that side's `/b/<id>/` prefix; the
  credential pair reaches both ends and the BUG-36 assertion header reaches
  neither; a business absent on the far side is refused before anything is read
  and without minting anything; one name on two businesses is ambiguity rather
  than a first match; `--force` reaches the payload and its absence sends no
  `force` key at all, and a 409 is reported naming the business and the change
  count; `--contacts` is refused per direction before any call; half a
  credential pair is refused and names `CLOUDFLARE_API_TOKEN`; an Access bounce
  on the READ reads as a refusal rather than as a JSON parse error.
  Two of its cases spawn the real `bin/copy-to-cloud` / `bin/copy-from-cloud`
  over real HTTP against a loopback builder, because two decisions belong to the
  command rather than the library: `--backup` writes the source's export to a
  file and makes no call to any destination (the loopback builder answers no
  import route, so a write would fail the test), and `--contacts` is refused
  ahead of the credential check — an operator sent to provision an Access token,
  who provisions one and is then told the flag was never going to be carried,
  has been sent on an errand.

[[DOC-41]] and `apps/control-app/ACCESS.md` are documentation and carry no UAT.