---
uid: report-b5ca5c4e
id: REPORT-1086
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-03T00:25:48.322369+00:00'
updated_at: '2026-08-03T00:25:48.322369+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-4ff83a8b
  plan_item_index: '1'
---

Story and criteria created; no runtime code was touched.

**Grounding**: read the bundle body (BUG-12, BUG-16, BUG-22, BUG-24, BUG-25, REQ-88 rounds 2/5/6/7, REQ-93 — the bundle carries no comments), then the implementing code: `extract.ts` (`rgbaOf`/`parseSerializedColor`, `familyStack`/`primaryFamily`, `fontLoadedOf`, `paintedSurfaces`/`surfaceChain`, `surfaceOf`, `accentBarOf`, `overlayOf`, `runsUnder` two-pass, `controlTypeOf`/`formActionOf`), `pipeline.ts` (`fontFacesFromStylesheets`, `fontFilesByFamilyOf`, ladder+probe viewports), `playwright-driver.ts` (post-settle font barrier), `reextract.ts` (`rewriteMirroredRefs`, extensionless CSS MIME), `theme.ts` (single `primaryFamily` definition), `values-diff.ts` (`rawRunToElement` accentBox, `sections[].box` always carried, `HEIGHT_PROBE_VIEWPORTS`).

**One deviation from the plan, flagged**: the plan table wrote item 1's target as "(new, CAP-71)". CAP-71's own charter explicitly scopes itself to the *fold* and declares itself distinct from capture, so filing the recording contract there would contradict the capability it lives under — and the plan's own justification argues the contract is a distinct surface feeding three independent consumers. I created **CAP-77 "Site Capture Recording Contract"** instead, whose body names CAP-71/CAP-63/CAP-73 as its downstream readers.

**Divergences from intent recorded in Technical Context rather than absorbed into ACs**: BUG-24's bounded wide-gamut serialization residual (AC-748 asserts a scrim is recorded with its alpha, not exact channels); the offline-re-extraction loopback-origin gap that blocks promoting re-extracted output into a bundle; and BUG-16's note that the font load-check precision change landed inside a concurrent free-coded commit.

```
Story #1 created for reconciliation bundle-4ff83a8b

Story UID: story-244827df (STORY-87)
Title: A capture records the page as painted: real web fonts, who paints each surface, per-run geometry, control behaviour and a viewport-height probe
Type: feature
Capability: CAP-77 (capability-d9d373d6) — newly created
Acceptance Criteria: 12 created (AC-740 .. AC-751)

Progress: 1 of 9 plan items complete
```
