---
uid: acceptance_criterion-8db8ef76
id: AC-723
type: acceptance_criterion
title: A slot leaf renders as an inert placeholder naming its behavior module
created_by: xgd
created_at: '2026-07-24T22:54:24.547238+00:00'
updated_at: '2026-09-10T12:12:47.268341+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
**When no behavior module is mounted into it**, a `slot` leaf reaches the published
page as an inert, labelled placeholder that names the behavior module intended to
mount there — it carries no module code and no attached behaviour, and in the emitted
HTML the placeholder is an empty element. The mounted state — where a caller-supplied
fragment becomes the seam's content — is AC-1622's claim and is not described here.

The seam's own attributes hold identically in **both** states. The element always
carries its slot name as `data-l1-slot`, and carries the target behavior-module id as
`data-l1-behavior` when — and only when — the document declares one; when the optional
field is absent the attribute is omitted entirely rather than emitted empty. Both
values are HTML-escaped, so a slot name or module id carrying markup or an
attribute-breakout payload cannot close its attribute or introduce a live element.

The attribute names the *behavior* module id: REQ-87 renamed the runtime module
type, and the emitted attribute is `data-l1-behavior`, not the pre-rename
`data-l1-capability`.

## Verification
Render, with no mount supplied for any seam, a document containing (a) a slot
declaring a behavior-module id, (b) a slot with no module id, and (c) a slot whose
name and module id carry injection payloads. Observe: each is an empty element; the
first emits both `data-l1-slot` and `data-l1-behavior` with the declared values; the
second emits `data-l1-slot` with no `data-l1-behavior` attribute present at all; the
third emits both values escaped, with no live element or attribute breakout. Confirm
no `data-l1-capability` appears in any output. The mounted state is AC-1622's to
verify.
