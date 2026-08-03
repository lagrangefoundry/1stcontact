---
uid: acceptance_criterion-2aec5074
id: AC-794
type: acceptance_criterion
title: An unmirrored absolute handle fails the import, naming each one, and writes
  no site
created_by: xgd
created_at: '2026-08-03T03:46:38.669416+00:00'
updated_at: '2026-08-03T03:46:38.669416+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
When the folded layout carries an absolute media handle that the bundle does not
mirror, the import fails with an error that states the reproduction would
hotlink the captured origin, gives the number of unresolved handles, names every
one of them, and points at re-capturing the bundle as the remedy. No site draft
is produced by the failed import, and no handle is silently left pointing at the
origin: there is no partial-import mode.

## Verification
Import a bundle whose asset map omits one of the handles its folded document
references. Confirm the import fails, that the failure message names the missing
handle and identifies hotlinking as the reason, and that no site draft exists
for the target slug afterwards. Repeat with the asset restored and confirm the
import succeeds.
