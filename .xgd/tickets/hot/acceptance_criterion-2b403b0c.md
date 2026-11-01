---
uid: acceptance_criterion-2b403b0c
id: AC-2069
type: acceptance_criterion
title: Setting the page style merges at the top level, replaces each given value whole,
  removes a key given as null, validates the resulting page, and leaves the element
  tree untouched
created_by: xgd
created_at: '2026-11-01T01:10:49.854732+00:00'
updated_at: '2026-11-01T01:10:49.854732+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

A page-style write names one or more document-level keys. Keys not named are left exactly
as they were — naming the background does not drop the font table. Each named key's value
replaces the stored value whole; it is not merged into it, so writing a column replaces
the column, and writing a palette reference without a shade over one that had a shade
leaves no shade behind. A key given as null is removed from the page. The element tree is
not changed by any page-style write.

The resulting page is validated whole before anything is written: a value of the wrong
shape, a width ladder that would strand a per-width variation an element already carries,
or removing the column while an element is anchored to it is refused, and on any refusal
the draft is left byte-for-byte unchanged. A write naming no key is refused; a write
naming a key that is not a document key is refused naming that key and the writable keys;
naming the element tree's own key is refused with a pointer to the element operation.

After a successful write, the reply names the keys changed, and reading the style back
returns what was set.

## Verification

Set only the background on a page that carries a font table: read back and assert the
background is the new value and the font table is unchanged. Set a palette-reference
background without a shade over one that had a shade: assert no shade remains. Set the
background to null: assert the key is absent on read. Assert the element tree is
byte-identical before and after each write. Send a width ladder that omits a width an
element's per-width variation uses, an empty write, an unknown key, and the element
tree's key: assert each is refused and the draft is unchanged.