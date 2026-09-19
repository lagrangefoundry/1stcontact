---
uid: acceptance_criterion-e2e40396
id: AC-1833
type: acceptance_criterion
title: Offline re-extraction takes its members from the store and still navigates
  them through a real browser against a local server
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:48.686133+00:00'
updated_at: '2026-09-19T13:37:48.686133+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Offline re-extraction takes a bundle's members **from the store** rather than
from the host filesystem, and still performs a real browser navigation of those
mirrored bytes served over a local server. Both halves hold together: the members
travel through the same contract every other verb uses, and the navigation — the
whole reason the verb exists, since re-extracting against a bundle's own mirrored
fonts is what makes the measurement offline-faithful — is not traded away for
portability. Because a local server is what the navigation needs, the verb
remains available where one can be run and is not offered by the deployed
runtime.

## Verification

Assert structurally against the shipped source that the re-extraction verb names
no host-filesystem facility and does still name the local-server facility — the
two halves asserted together, so that a later change cannot quietly "finish the
port" by dropping the navigation. Behaviourally, re-extraction against a stored
bundle continues to produce the same measurements it produced when it read the
directory directly.
