---
uid: acceptance_criterion-e450ae9c
id: AC-1696
type: acceptance_criterion
title: A compressed web-font wrapper degrades honestly rather than being half-read
  into a confident wrong family
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:28.950593+00:00'
updated_at: '2026-09-11T04:23:28.950593+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A compressed web-font wrapper, whose tables the platform cannot decompress, **degrades honestly
rather than being half-read**: no family, style or designer is asserted from bytes that were
never decompressed.

- The material is created and the bytes are stored.
- The body says that only uncompressed OpenType/TrueType files can be read here and that a
  compressed web-font wrapper is not one, so the file is findable by name.
- The recorded outcome is the unreadable-type outcome and the recorded describer is empty.
- No family name appears in the title or body other than what the filename itself supplies.

## Verification

Hand the step a compressed web-font file (both the zlib-per-table and the brotli-per-table
wrapper formats). Assert a material is produced, the outcome is the unreadable-type one, the
body says the wrapper's tables cannot be read, and no typeface family is claimed.
