---
uid: acceptance_criterion-6ebb875b
id: AC-1297
type: acceptance_criterion
title: A document is addressed by its human id and reads back as a document, with
  structured fields dropped rather than coerced
created_by: xgd
created_at: '2026-08-20T04:16:47.312192+00:00'
updated_at: '2026-08-20T04:37:26.320508+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A document's address in the corpus is its **human id**, not its title — so retitling a document leaves it the same document at the same address, and every citation to it still resolves.

Read back out of the corpus, an exported document is a document again: it has that id as its identity, its title, its body, its scalar fields, and a recorded way back to the ticket it came from. A field whose value is structured (a mapping or a list) is **dropped** rather than rendered as text, because the corpus format holds only one level of fields and a coerced value would sit there looking like data while being neither the value nor an error. A title containing punctuation that would otherwise change how the document parses survives intact.

## Verification

Export the real document store, read the corpus back through an ordinary document reader, and assert for every document that its identity matches the human-id shape, that its title and body are non-empty, and that it carries the provenance reference back to its originating ticket. Separately, render a document carrying both a scalar and a structured field and assert the scalar is present, the structured field is absent, and no coerced placeholder text appears anywhere in the result.