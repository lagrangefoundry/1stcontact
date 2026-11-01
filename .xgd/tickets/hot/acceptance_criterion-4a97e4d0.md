---
uid: acceptance_criterion-4a97e4d0
id: AC-2074
type: acceptance_criterion
title: Every element and every document-level key of every reproduced page in the
  corpus reads through the surface and writes back unchanged
created_by: xgd
created_at: '2026-11-01T01:10:56.582743+00:00'
updated_at: '2026-11-01T01:10:56.582743+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

For every reproduced page in the reproduction corpus, every element address the page map
returns can be read through the element read and written back through the element write,
and every document-level key the page carries can be read through the page-style read and
written back through the page-style write; each such write-back is accepted and leaves
the page unchanged. Anything the reproduction path can express on a page, the assistant's
surface can therefore read and write.

Together with the schema-derived key set of the page-style read, this makes the
guarantee structural: a document key the reproduction path begins to emit is reachable
the day it is added, and an element or key the surface would strip or refuse fails this
check.

## Verification

Iterate over every reproduced page in the corpus. For each element address in the page
map, read the element and write it back; for each document-level key present, read it and
write it back. Assert every write-back is accepted and the stored page is unchanged
afterwards. Assert every document schema key other than the element tree is covered by
the page-style operations.