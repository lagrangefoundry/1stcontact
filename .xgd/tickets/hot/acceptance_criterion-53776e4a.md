---
uid: acceptance_criterion-53776e4a
id: AC-553
type: acceptance_criterion
title: A module that fails loud on hostile content is counted as a conformant safe-rejection
created_by: xgd
created_at: '2026-07-10T00:15:35.469857+00:00'
updated_at: '2026-07-10T00:15:35.469857+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
In the security dimension, if rendering a hostile fixture raises the framework's content-safety rejection — the module refusing to emit dangerous content rather than producing a render — that fixture is treated as conformant and contributes no violation to the run. A refusal to render an injection payload is the secure contract, not a failure.

## Verification
Drive the security dimension against a render path that raises a content-safety rejection on an injected payload and assert the run records no violation for that fixture (the refusal passes). Confirm a non-safety error from the render still propagates as a real failure.
