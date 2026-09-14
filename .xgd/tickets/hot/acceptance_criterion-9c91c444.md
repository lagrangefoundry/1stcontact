---
uid: acceptance_criterion-9c91c444
id: AC-1763
type: acceptance_criterion
title: A successful capture lands every bundle member, each readable back as the artifact
  that went in
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:15.251154+00:00'
updated_at: '2026-09-14T05:00:56.898240+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
After `1c capture page <url>` succeeds, the bundle it names holds every member the
bundle artifact is defined by, on whichever backing it was written to:

- `capture.json` — the capture record
- `screenshot.full.png` — the full-page shot
- `screenshot-<width>.png` — one per sampled ladder width, more than one present
- `rendered.html` and `raw.html` — post- and pre-script DOM
- `multistate.json` — the multi-viewport ladder
- `l1.json` — the ladder folded into one document
- `forms.json` — the recovered behaviour bindings
- `hints.json` — the advisory structural sidecar
- one member per mirrored subresource, under the `assets/` prefix

Each member reads back as the artifact that went in, not merely as bytes of the
right length: the capture record's host is the captured URL's host, the ladder
carries at least one projection, the folded document carries at least one width,
the form model and the hint sidecar are the shapes their schemas declare.

## Verification
Run a capture to completion, enumerate the bundle's members and assert every name
above is present including at least two ladder widths. Read each member back
through the bundle's own decoding and assert on the decoded artifact's fields.