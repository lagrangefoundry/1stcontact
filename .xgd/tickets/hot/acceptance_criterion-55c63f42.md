---
uid: acceptance_criterion-55c63f42
id: AC-957
type: acceptance_criterion
title: The definition's own element identifier keeps its meaning and emission, and
  the edit address is stamped alongside it, never in place of it
created_by: xgd
created_at: '2026-08-06T21:27:21.986173+00:00'
updated_at: '2026-08-07T18:00:55.783538+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The optional identifier an author may put on an element — the one that makes
in-page anchors resolve and wires a label to its field — is emitted identically
in the edit channel and in the shipped channels. The edit channel neither writes
it, nor consumes it, nor substitutes its address for it: where a region carries
both, both appear; where an element carries the identifier but is not an editable
region, it carries the identifier and no address.

## Verification

Seed a page whose root element carries an author-supplied identifier and is not
itself an editable region. Render the preview and edit channels and assert the
identifier is emitted identically in both, and that in the edit render the
element carries the identifier with no region stamp beside it. On an element that
is both identified and editable, assert the identifier and the address are both
present.