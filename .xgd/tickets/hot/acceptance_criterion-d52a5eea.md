---
uid: acceptance_criterion-d52a5eea
id: AC-2068
type: acceptance_criterion
title: Reading the page style returns every document-level key of the page exactly
  as stored, palette references unresolved, with the key set derived from the document
  schema
created_by: xgd
created_at: '2026-11-01T01:10:48.451623+00:00'
updated_at: '2026-11-01T01:10:48.451623+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

Asking for a page's style returns every document-level key the page carries — its width
ladder, background, text colour, content column and font table — and nothing of its
element tree. Each value comes back exactly as stored: a colour given as a palette
reference comes back as that reference (name and any shade), not as the colour it
resolves to, so what is read may be written back unchanged. A key the page does not carry
is absent rather than defaulted.

The set of keys covered is the page document schema's own set of keys other than the
element tree — derived from the schema, never listed by hand — so a key added to the
document schema later is read by this operation without any change to it. Asking for a
page that does not exist is refused as not-found.

## Verification

Seed a page whose background is a palette reference with a shade and whose font table
names a face. Read its style: assert the background comes back as the same reference
object (not a hex value), the font table is identical to what was stored, and no element
tree is present. Enumerate the document schema's keys other than the element tree and
assert the read operation's covered key set is exactly that set. Ask for an unknown
page: assert a not-found refusal.