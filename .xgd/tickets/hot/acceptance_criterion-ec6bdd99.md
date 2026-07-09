---
uid: acceptance_criterion-ec6bdd99
id: AC-467
type: acceptance_criterion
title: Capture runs against an injectable browser driver
created_by: xgd
created_at: '2026-07-09T20:12:52.536488+00:00'
updated_at: '2026-07-09T20:12:52.536488+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
The capture pipeline reaches the browser through a swappable driver contract (mirroring the hosted browser-rendering surface: navigate, screenshot, query computed signals, list responses, read content, close). A caller can supply an alternative driver implementation, and capture produces a correct structured essence from that driver's signals without launching a real browser — proving the seam is genuinely swappable for a future hosted driver.

## Verification
Run the pipeline with an injected fake driver that returns canned signals, a stub screenshot, and stub content. Assert the driver factory is invoked exactly once and the resulting essence reflects the injected signals (host derived from the URL, one section, the injected background color present, and the injected content in the rendered HTML).
