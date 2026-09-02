---
uid: request-81c9ad89
id: REQ-181
type: request
title: 'Library under one-site-per-business: badge the exception, not the rule'
created_by: xgd
created_at: '2026-09-02T23:53:02.972968+00:00'
updated_at: '2026-09-02T23:53:02.972968+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 3
  chat_ticket: chat-ded18c49
  auto_merge_back: true
  needs_review: false
---

# Library under one-site-per-business: badge the exception, not the rule

## The model this follows from

[[CHAT-36]] settled the scope model: **Account → N tenants ("businesses") → one
site each in v1**, with multiple sites per tenant kept reachable for v2 and never
migrated for. The tenant is the isolation boundary and owns customers, money,
calendar, marketing, monitoring and knowledge. Site selection is promoted to the
header and applies across the whole tab strip; switching it switches the
business.

That decision is being written up as a DOC in that conversation. **This ticket is
the Library slice only** and should be reconciled against the DOC when it lands.

## What it breaks here

[[BUG-47]] replaced `site_slug` with `fields.placed_on` — a list of slugs written
by `recordPlacement` only after the bytes are copied. Under one site per tenant
that list is **0 or 1 entries**, and `placedHere(row, site)` collapses to
`placedList(row).length > 0`.

So the third state — *"a site asset, but on a different site"* — **cannot exist in
v1**. There is no other site to be on. The pill is therefore either redundant
(role `site`, placed: the normal case) or an error signal (role `site`, not
placed). It carries no information in the case where it fires most.

The accent colour goes with it. `builder.css` justifies it as *"the answer to a
question the client asked by switching sites"* — but under a header-level
selector, switching sites switches the business and the whole Library changes
underneath. Nobody switches and re-scans the same list. The question that badge
answers stops being asked.

And the two facts are already correlated by construction: `classify` writes
`republishable: role !== 'reference'`, `promoteToSiteAsset` refuses anything not
republishable, and `placeOnSite` independently returns early unless
`role === 'site'`. Double-gated. Background information can never be placed.

## 1. Drop the placement pill

Remove the `builder-library__badge--here` branch from `renderRow`. A row becomes:

```
[type icon]  Title  ·  [Site asset | Background information]
```

The role pill stays as [[REQ-176]] left it. The type icon stays, with its
`aria-label`.

## 2. Badge the exception instead

Add a warning mark when — and only when — `role === 'site'` and `placed_on` is
empty. That is *"you asked for this to go on your site and the bytes never got
there."*

[[BUG-47]] named this as its second defect and did not fix it: *"a promotion that
failed is badged identically to one that succeeded."* `placeOnSite` is documented
to fail softly — *"a failure here does not lose the upload"* — and reports in the
envelope, so the material is kept and nothing on the row says the promotion did
not happen. It is still invisible today.

It must be a warning in its own right and not the accent pill recoloured: it is
rare, it is actionable, and it is the only thing on that row a client would want
to be told. Like the type icon, it carries its meaning to a screen reader and not
by colour alone.

The inversion is the point of this ticket. The current design spends the accent
on the common case; under one site per business that colours nearly every
site-role row, which is noise about the majority to say nothing about the few.

## 3. Remove the "Used on this site" filter

`filter.hereOnly` degenerates to *"only show site assets that got placed"* — the
role filter plus the error case, both of which are now expressed better. Remove
the checkbox, its label, the filter state, and the branch in `visible()`. The
text, role and kind filters are unchanged.

The comment on `visible()` about keeping *"used on this site" a VIEW of a
tenant-wide list rather than a query that would make it look like a scope* goes
with it — under the new model the Library **is** scoped to the business, and that
is no longer a distinction worth preserving.

## 4. What falls out, and the one thing that must not

With the badge and the filter gone, `getSite` has no remaining caller in
`library.js` (lines 261 and 299 are the only two), and `placedHere` becomes dead.
Both should go. **That the Library stops needing to know which site is open is
the correctness check on this whole change** — under one site per business there
is nothing for it to ask.

**But `siteChanged` must not simply be deleted.** `app.js` calls it on every site
change and says why:

```js
// The badge and the "used on this site" filter are about the CURRENT site,
// so they redraw with it. The list itself is tenant-wide and is not re-read.
library.siteChanged()
```

That last sentence is exactly the assumption the new model breaks. Once the
selector switches **tenants**, the material list is a different business's
material and must be re-read. Leaving `siteChanged: () => apply()` — or removing
the hook and leaving nothing — would show the previous business's Library after a
switch.

So the site-change hook must become a **reload** (`refresh()`), not a re-filter,
and the comment in `app.js` must be rewritten to say so. This is the one part of
this ticket that is a correctness fix rather than a simplification, and it should
not be dropped if the rest is trimmed.

Whether the reload is driven from `app.js` or from the panel is an
implementation choice; what matters is that no row from the previous business
survives a switch.

## 5. The detail pane

`RIGHTS_FIELDS` keeps `placed_on` — it is part of the read-only rights record and
the detail pane is where the full fact belongs. Its label is `Used on`, which
describes usage rather than placement; it should say what the field holds. The
field stays a list, because v2 restores the multiplicity.

## 6. Comments that now argue for the opposite of the model

In this codebase the comments are the design record, so these need rewriting
rather than leaving to rot. All three rest on a premise [[CHAT-36]] reversed —
that a client's second site should inherit the first's context. The decision is
now that it should **not**: cross-business contamination in an assistant is worse
than a blank sheet, because it is invisible and unfalsifiable, and the escape
hatch is uploading the background documents you actually want carried over.

- `library.js` header — *"DOC-38 §7.7 lets one blob back two sites and DOC-10
  §4.1 makes shared knowledge across a client's sites deliberate — their second
  site should not start as cold as their first."*
- `material.ts` on `listMaterial` — the same argument, in the same words.
- `app.js` — the `siteChanged` comment above.

[[DOC-38]] §7.7 itself is a DOC change and belongs with [[CHAT-36]]'s write-up,
not here. Where a comment cites it, cite the new DOC once it exists; until then,
state the v1 invariant plainly rather than repeating a superseded rationale.

## Not in scope

- **A "live on the site" indicator.** `editAssetAdd` writes `draft/assets`, so
  nothing here is on the public site until the client publishes. A truthful live
  indicator is a read against published state and is its own ticket. This is why
  the requested `Live on the site` wording was never applied in [[REQ-176]].
- **The DOC that supersedes the tenant-wide premise** — [[CHAT-36]] owns it.
- **Any schema change.** `sites (tenant_id, slug)` already expresses N sites per
  tenant; v1 holds the invariant of one by convention. Nothing migrates.

## What must hold afterwards

- No row shows a placement pill.
- A row whose role is `site` and whose `placed_on` is empty shows a warning; no
  other row does.
- The warning is perceivable without colour.
- There is no "used on this site" filter; text, role and kind still filter.
- `library.js` does not read the current site anywhere.
- After the selector changes business, no row from the previous business is
  visible.
- The type icon and role pill are unchanged from [[REQ-176]].
