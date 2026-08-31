---
uid: acceptance_criterion-fbf6a87f
id: AC-1406
type: acceptance_criterion
title: No filesystem-backed junction or archive can reach the deployed artifact, asserted
  over its import graph rather than by a passing turn
created_by: xgd
created_at: '2026-08-31T10:38:10.321018+00:00'
updated_at: '2026-08-31T10:38:10.321018+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Nothing that keeps a conversation on a local disk can reach the deployed host's
shipped artifact — neither the tier that holds the turn in flight nor the archive
behind it. The property is asserted over the artifact that is actually deployed,
by walking every import it carries, and **not** by observing a turn succeed.

A passing turn is deliberately excluded as evidence, because it is not evidence:
the filesystem module resolves in the deployed runtime under its compatibility
setting and answers with a per-isolate scratch disk. Writes succeed and reads come
back, so a disk-backed archive passes every test and then loses every conversation
the next time the isolate is replaced. The failure this criterion guards against
is invisible to any test that only runs a turn.

## Verification

Build the artifact that would be deployed and walk its import graph from its entry
point. Assert that no filesystem module and no filesystem-backed store, junction or
archive is reachable from it. Prove the walk is not vacuous: plant a filesystem
import and a filesystem-backed store import in turn, and assert each is caught —
a walk that followed nothing would otherwise pass by doing nothing.
