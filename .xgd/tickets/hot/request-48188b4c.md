---
uid: request-48188b4c
id: REQ-70
type: request
title: responsive TextRun typography (per-breakpoint fontSize/lineHeight/letterSpacing)
created_by: xgd
created_at: '2026-07-18T17:42:24.278274+00:00'
updated_at: '2026-07-19T01:04:54.709523+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 436dc7009fc341ce31b118f6f2e0ab3e844374f8
    reconcile_sha: null
    main_sha: null
  version: 0.0.145
---

## Goal
Let a **TextRun** author per-breakpoint typography — `fontSizePx`, `lineHeightPx`,
`letterSpacingPx` as `{ base, sm?, md?, lg?, xl? }` (the same responsive form the dials
already accept), so a heading can be smaller on mobile and larger on desktop.

## Why
The gigabytealchemy reference's headings are fluid (the wordmark 36→72px, section
headings 30→36px). A TextRun's size is a single scalar today, so we render fixed while
the reference scales — the entire A-structural bucket (18 [[REQ-64]] Type-A deltas).

## Approach
TextRuns render as INLINE styles (no media queries). Emit the per-breakpoint values as
inline `--fc-rt-*` custom properties + the base property, and drive them from a global
attribute-selector rule (`[style*="--fc-rt-fs:"]`) with the `overrideChain` fallback —
so no module/call-site changes are needed. Extends the dials' proven responsive pattern
(`responsiveStepVars` / `overrideChain`) to TextRun typography.

## Scope
- schema/type: `fontSizePx`/`lineHeightPx`/`letterSpacingPx` accept the responsive object.
- `resolveTextStyle`: responsive axis → inline `--fc-rt-<fs|lh|ls>` vars + base property.
- `responsiveTextCss()` appended to the aggregated module CSS (once per page).