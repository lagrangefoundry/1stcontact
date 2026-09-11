---
uid: acceptance_criterion-0c82cacc
id: AC-1688
type: acceptance_criterion
title: A document that carries text yields its own words as the material's body, and
  its own declared title where it has one
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:22:28.200714+00:00'
updated_at: '2026-09-11T04:22:28.200714+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A document that carries extractable text becomes material whose body is the document's own
words, so that a phrase appearing in the file can be found in the material's description.

For a portable document with text:

- the body contains the words of the document, not merely its name, type or size;
- the title is the document's **own declared title** where the file carries one, and otherwise
  is drawn from the document's first substantial line;
- the recorded outcome is the described outcome (the only one meaning "this is a real
  description");
- the recorded describer names what produced it — an extractor rather than an empty value.

A document whose declared title cannot be read, while its text can, still yields the text and
falls back to a derived title rather than failing.

## Verification

Hand a portable document containing a known sentence and a known declared title to the
platform's description step and inspect the material it produces: assert the body contains
distinctive words from the sentence, the title equals the document's declared title, the
outcome is the described one, and the describer is a non-empty extractor identity. Repeat with
a document whose metadata is unreadable and assert the body still carries the text.
