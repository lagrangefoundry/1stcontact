---
uid: request-cbff2cf6
id: REQ-71
type: request
title: styled inline runs in markdown body prose ([text]{attrs} spans)
created_by: xgd
created_at: '2026-07-18T18:00:40.855610+00:00'
updated_at: '2026-07-24T22:27:31.474765+00:00'
completed_at: '2026-07-24T22:27:31.474765+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 2ea933b3a565d837e2ee988b594a8b598504e358
    reconcile_sha: null
    main_sha: null
  version: 0.0.146
---

## Goal
Let a run INSIDE markdown body prose carry per-run style — colour, size, line-height,
emphasis — via the `[text]{color=… fontSizePx=… emphasis=italic}` inline span syntax,
so an emphasised phrase in a paragraph can match the reference.

## Why
Discrete text (headings/labels) is a styled TextRun and fully styleable, but a body
paragraph is a markdown STRING rendered by the standard converter, which has no way to
colour/size an inline run. The gigabytealchemy reference's italic emphasis lines are a
specific slate (#45556c/#1d293d) and size — 12 [[REQ-64]] Type-A deltas we can't close.
The styled-text MODEL + parser exist (text-markup.ts) but nothing renders them; body
prose uses `renderMarkdown` (plain markdown), so the span syntax renders as literal text.

## Approach (surgical)
`[text]{attrs}` survives markdown as literal text (a bare `[text]` is not a link). Add a
`transformStyledSpans` post-process to `renderMarkdown` (like the existing
`transformCallouts`): match `[text]{attrs}`, parse the known style keys, resolve to an
inline `style` via `resolveTextStyle` (+ emphasis → font-style/weight), emit
`<span style="…">text</span>`. Unknown keys → left literal (no silent mis-style); output
still passes `assertSafeHtml`. Prose stays markdown strings; it gains one inline capability.