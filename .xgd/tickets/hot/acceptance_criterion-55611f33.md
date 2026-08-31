---
uid: acceptance_criterion-55611f33
id: AC-908
type: acceptance_criterion
title: Each response is typed from the key that answered, with unknown extensions
  served as generic binary
created_by: xgd
created_at: '2026-08-06T18:49:07.892587+00:00'
updated_at: '2026-08-31T11:53:09.068918+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The content type of a served response is derived from the extension of the key
that answered the request, covering at minimum markup, stylesheets, scripts,
JSON, plain text, XML, web manifests, SVG, PNG, JPEG, GIF, WebP, AVIF, icons and
web fonts, with text formats carrying a UTF-8 charset. An object whose extension
is not recognised, or which has no extension, is served as a generic binary type
rather than guessed at.

The type is derived from the key that answered rather than from the path the
client requested, so a request resolved through a fallback carries the type of
the object actually returned. It does not depend on metadata recorded by
whatever wrote the object, so the same file is typed identically however it was
written.

## Verification

Serve, from a revision the record vouches for, one object of each supported kind
plus one with an unrecognised extension and one with none; request each and
assert the exact content type. What is under test is the mapping from the served
key's extension, not how the bytes reached the store, so kinds the render does
not itself emit may be seeded into that revision directly. Store an object with
deliberately wrong recorded metadata and assert the served type still follows
the extension.
