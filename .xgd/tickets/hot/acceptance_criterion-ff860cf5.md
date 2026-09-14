---
uid: acceptance_criterion-ff860cf5
id: AC-1814
type: acceptance_criterion
title: Everything the Library renders as markdown goes through the one render-then-sanitize
  path, an uploaded HTML document is shown as its source rather than run, and an SVG
  stays a picture
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:07:46.337844+00:00'
updated_at: '2026-09-14T07:07:46.337844+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Rendered markdown becomes live markup, and the material it is rendered from is not necessarily
the client's own — a document can be fetched from an address as easily as dropped from a desk.
So the Library renders markdown through the **same render-then-sanitize path the workspace
already uses for the assistant's own words**, and nowhere else:

- Everything the Library renders as markdown — a markdown document in the reader, and the
  material's description — passes through that one path. There is no second scrubbing rule for
  the same trust level, and no markdown reaches the pane unscrubbed.
- Where that path has no scrubber available it degrades to showing the source escaped rather
  than inserting unscrubbed markup: a plainer pane, never a live one.
- A file that is itself markup is shown as its **source**, not run: an uploaded HTML document
  appears as the text a client wrote, and the pane is not a place where a supplied document
  executes.
- Plain text is never put through the markdown renderer: a text file keeps its own line breaks
  and gains no headings its author did not write.
- An SVG stays a picture. It decodes as text and is the one textual thing the reader refuses,
  because the pane already renders it as the image it is, and showing a client their own logo as
  angle brackets would be a regression dressed as a feature.

## Verification

With the rendering path in place, select a markdown material carrying an injection payload in
its source and observe the rendered output scrubbed of it. Remove the scrubber and observe the
same material shown as escaped source rather than as live markup. Select an uploaded HTML
document and observe its source shown rather than its markup rendered. Select a plain-text file
containing markdown-looking markers and observe them shown literally, with the file's own line
breaks intact. Select an SVG and observe it rendered as a picture with no reader window.
