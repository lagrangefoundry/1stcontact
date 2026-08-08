---
uid: acceptance_criterion-cd5a5f55
id: AC-891
type: acceptance_criterion
title: A nested page slug fails the render loudly rather than emitting silently-wrong
  URLs
created_by: xgd
created_at: '2026-08-06T18:27:20.327422+00:00'
updated_at: '2026-08-08T00:43:53.688731+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Document-relative emission rests on every page of a snapshot sitting **flat at the
snapshot root**: a page one directory down would resolve every one of its references
against its own subdirectory, so a single nested page breaks every asset, font and
link on that page at once — silently, with no error and a rendered page that merely
looks unstyled.

Rendering a site therefore **fails loudly** when a page's slug is nested (carries a
path separator), with a message naming the flat-snapshot invariant and the offending
slug. The failure happens before anything is written, so a rejected render leaves no
partial snapshot and no nested directory behind.

## Verification
Render a site one of whose pages is slugged with a path separator (`docs/intro`) and
assert the render rejects with an error naming the nested slug and the flatness
requirement, and that no directory for the nested segment was created in the output.
Assert an ordinary flat multi-page site renders unaffected.