---
uid: report-98fc9539
id: REPORT-4548
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:54:46.975846+00:00'
updated_at: '2026-09-20T20:54:46.975846+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` (REQ-143) — **UU, intent/bookkeeping ticket** (`type: request`). Rule 2e applied per fact.

Incoming commit `8aa14a9061` (2026-08-24T02:10:41Z) changed four facts in the frontmatter:

| Fact | HEAD (resync branch) | Incoming | Resolution |
|---|---|---|---|
| `status` | `free_and_reconciled` | `bundled` | HEAD — later-positioned |
| `completed_at` | `2026-08-31T14:22:42.311331+00:00` | `null` | HEAD — later-positioned |
| `updated_at` | `2026-08-31T14:22:42.311331+00:00` | `2026-08-24T02:10:41.245869+00:00` | HEAD — later-positioned |
| `last_field_updated` | `status` | `status` | identical, no conflict |
| `fields.bundled_in` | `bundle-b3b7c399` | `bundle-b3b7c399` (added) | already present on both sides — merged cleanly, kept |

All four conflicting facts are the same fact changed differently on both sides, so 2e's timeline
rule governs. `xgd working-timeline ecd40fbcbd 8aa14a9061` puts the HEAD-side commit at
`2026-08-31T14:22:42Z` and the incoming commit at `2026-08-24T02:10:41Z` — HEAD is the
later-positioned intent for every one of them. Taking the incoming side would have rolled the
ticket's lifecycle backwards from `free_and_reconciled` to `bundled` and cleared a
`completed_at` that a later commit set.

## Incoming changes preserved

The incoming commit's only substantive, non-lifecycle contribution is
`fields.bundled_in: bundle-b3b7c399`. That line is **already present in HEAD** (verified:
`git show HEAD:.xgd/tickets/hot/request-18a48d63.md` line 44) — a later commit on this ticket's
own timeline already carried it onto the main-rooted branch. It survives in the resolved file.

Nothing from the incoming side was discarded except the three lifecycle scalars that the
later-positioned HEAD intent supersedes by rule 2e. No code or implementation files were in this
conflict; no test function was touched; the BUG-1301 precedence exception was not needed.

## Staging state

`git add --sparse -- .xgd/tickets/hot/request-18a48d63.md` staged the resolution. Because HEAD
already carried both the later lifecycle state and `bundled_in`, the staged tree is byte-identical
to HEAD and `git diff --cached HEAD` is empty. Per STEP 4 this is left for Python's finalize step
to detect and skip — `--skip` was NOT called here, and CHERRY_PICK_HEAD is intact.
