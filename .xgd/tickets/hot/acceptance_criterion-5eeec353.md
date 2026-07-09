---
uid: acceptance_criterion-5eeec353
id: AC-472
type: acceptance_criterion
title: Source channel selection shoots draft by default and published on request
created_by: xgd
created_at: '2026-07-09T20:20:08.647077+00:00'
updated_at: '2026-07-09T20:20:08.647077+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3ae5b34e
  kind: behavior
  regression_only: false
---

## Criterion
In slug mode, `--source draft` (the default when the flag is omitted) renders, serves, and screenshots the working draft channel, while `--source published` renders, serves, and screenshots the latest published channel. The channel selected is reflected in the default output filename/location for that shot.

## Verification
Run `1c shot <slug>` without `--source` and assert the draft channel was rendered and served. Run with `--source published` and assert the published channel was rendered and served (e.g. the served/output path corresponds to the published channel). Use an injected fake driver so no real browser is required.
