---
uid: report-b31e6e6e
id: REPORT-4385
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:37:18.184335+00:00'
updated_at: '2026-09-19T10:37:18.184335+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (strict-superset branch). Resolved to the **ours**
  (HEAD) blob `139d3468`, byte-exact — confirmed with `git hash-object` against
  the stage-2 SHA, including the absent final newline.

### Why ours, per fact

The incoming commit is `f034eeee` *"xgd(ticket): update request request-26dafd83"*
(2026-09-01T18:31Z), a body edit on top of base `6ec1ac7a`. HEAD's side is
`139d3468` (`updated_at` 2026-09-09T21:32Z), which is base + that same body edit
+ a later status advance.

`git diff <theirs> <ours>` shows the **entire body is identical** between the two
sides — the only body-region difference is a trailing newline theirs adds and
ours (like base, and like the ticket store's own output format) omits. That is
ambient formatting drift, not developer intent, so ours was kept byte-exact.

Every remaining difference is frontmatter where ours is the strictly later and
strictly larger state:

| Fact | Theirs (incoming) | Ours (HEAD) | Kept |
|---|---|---|---|
| `updated_at` | 2026-09-01T18:31:05Z | 2026-09-09T21:32:49Z | ours (later) |
| `status` | `free_coding` | `bundled` | ours (lifecycle advance; taking theirs would demote it) |
| `last_field_updated` | `body` | `status` | ours (consistent with the status advance) |
| `fields.commits` (3 entries) | absent | present | ours (theirs never touched this field) |
| `fields.version: 0.2.31` | absent | present | ours (theirs never touched this field) |
| `fields.bundled_in: bundle-87be4669` | absent | present | ours (theirs never touched this field) |

No field is present on the incoming side and missing from the resolution. No
content was invented; no `intent_uid`/`story_uid`/`capability_uid` was touched.

## Incoming changes preserved

Incoming commit `f034eeee` made exactly two changes to this file, and **both are
already present verbatim in HEAD**:

1. **Added the `## What landed` section** (the projector narrative, the three
   `REF-*` projections, and the `### Consequences that had to be decided`
   bullets) — present in the resolved file, character-identical to the incoming
   version.
2. **Removed the `**Granularity**` bullet from `## Open questions`** (answered by
   the new body text) — already removed in the resolved file; `## Open questions`
   carries only the awareness-map bullet.

So nothing was discarded. The incoming body edit reached HEAD ahead of this
cherry-pick through the working→reconcile sync, and this commit is therefore
**redundant, not discarded** — the STEP 3 distinction: the incoming commit's key
changes are present in HEAD via a different route, rather than absent.

Consequently `git diff --cached HEAD` is empty. Per STEP 4 that is expected and
is not a failure; `--skip`/`--continue`/`--abort` were **not** called and
`CHERRY_PICK_HEAD` (`f034eeee`) remains in place for
`cherry_pick_finalize_resolution`, which will detect the clean staged diff and
skip the commit.

No BUG-1301 precedence exception was used. No test function was deleted (no test
files were in conflict).
