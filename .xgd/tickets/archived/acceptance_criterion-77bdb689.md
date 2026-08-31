---
uid: acceptance_criterion-77bdb689
id: AC-893
type: acceptance_criterion
title: Redeploying identical bytes is a no-op returning the same URL; changed bytes
  land beside the previous snapshot, never on top of it
created_by: xgd
created_at: '2026-08-06T18:39:22.280276+00:00'
updated_at: '2026-08-16T07:23:12.255030+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The snapshot's identity is a pure function of its contents.

- **Identical content**: a second deploy of an unchanged site uploads nothing,
  returns the same content id and the same URL, adds no objects to shared
  storage, adds no second entry to the deploy index, and reports that the
  content was already deployed.
- **Changed content**: after any change to the site definition, a deploy yields a
  *different* content id, and the previously deployed snapshot remains present
  and readable at its own location with its own (old) contents intact. The deploy
  index then lists both snapshots, oldest first.

## Verification

Deploy, deploy again unchanged, then change a visible page string and deploy a
third time. Assert: run two returns the same id and URL as run one, uploads
nothing, and leaves the stored object count unchanged; run three returns a
different id; the run-one entry page is still readable and still carries the old
string; the run-three entry page carries the new string; and the deploy index
lists both ids.