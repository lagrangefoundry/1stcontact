---
uid: comment-7e6c40dc
id: COMMENT-788
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T18:55:53.808630+00:00'
updated_at: '2026-08-07T18:55:53.808630+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-84177029
  kind: note
---

Done — the violation is closed, and the four-capability cluster it belongs to is closed with it.

## What the finding actually was

CAP-88 was `active` with zero stories: its only story (STORY-102) was moved to CAP-89 during the 2026-08-07 consolidation, but CAP-88 was never retired. The report was explicit that the repair is **capability retirement, not authoring a story** — authoring one would re-duplicate what STORY-102 already covers. I followed that.

## Mutations (4, all auto-committed, tree clean)

| Capability | Change |
|---|---|
| CAP-88 | `superseded`, `superseded_by_uid: capability-b4ac88fc` |
| CAP-89 | body amended to absorb stranded scope (below) |
| CAP-80 | `superseded` → CAP-89 (same defect) |
| CAP-83 | `superseded` → CAP-89; cleared stray `merged_into` |

## Two judgement calls worth your attention

**I used `superseded`/`superseded_by_uid`, not the report's `deprecated`/`merged_into`.** The report cited CAP-64/66/72 as precedent, but those predate the lifecycle migration — `merged_into` isn't a declared capability field at all. The schema declares `superseded_by_uid` with `required_when: status == superseded`, and CAP-81/CAP-84 were retired that way earlier the same day, into the same CAP-89. Substance of the report honoured exactly; field vocabulary follows the schema.

**Retiring CAP-80/CAP-83 bare would have permanently lost scope prose**, so I moved it into CAP-89 first: CAP-80's build-time-vs-serving-time boundary, its distribution marker and referenced-by-nothing byte scan; CAP-83's fold-emits-literals-only boundary and re-runnability; and CAP-88's own handle vocabulary, usage kind and reachability points, which CAP-89's asset-store section had actually dropped.

## Corrections to the report

- Its "all five were skipped" is stale — CAP-81 and CAP-84 were already retired before the report was written; CAP-83 was half-retired.
- Its claim that CAP-83's CAP-70 boundary is missing from CAP-89 is wrong; CAP-89 already carried it. A *different* CAP-83 boundary was stranded, and that one I moved.

## Still escalated

The stale canonical index (finding 3) is unfixed and not fixable from here — needs `xgd ticket rebuild-index` from `xgd-working`. I re-confirmed it bites harder than the report said: `xgd ticket list --type capability --json` omits the retirement fields entirely, so CAP-83's half-retired state was invisible to any list-based check. I derived the zero-story claim by fetching all 25 stories individually rather than trusting the index.
