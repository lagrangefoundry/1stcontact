---
uid: acceptance_criterion-40aa6724
id: AC-773
type: acceptance_criterion
title: A flat, absolutely-positioned render is segmented so the diff reads it and
  moves
created_by: xgd
created_at: '2026-08-03T02:28:28.272824+00:00'
updated_at: '2026-08-03T02:44:35.486573+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
A page whose content is a flat tree of absolutely-positioned leaves under a single wrapper — the shape an L1 reproduction renders — is segmented for comparison so its content is actually read. The manifest is normally segmented into style-scope bands from the top-level body children that paint at least a minimal height; an absolutely-positioned tree leaves no in-flow box, so that scan finds nothing and the wrapper collapses to zero height. When the scan finds no band yet the body still paints content, the page is segmented as a single body-spanning band, so the flat tree's text runs and fields are collected into the manifest and paired downstream.

Consequently: diffing a reference against a complete flat reproduction pairs every element and reports **no** `missing (present → absent)` deltas for content the reproduction genuinely renders; diffing it against a partial reproduction reports exactly the runs that are genuinely absent; and the report **moves** between two different renders instead of freezing byte-identical. The fallback is general to any absolutely-positioned layout and is dormant for a semantic page, which always yields its real top-level bands — that page's segmentation is unchanged.

## Verification
Extract from three DOMs: (1) a collapsed flat tree of absolutely-positioned leaves — assert its runs are collected (empty before the fallback existed); (2) a complete flat reproduction vs a partial one — assert the complete one pairs every element with none unmatched, the partial one genuinely misses only the absent runs, and the two reports differ; (3) a normal multi-section semantic page — assert it still yields its real per-section bands, i.e. the fallback never fires.