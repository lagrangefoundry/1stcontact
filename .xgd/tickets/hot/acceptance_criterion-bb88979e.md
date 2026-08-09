---
uid: acceptance_criterion-bb88979e
id: AC-889
type: acceptance_criterion
title: Absolute, protocol-relative, fragment and already-relative references emerge
  unchanged
created_by: xgd
created_at: '2026-08-06T18:27:11.748123+00:00'
updated_at: '2026-08-09T05:41:35.540615+00:00'
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
Relocatable emission is **surgical**: only a reference that is root-relative
changes shape. Everything else emerges from the renderer byte-identical —
an absolute URL (`https://…`), a same-page fragment (`#anchor`), and a value that
was already relative (`assets/x.svg`).

A **protocol-relative** reference (`//cdn.example.com/x`) is an absolute URL naming
a remote host, and is never rewritten: turning it into a local path would silently
redirect a remote reference into the snapshot, which is a safety regression as well
as a broken link. No emitted reference at any sink reintroduces a leading slash.

A query string riding on a path is part of the path reference and survives the
rewrite intact, so cache-busting on an asset (`/assets/x.svg?v=3` →
`assets/x.svg?v=3`) keeps working.

## Verification
Render a document carrying, at each sink, an absolute URL, a protocol-relative
host, a bare fragment, an already-relative path, and a root-relative path with a
query string. Assert the first four appear in the output exactly as declared, the
last appears with its leading slash dropped and its query intact, and that no
`src`, `href` or `url()` in the emitted page or stylesheet begins with a single
slash.