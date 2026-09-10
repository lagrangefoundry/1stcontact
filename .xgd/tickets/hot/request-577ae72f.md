---
uid: request-577ae72f
id: REQ-213
type: request
title: 'Library: the client can correct what a material is for'
created_by: martin-github@westhead.me
created_at: '2026-09-10T00:26:16.895405+00:00'
updated_at: '2026-09-10T00:31:38.830396+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d4b3dfd0
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

**Only for material the client uploaded.** For anything we fetched on their
behalf (`origin: 'fetched'`, `rights: 'third_party'`) the field stays read-only.
That role was never a choice — `classify` writes it from provenance, and
DOC-38 §5 calls promoting capture-sourced bytes *"the most damaging single
action available in the system"*. Editing it is not a correction, it is the
gate being opened. This is what keeps DOC-38 §10.1 intact: an upload's role
*was* asserted by the client, so correcting a mis-drop asserts nothing new; a
fetch's role is inferred and stays inferred.

**`republishable` is recomputed from the role, server-side, never accepted from
the client.** `promoteToSiteAsset` reads that bit off the ticket, so a
client-supplied value would be the gate handing over its own key.

**Changing to `Site asset` puts the bytes on the site**, by the same
`promoteToSiteAsset` path the upload takes, recording `placed_on`. Without it
the row would flip straight to REQ-181's *"Not on the site"* warning — which
would be true and useless. It fails soft exactly as the upload's `placeOnSite`
does: the role change stands and the placement failure is reported, because a
site store that refuses the write must not read as *the correction did not
happen*.

**Changing to `Background information` sets `republishable: false`**, and is
refused when the bytes are already on a site. `placed_on` records where bytes
went (BUG-47) and there is no removal path; allowing the narrowing would leave a
row saying *"just for you to read"* while the file is live on the client's own
site. The refusal names the reason.

## Surface

- `POST /api/material/role` — `{uid, role}`, role validated against
  `'site' | 'reference'` and refused rather than coerced, matching the upload
  route's own handling of the same value.
- The Library sends the change and splices the returned row back into the list,
  the way the description save already does.

## The site slug

The Library is business-scoped and deliberately does not know which site is open
(REQ-181). So the route resolves it: a business holds one site in v1, and the
tenant store's `slugs()` answers which. No site, or more than one, means the
role change still lands and placement is simply skipped — the same soft failure
shape as above, rather than a new refusal.

## Test plan

UATs named `test_UAT_FC_REQ-213_*`, driven through the real route and the real
panel:

- Background → Asset on an upload: role and `republishable` change, and the
  bytes land in the site's asset store with `placed_on` recorded.
- Asset → Background on an unplaced upload: role and `republishable` change.
- Asset → Background on a placed upload: refused, with the reason.
- Fetched material: the field is not editable, and the route refuses the change
  even when called directly.
- `republishable` sent by the client is ignored; the value is derived.
- A placement failure leaves the role changed and reports the failure.
