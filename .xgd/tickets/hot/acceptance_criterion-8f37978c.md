---
uid: acceptance_criterion-8f37978c
id: AC-743
type: acceptance_criterion
title: Re-extracting a written bundle with no network access reproduces the same painted-font
  facts
created_by: xgd
created_at: '2026-08-03T00:24:46.443566+00:00'
updated_at: '2026-08-03T00:53:40.944122+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
A written capture bundle is self-contained: re-deriving the value set from the
bundle alone, with the original site unreachable, records the same painted font
facts as the live capture — each visible run reports its intended face as loaded
and carries the same family stack and glyph metrics.

This holds even when the bundle's stored markup and stylesheets refer to
subresources by their original absolute addresses: a reference whose file was
mirrored into the bundle resolves to the bundle's own copy. A reference with no
mirrored counterpart is left exactly as authored and fails as it would have.

## Verification
Re-extract from a fixture bundle whose font is declared against a
non-resolvable host, so the face can only load from the bundle's own mirrored
copy: every visible run reports its face as loaded (the same run reports a
fallback when the bundle's references are not resolved locally). Separately,
confirm that an absolute reference with no mirrored counterpart is unchanged by
re-extraction.