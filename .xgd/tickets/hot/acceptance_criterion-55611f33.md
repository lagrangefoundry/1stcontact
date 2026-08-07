---
uid: acceptance_criterion-55611f33
id: AC-908
type: acceptance_criterion
title: Each response is typed from the object that answered, with unknown extensions
  served as generic binary
created_by: xgd
created_at: '2026-08-06T18:49:07.892587+00:00'
updated_at: '2026-08-07T22:24:30.596653+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The content type of a served response is derived from the extension of the
object that answered the request, covering at minimum markup, stylesheets,
scripts, JSON, plain text, XML, SVG, PNG, JPEG, GIF, WebP, AVIF, icons and web
fonts, with text formats carrying a UTF-8 charset. An object whose extension is
not recognised, or which has no extension, is served as a generic binary type
rather than guessed at. The type served does not depend on metadata recorded by
whatever wrote the object, so the same file is typed identically however it was
uploaded.

## Verification

Serve, from a deployed snapshot the site's deploy index vouches for, one object
of each supported kind plus one with an unrecognised extension and one with
none; request each and assert the exact content type. What is under test is the
mapping from the served path's extension, not how the bytes reached the store,
so kinds the render does not itself emit may be seeded into that snapshot
directly. Assert the types the server reports agree with those recorded at
deploy time for the same extensions. Store an object with deliberately wrong
recorded metadata and assert the served type still follows the extension.
