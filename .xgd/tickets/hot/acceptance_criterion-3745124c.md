---
uid: acceptance_criterion-3745124c
id: AC-914
type: acceptance_criterion
title: A deploy whose output would collide with the reserved preview segment is refused
  by name and ships nothing
created_by: xgd
created_at: '2026-08-06T18:50:06.214162+00:00'
updated_at: '2026-08-16T07:23:54.617243+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The preview channel occupies one reserved path segment immediately inside a
site's address. A snapshot whose rendered output contains a top-level entry of
that reserved name is refused, with an error that names the offending entry,
names the reserved segment, and states why the entry would otherwise be
unreachable. A snapshot whose output carries that name at any deeper level, or
an entry whose name merely begins with it, passes the gate and deploys normally.

The refusal is a property of the snapshot's own file list, enforced by the gate
the deploy runs over that list before its upload stage. Rendered output is flat
by construction today — the render empties its output directory and refuses a
page slug containing a separator (REQ-109) — so no site definition can currently
produce a colliding top-level directory, and the collision is therefore
unreachable through the deploy command itself. The refusal is consequently
stated and proved at the gate's own entry point; it starts earning its keep at
the deploy level the day rendered output gains nesting.

## Verification

Take the file list of a real deploy — the gate's actual input, not a hand-built
shape — and assert the gate passes it. Assert the gate then rejects that same
list plus a top-level entry of the reserved name, both as a directory prefix and
as the bare entry, with a message naming the offending entry, the reserved
segment, and the preview route the entry would be shadowed by. Assert the same
list plus the name nested one level deeper, and plus a top-level entry that
merely shares its prefix, passes. Drive those non-colliding shapes all the way
through a real deploy and assert they are both stored and served. Finally, pin
the reason the collision is unreachable end-to-end: attempt a real deploy of a
nested page slug, assert the render refuses it by name, and assert nothing was
written to the store.