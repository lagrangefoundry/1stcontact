---
uid: capability-fe236246
id: CAP-93
type: capability
title: 'Page Authoring Through The Control Surface: Read & Replace The Element Tree'
created_by: xgd
created_at: '2026-08-10T09:17:29.931794+00:00'
updated_at: '2026-08-16T02:37:50.769033+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: page_authoring_surface
  uat_coverage: pass
---

# Capability: Page Authoring Through The Control Surface

**Anything acting on a site through the control surface can see where every element on a
page sits, read any one of them exactly as stored, and replace it with a well-formed
element of the page's own closed vocabulary — which is how a page's words, its pictures,
its layout and its look are all changed, and how something is added to or taken off a
page.**

This capability owns *what the control surface can reach inside a page*. It is distinct
from CAP-92 (the surface declared, granted, validated and audited), which owns how that
surface is stated and governed: this one owns the reach itself, and the guarantees that
come with reaching that far.

## Scope

- **The map** — every element on a page, in order, each with the address a read or a
  write takes, the kind of thing it is, a short label to recognise it by, and the
  component instance and slot it sits inside when it is inside one. No styling
  information, so the map's size follows how many elements a page has rather than how
  richly it is styled.
- **The verbatim read** — one element and everything inside it, exactly as stored:
  nothing resolved, nothing tidied, so what comes back is exactly what may be written
  back.
- **The bounded replace** — whatever sits at one address is replaced by what was sent.
  Adding and removing are expressed as replacing a group with a group holding one child
  more or fewer; there is no separate insert or delete, and no way to submit a whole
  page at once.
- **The closed vocabulary as the security boundary** — a caller cannot write markup,
  stylesheets or scripts because nothing outside the page's typed element vocabulary is
  a valid element. A change carrying one is refused whole and the draft is left
  byte-for-byte as it was.
- **One way to change a page** — the surface offers a single operation that changes what
  is on a page, and it reaches the same validated, all-or-nothing write path every other
  caller does.

## Out of scope

- How the surface is declared, granted, argument-checked and audited (CAP-92).
- Everything a site carries that is *not* its element tree — settings, component
  instances, page search metadata, generated images.
- The operator's own click-to-edit form (CAP-86 / CAP-87), which is unchanged by this
  capability and must keep working on elements the assistant authored.