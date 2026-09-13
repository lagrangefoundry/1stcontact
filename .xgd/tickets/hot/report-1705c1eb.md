---
uid: report-1705c1eb
id: REPORT-4165
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:55:14.226217+00:00'
updated_at: '2026-09-13T22:55:14.226217+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — UU, intent/bookkeeping ticket
  (STEP 2e). Resolved by taking **ours** (`git checkout --ours` +
  `git add --sparse`; the path is outside the sparse-checkout cone, so the
  conflict existed only in the index with no working-tree markers).

  Rule applied: 2e "one side is a strict superset — keep the superset."
  Per-fact comparison of the two stages:

  | Fact | Ours (HEAD, `seed_local_overlay`) | Theirs (f034eeee18, `update`) |
  |---|---|---|
  | body / "What landed" section | present | present — **byte-identical** |
  | `updated_at` | 2026-09-09T21:32:49Z | 2026-09-01T18:31:05Z |
  | `last_field_updated` | `status` | `body` |
  | `status` | `bundled` | `free_coding` |
  | `fields.commits` (3 working_sha) | present | absent |
  | `fields.version` (0.2.31) | present | absent |
  | `fields.bundled_in` (bundle-87be4669) | present | absent |

  No fact is changed differently on both sides, so the timeline rule was not
  needed per-fact. Ours is newer on every field that differs and carries three
  fields theirs never had. Taking theirs would have reverted the ticket from
  `bundled` back to `free_coding` and dropped its bundle bookkeeping — a
  regression of state the overlay recorded eight days after the incoming
  commit was authored.

  The enrichment metadata's fallback rule ("intent unknown on one or both
  sides — take the more recent commit by timestamp") points the same way:
  ours is the more recent side. Flagging for post-merge review as that rule
  directs, though the per-fact comparison above leaves little ambiguity.

## Incoming changes preserved

Confirmed. The incoming commit's substantive change is a 72-line body
addition (the `## What landed` section plus `## Open questions`), and it is
present verbatim in the resolved file at lines 103-177. `git diff :2:<path>
:3:<path>` shows the two sides differ **only** in the frontmatter fields
tabulated above and in a trailing newline; the entire body is identical.

No hunk was dropped under the BUG-1301 precedence exception — it did not
apply here.

## Note for finalize

The staged diff is empty (`git diff --cached --stat` returns nothing) because
HEAD's seeded overlay already carries this commit's body change. This is the
redundant case of BUG-1109/BUG-1122, not a discard: STEP 3's check confirms
the incoming commit's key changes are present in HEAD via the overlay, rather
than absent. Per STEP 4 no `--skip` was issued; the cherry-pick sequencer
state is intact (`CHERRY_PICK_HEAD` = f034eeee18172b33f1d11fdcf3ccbc0553a44a52)
for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip
the commit.
