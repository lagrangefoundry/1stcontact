---
uid: comment-e7fe3d5b
id: COMMENT-3711
type: comment
title: Comment on request REQ-312
created_by: xgd
created_at: '2026-09-23T21:15:42.801512+00:00'
updated_at: '2026-09-23T21:15:42.801512+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-fec4b115
  kind: note
---

# Serving origin — operator asks for re-review


**Operator, 2026-09-23:** *"I think it is highly desirable that a site is self-contained and
everything it needs comes from its domain."*

This is not only a preference — four things favour same-origin serving, and the section
above weighs none of them.

1. **A shared origin buys no cache reuse.** Every major browser has partitioned the HTTP
   cache by top-level site since roughly 2020. "The visitor already has this face cached
   from another tenant" has not been true for years. The year-long immutable caching above
   is right and stays right; what it does *not* deliver is sharing across sites.
2. **A second origin costs a connection** — DNS, TCP and TLS before the first font byte, on
   the path that decides whether text paints in the real face or a fallback. Same-origin
   rides the connection the page already opened.
3. **CORS stops being load-bearing.** The section above needs `Access-Control-Allow-Origin: *`
   precisely *because* the copy is cross-origin. Served from the site's own host, a font is
   an ordinary same-origin subresource and the header is no longer the thing holding it up.
4. **No third-party request from a visitor's browser.** German courts have found embedding
   Google Fonts to be a GDPR violation specifically because it discloses visitor IPs to a
   third party. Our own origin is a better third party than Google's, but it is still a
   third party *from the customer's site's point of view* — and our customers are small
   businesses who will be asked about this.

### What the renderer constraint actually forces

The section above calls the absolute platform-origin `src` "forced rather than preferred",
because the renderer reduces a root-relative `url()` to a document-relative one and
`/_fonts/x` would become `_fonts/x`.

That reasoning is sound, and it rules out **root-relative paths**. It does not choose a
**host**: an absolute `https://` URL naming *the site's own* public host passes through the
renderer untouched by exactly the same rule. So the constraint narrows the form of the `src`
without settling whose domain it names.

### The routing objection is already solved by the mechanism chosen

Resolving a platform font through `siteOfRoute` would meet the cross-tenant guard, and on a
bound customer domain that guard is right to refuse. But the section above already avoids
this by matching `/_fonts/…` **ahead of the site route grammar**, as `/api/download/…` is.
That match does not depend on which host the request arrived on — the same Worker serves a
bound customer domain — so the same mechanism serves `/_fonts/…` same-origin without ever
reaching the guard.

### The real argument for the platform origin, which the section does not make

**Hostname stability.** An absolute self-host URL baked into a rendered page goes stale when
a site later binds a custom domain or changes one. A platform origin never moves, so pages
never carry a hostname that can become wrong.

**This is the question the re-review should answer**, because it decides the whole thing:

- Are pages re-rendered and republished when a site's domain binding changes? If they are,
  the staleness window is bounded by a step that already happens, and the objection largely
  dissolves.
- If they are not, then either domain binding must trigger a re-render, or the `src` must
  name a host that cannot move — and the section above is right as written.

I have not verified which is true, and it should not be assumed in either direction.

### Shape if same-origin wins

Nothing about storage changes: one copy at `platform/fonts/<slug>/<file>`, one prefix,
no per-tenant duplication, takedown still a flip and a purge. What changes is only the host
named in the `src` that `use_font` ([[REQ-313]]) writes. `Access-Control-Allow-Origin: *` can
stay — harmless, and still needed for a preview served from a different host than the one a
page will finally live on.