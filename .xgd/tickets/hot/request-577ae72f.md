---
uid: request-577ae72f
id: REQ-213
type: request
title: 'Library: the client can correct what a material is for'
created_by: martin-github@westhead.me
created_at: '2026-09-10T00:26:16.895405+00:00'
updated_at: '2026-09-10T17:09:48.958816+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d4b3dfd0
  commits:
  - working_sha: 33c88bf8e85ff604fcbdfeb55ab1656c1b2d3720
    reconcile_sha: null
    main_sha: null
  - working_sha: b61d5df602bfca5668a7c52a657a04d3c9d58891
    reconcile_sha: null
    main_sha: null
  version: 0.2.144
---

## What the client asked for

> "I'd like to be able to Edit the *What it's for* label on a piece of content
> to change from Background to Asset."

In the Library's detail pane the rights block shows **What it is for** — `Site
asset` or `Background information`, the two areas the upload overlay drops into
(REQ-161). It is read-only. A client who dropped a photograph on *"just for you
to read"* by mistake has no way to say so, and the file can never reach their
site: `classify` writes `republishable: role !== 'reference'`, and
`promoteToSiteAsset` refuses anything not republishable.

## What changes

**The field becomes an editable select**, offering the same two labels the
overlay uses. `mountFields` already supports a per-field whitelist
(`editable: ['role']`) and a `type: 'enum'` select, so this is configuration of
the existing rights block, not a second editing vocabulary — the same argument
the description field already rests on.

**The select offers the words the pane already displays.** The block has always
rendered a role as its label, so the options are those labels and the wire value
is mapped back from one. A field that reads one way and edits another teaches
the client the wrong vocabulary for their own data. Both directions derive from
the upload overlay's own area list, so the drop areas stay the single place the
two roles are named.

**Only for material the client uploaded.** The gate is `origin`, and it is
`uploaded` and nothing else. The other two origins each fail it for their own
reason:

- *fetched* — nobody was asked. `classify` writes the role from provenance
  alone, because something we pulled on the client's behalf is by construction
  background to read rather than something they handed us to publish. Editing it
  would not be a correction; it would be DOC-38 §5's gate opening from outside.
- *captured* — the role came from the captured **host**, and a capture of the
  client's own old site is even `owned` and republishable. It still fails, for a
  structural reason as well as a rights one: a capture is 11–99 attachment
  records under one ticket and `promoteToSiteAsset` takes the first, so "put it
  on the site" has no single file to mean — and a capture carries no `filename`
  at all, which is why the pane already drops that row.

This is what keeps DOC-38 §10.1 intact: an upload's role *was* asserted by the
client, so correcting a mis-drop asserts nothing new; a fetched or captured
role is inferred and stays inferred. **A field the origin will refuse is not
offered as editable** — a control that always fails is worse than no control —
so the surface holds the same rule as the gate.

**`republishable` is recomputed from the role, server-side, never accepted from
the client.** `promoteToSiteAsset` reads that bit off the ticket, so a
client-supplied value would be the gate handing over its own key. The derivation
is `classify`'s verbatim, so the two cannot drift about what a role means.

**Changing to `Site asset` puts the bytes on the site**, by the same
`promoteToSiteAsset` path the upload takes, recording `placed_on`. Without it
the row would flip straight to REQ-181's *"Not on the site"* warning — which
would be true and useless. It fails soft exactly as the upload's `placeOnSite`
does: the role change stands and the placement failure is reported, because a
site store that refuses the write must not read as *the correction did not
happen*. **The upload's own behaviour is unchanged by the sharing** — the two
callers converge on one gate, one soft failure and one scrub rather than the
second growing a copy.

**Changing to `Background information` sets `republishable: false`**, and is
refused when the bytes are already on a site. `placed_on` records where bytes
went (BUG-47) and there is no removal path; allowing the narrowing would leave a
row saying *"just for you to read"* while the file is live on the client's own
site. The refusal names the reason and says what to do.

**The whole rights block repaints after a change, not just the row that was
picked.** A role change is not confined to its own field — the origin derives
`republishable` from it, and widening places the bytes and writes `placed_on`.
Both sit two rows below on the same block, and leaving them showing the old
answer would make the record contradict itself on screen. The list redraws too,
because the row's role badge and REQ-181's warning are read off exactly what
changed.

## Surface

`POST /api/material/role` — `{uid, role}`, role validated against
`'site' | 'reference'` and refused rather than coerced, matching the upload
route's own handling of the same value. Unlike the upload, **absent is not
allowed**: there is no pipeline entry point here that could predate the
question, only a person who picked one of two options.

The two refusals carry the status that says whose problem it is, the way the
existing material refusals do:

- **403** for material whose role was never chosen. The request is well formed
  and forbidden — the same §5 gate as `NotRepublishableError`, one step earlier.
- **409** for a file already on the site. The difference from 403 is whether it
  could ever succeed: this is a conflict with the material's *current state*, and
  the same client may make the same change once the file is off their site.
  Answering it as a permission would tell them to stop trying.

The Library sends the change and splices the returned row back into the list,
the way the description save already does.

## The site slug

The Library is business-scoped and deliberately does not know which site is open
(REQ-181) — threading a slug back through the panel would restore the dimension
that ticket deleted, in the one module whose suite asserts it cannot ask. So the
route resolves it from the tenant store, which is already scoped to this
business: a business holds one site in v1, and `slugs()` answers which.

**Zero sites or several means "do not place", not "fail".** A business with no
site has nowhere to put a picture and has done nothing wrong; a business with
several has a question nobody asked it, and guessing would put a logo on a site
they were not looking at. Both land on the existing soft path, so the correction
stands and the row honestly reports that the bytes are not on a site — which is
what REQ-181's warning badge is for. A store that will not open is the same
answer, for the same reason.

## Test plan

UATs named `test_UAT_FC_REQ-213_*`, driven through the real route and the real
panel:

- Background → Asset on an upload: role and `republishable` change, and the
  bytes land in the site's asset store with `placed_on` recorded.
- Asset → Background on an unplaced upload: role and `republishable` change.
- Asset → Background on a placed upload: refused 409, with the reason.
- Fetched and captured material: the field is not editable, and the route
  refuses with 403 even when called directly.
- `republishable` sent by the client is ignored; the value is derived.
- An absent or misspelled role is a 400, never coerced.
- A business with no site: the role change lands and nothing is placed.
- A placement failure leaves the role changed and reports the failure.
- The select offers the labels the block displays, and picking one repaints
  `republishable` and `placed_on` alongside it.
- The upload path still places, and still refuses a reference-role upload.