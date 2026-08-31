---
uid: acceptance_criterion-d541fbe9
id: AC-1402
type: acceptance_criterion
title: A local site's draft definition and assets copy into the shared store idempotently,
  through the same store the workspace serves from
created_by: xgd
created_at: '2026-08-31T10:12:59.657430+00:00'
updated_at: '2026-08-31T16:51:02.299217+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A site held in a local store can be copied into the shared one: its definition,
every page, and every asset's bytes. The copy crosses through the **same store
the workspace serves from** — the receiving side opens that store through the one
opener every other route opens it through, and writes through the very path an
edit writes through — so there is no second writer that could disagree about what
a site is made of.

Five properties are what make it usable rather than merely possible:

- **It is idempotent.** Copying the same site twice reports the same result and
  leaves one site, not two. Re-running it after a local edit is the ordinary way
  to use it, not an exceptional recovery.
- **It lands whole or not at all.** A half-landed copy would be worse than a
  failed one: the site would exist, would validate as far as it went, and would
  be missing pages nothing had a record of.
- **The workspace then serves it.** After the copy, the site appears in the
  listing and both draft-side channels render from it.
- **It holds no privilege the other routes lack.** Bringing the deployment's
  account into existence is something opening the store does, not something only
  a copy can do — so a deployment nobody has ever copied to still serves, and the
  copy is an ordinary writer rather than the one route that can bootstrap the
  workspace. This is the property that was absent: the receiving side once opened
  the store its own way, registering the account while every other route refused
  it, which left a freshly deployed workspace unreadable until someone copied a
  site up to it from a laptop.
- **A refusal is legible.** A copy refused because the target is gated says so,
  and names what an unattended caller needs in order to be admitted, rather than
  reporting only a status.

An asset the local store lists but cannot read is a corrupt local store and fails
the copy, rather than landing as an empty file that looks deliberate.

## Verification

With a site in a local store, copy it up and assert the workspace's listing then
contains it and both draft-side channels render. Copy it a second time with no
change and assert the reported result is identical and the listing still holds
exactly one such site. Assert the reported counts of pages and assets match what
the local store held, so a silently partial copy cannot report success.

Copy a site up to a deployment whose store holds only the schema and no account,
and assert it lands. Then assert a plain *read* of an equally fresh deployment
lands too — the copy must not be the only route through which the account can
come to exist, or a workspace nobody has copied to cannot be read.

Point the copy at a gated target with no credential and assert the failure names
what is needed rather than only the status. Make one listed asset unreadable in
the local store and assert the copy fails rather than landing it empty.
