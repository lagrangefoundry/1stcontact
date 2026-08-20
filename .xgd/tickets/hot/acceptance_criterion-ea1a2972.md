---
uid: acceptance_criterion-ea1a2972
id: AC-1315
type: acceptance_criterion
title: When the band scan finds no bands at all, capture falls back to one body-spanning
  band
created_by: xgd
created_at: '2026-08-20T04:39:10.791531+00:00'
updated_at: '2026-08-20T05:04:35.068839+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When the top-level `>=8px` band scan finds **no bands at all** yet the body still paints content, the capture falls back to a single **body-spanning** band, so runs, fields and item groups are still collected and paired downstream by text.

This is independent of the painted-extent rule and neither subsumes the other: the painted-extent rule repairs a band that *exists* but under-reports its subtree (only *some* children collapse); this fallback manufactures a band where the scan found none at all (*all* of them collapse, so there is no band for the extent rule to widen).

- An L1-style flat tree — absolutely-positioned leaves under one wrapper that collapses to 0px in flow — yields a **non-empty** actual-side manifest. Without the fallback the scan returns nothing, the manifest comes back empty, every reference element reads `missing`, and the report is **byte-identical across two completely different renders** — the diagnostic failure signature: a scoreboard that does not change when the render changes is measuring nothing.
- The fallback is general to any absolutely-positioned layout, not L1-specific.
- It stays **dormant** on a semantic multi-band page, which always has real `>=8px` top-level children.

## Verification
Capture a flat, absolutely-positioned page whose single wrapper collapses to 0px in flow; assert the manifest carries one body-spanning band and a non-empty set of runs and fields covering the leaves. Render a second, materially different flat page and assert its `values-diff` report against the same reference **differs** from the first — the byte-identical signature is gone. Capture a semantic page with several real `>=8px` top-level bands and assert the fallback does not fire: the band set is the scanned one, not a single body-spanning band.