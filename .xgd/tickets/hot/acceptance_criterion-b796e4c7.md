---
uid: acceptance_criterion-b796e4c7
id: AC-1622
type: acceptance_criterion
title: A mounted slot emits its behavior fragment verbatim; an unmounted one stays
  the inert placeholder
created_by: martin-github@westhead.me
created_at: '2026-09-10T12:01:26.347310+00:00'
updated_at: '2026-09-10T12:01:26.347310+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion

A `slot` leaf has two emitted states, and the renderer chooses between them by
one lookup: the caller's `mounts` map, keyed by slot name.

- **Mounted.** When the caller supplies a fragment under this slot's name, that
  fragment becomes the slot's content and is inserted **verbatim and unescaped**.
  This is the single place in the sole emitter where markup is written through
  unescaped, and it is a deliberate carve-out from the capability's load-bearing
  claim that no value originating in instance data reaches the browser except
  through a typed sink.
- **Unmounted.** With no matching entry the slot stays the inert, labelled
  placeholder of AC-723 — an empty element. A `mounts` map naming some *other*
  seam changes nothing here: there is no cross-talk between seams, and an
  unmatched key mounts nowhere.
- **The seam itself is emitted identically in both states.** The slot's own
  `data-l1-slot` name, its `data-l1-behavior` attribute when the document
  declares one, and its surface and sizing axes are the same markup and the same
  rule whether or not something mounted; the fragment lands *inside* that
  positioned box rather than replacing it. Mounting is therefore invisible to the
  seam's measure — the guarantee AC-804 rests on.

**The carve-out's two preconditions are part of the criterion, not context.** The
fragment is framework-rendered markup produced by a vetted behavior module, so
every instance value inside it already cleared that module's own escaping and
URL sinks on the way in; and the binding was already proved to resolve by the
page validator before render (the rule under STORY-85). Absent either
precondition the verbatim insertion is not licensed.

## Verification

Render a document containing a slot declaring a behavior module, once with no
`mounts` and once with a fragment under that slot's name. Confirm the first is
the empty labelled placeholder and the second contains the fragment's markup
intact and unescaped, and that in both the `data-l1-slot` / `data-l1-behavior`
attributes and the emitted rule for the slot are identical. Render again with a
`mounts` map keyed by a name no slot in the tree carries and confirm nothing is
inserted anywhere in the output. Confirm the fragment is inserted inside the
slot's own element rather than in place of it, so the seam's geometry and sizing
still apply to what mounted.
