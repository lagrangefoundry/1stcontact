---
uid: acceptance_criterion-8db8ef76
id: AC-723
type: acceptance_criterion
title: A slot leaf renders as an inert labelled placeholder when unbound, and as the
  same box carrying the mounted behaviour's fragment when bound
created_by: xgd
created_at: '2026-07-24T22:54:24.547238+00:00'
updated_at: '2026-08-20T08:02:49.596533+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
How a `slot` leaf reaches the published page depends on whether a behavior module
is bound to it. The seam element itself is the same either way: a `div` that
always carries its slot name as `data-l1-slot`, and carries the target
behavior-module id as `data-l1-behavior` when — and only when — the document
declares one; when the optional field is absent the attribute is omitted entirely
rather than emitted empty. Both values are HTML-escaped, so a slot name or module
id carrying markup or an attribute-breakout payload cannot close its attribute or
introduce a live element.

**Unbound.** With no module bound to it, the seam reaches the page as an inert,
labelled placeholder naming the behavior module intended to mount there — it
carries no module code and no attached behaviour, and the element is empty.
Leaving a seam unbound is **legal, not an error**: it is how an L1 tree declares a
mount point the page has not filled.

**Bound.** `renderL1Document` accepts a `mounts` map keyed by slot name. A seam
named in that map emits the bound behaviour's already-rendered fragment as that
same element's content — inside the *same* positioned box the seam already
occupies, so a mounted behaviour is painted, measured and placed by the seam's own
axes and costs no extra wrapper. The fragment is framework-rendered markup rather
than instance data (every value inside it passed the module's own escaping / URL
sinks on the way in), so it is inserted verbatim. `data-l1-slot` and
`data-l1-behavior` are emitted identically in both cases.

The attribute names the *behavior* module id: REQ-87 renamed the runtime module
type, and the emitted attribute is `data-l1-behavior`, not the pre-rename
`data-l1-capability`.

Whether a given module *may* bind to a given seam is not decided here — that is
the page composition rule (STORY-85). This criterion covers only what the renderer
emits once a binding has already been proved, or when none exists.

## Verification
Render a document containing (a) a slot declaring a behavior-module id, (b) a slot
with no module id, and (c) a slot whose name and module id carry injection
payloads, with no `mounts` supplied. Observe: the first emits both `data-l1-slot`
and `data-l1-behavior` with the declared values; the second emits `data-l1-slot`
with no `data-l1-behavior` attribute present at all; the third emits both values
escaped, with no live element or attribute breakout; and every one of them is an
empty element. Confirm no `data-l1-capability` appears in any output.

Then render the same document with a `mounts` map supplying a rendered fragment
for one seam's name. Observe: that seam's `div` now contains the fragment verbatim
as its content, with no wrapper element interposed between the seam and the
fragment, and with its `data-l1-slot` / `data-l1-behavior` attributes and its own
axis-derived class unchanged from the unbound render; the seams absent from the
map still render empty.
