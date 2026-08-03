---
uid: acceptance_criterion-8db8ef76
id: AC-723
type: acceptance_criterion
title: 'A slot leaf renders as a positioned seam: inert when unbound, hosting the
  mounted module fragment when bound'
created_by: xgd
created_at: '2026-07-24T22:54:24.547238+00:00'
updated_at: '2026-08-03T01:32:41.519579+00:00'
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
A `slot` leaf reaches the published page as a positioned, labelled seam that
names the behavior module intended to mount there. In the emitted HTML it is an
element that always carries its slot name as `data-l1-slot`, and carries the
target behavior-module id as `data-l1-behavior` when — and only when — the
document declares one; when the optional field is absent the attribute is
omitted entirely rather than emitted empty. Both values are HTML-escaped, so a
slot name or module id carrying markup or an attribute-breakout payload cannot
close its attribute or introduce a live element.

**Inert is the unbound case, not the only case.** With nothing bound to the seam
the element is empty — a labelled placeholder carrying no module code and no
attached behaviour. When the page layer supplies an already-rendered behavior
module fragment for that slot name, the emitter places that fragment as the
slot's content, inside the **same** positioned box and under the same slot
attributes, so a mounted behaviour occupies exactly the geometry the layout
pinned for the seam. A supplied fragment is framework-rendered markup whose own
instance values already passed the module's escaping and URL sinks, so it is
placed as-is; a slot with no supplied fragment is unaffected. Deciding whether a
fragment may be supplied at all — resolving the binding, and refusing an unbound
module, a dangling or duplicated slot name — is the page layer's obligation, not
the emitter's.

The attribute names the *behavior* module id: REQ-87 renamed the runtime module
type, and the emitted attribute is `data-l1-behavior`, not the pre-rename
`data-l1-capability`.

## Verification
Render a document containing (a) a slot declaring a behavior-module id, (b) a
slot with no module id, and (c) a slot whose name and module id carry injection
payloads, with nothing supplied for any of them. Observe: the first emits both
`data-l1-slot` and `data-l1-behavior` with the declared values and empty content;
the second emits `data-l1-slot` with no `data-l1-behavior` attribute present at
all; the third emits both values escaped, with no live element or attribute
breakout. Then render the same document supplying a rendered fragment for one
slot name and observe that fragment appears inside that slot's element, with its
slot attributes and positioning unchanged and the other slots still empty.
Confirm no `data-l1-capability` appears in any output.
