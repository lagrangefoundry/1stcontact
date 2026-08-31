---
uid: acceptance_criterion-e6460efb
id: AC-1414
type: acceptance_criterion
title: A behavior module escapes every value it interpolates, and refuses an unsafe
  endpoint outright
created_by: xgd
created_at: '2026-08-31T11:06:04.869542+00:00'
updated_at: '2026-08-31T11:12:57.060468+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
A behavior module escapes every value it interpolates into its own markup, and
refuses — rather than escapes — an endpoint it must not emit at all.

A module is the sanitization boundary for its own config, and its config is
author- and AI-supplied. Every config value the module writes into element text or
into an attribute is HTML-escaped by the module itself, using the same rules as
the L1 emitter, because the two emit into one document and a value escaped one way
in one and another way in the other would be a difference with no cause. There is
no raw-passthrough helper: the only values a module emits unescaped are ones that
are already emitted markup (an L1 fragment, its own serialized CSS), and those are
visible as such at the point they are written.

Observable consequences:

- A config value containing markup — a success message holding a `<script>`
  element, a field label holding an attribute break-out followed by an `<img>` —
  renders as **inert copy**: the payload's text is still present in the page (it
  is escaped, not dropped), and no new element and no new attribute is created by
  it.
- The two failure modes are kept distinct. Escaping is for values the module may
  legitimately emit; an **unsafe endpoint scheme is refused loudly** — the render
  fails rather than emitting an escaped-but-present `javascript:` action. Escaping
  an endpoint into harmlessness would silently turn a refusal into a broken link.

## Verification
Render a behavior module with config carrying an element-shaped success message
and a field label carrying a quote-then-tag attribute break-out; assert the output
contains no `<script` and no `<img` tag, and does contain the escaped text of
both, so the payload is shown to be present-and-inert rather than stripped. Assert
the escaping applies at both sinks — element text and attribute value. Separately
render the same module with an unsafe-scheme endpoint and assert the render throws
rather than emitting the value in any form.