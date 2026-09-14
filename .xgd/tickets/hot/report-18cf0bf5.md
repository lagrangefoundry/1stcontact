---
uid: report-18cf0bf5
id: REPORT-4216
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:45:35.572397+00:00'
updated_at: '2026-09-14T03:45:35.572397+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — UU (index-only; sparse-excluded, no working-tree markers), intent/bookkeeping ticket → rule 2e. Ours is a strict superset of theirs, so ours taken (`git checkout --ours --ignore-skip-worktree-bits`, `git add --sparse`).

  - Ours side: `xgd(ticket): seed_local_overlay request request-51514090`, `updated_at 2026-09-11T18:53:54Z`, `status: bundled`.
  - Theirs (incoming, `02673c14`): `xgd(ticket): update request request-51514090`, `updated_at 2026-09-01T21:53:59Z`, `status: draft`.
  - Per-fact outcome: the body sections added by the incoming commit are already present verbatim in HEAD (the seeded overlay carries them). The only facts that differ are `updated_at` / `last_field_updated` / `status`, plus the bundle bookkeeping (`fields.commits`, `fields.version`, `fields.bundled_in`) and an extra trailing section (`## One honest caveat about "the last native dependency"`) that exists only on ours. Ours is the later-positioned side on every differing fact and adds content theirs never had, so taking ours loses nothing from either side.

## Incoming changes preserved

The incoming commit's only change to this file is a 70-line body append plus an
`updated_at` bump. All four appended sections — "What the codec must do,
precisely", "Sequencing, revisited: AC5 is not deliverable yet", "A finding AC4
turned up", and the bullet paragraphs under the first heading — are present
byte-identically in the resolved (ours) version; verified by diffing stage 3
against stage 2, whose only hunks are the frontmatter/bookkeeping differences
and ours' extra trailing section. The `updated_at` value from the incoming side
is superseded by the strictly later ours-side value, which is the correct
per-fact outcome under 2e.

No hunks were dropped under the BUG-1301 precedence exception; none applied.

Note: the resolution stages to no diff vs HEAD. This is the redundant-commit
case, not a discard — STEP 3's check passes because the incoming commit's
content is present in HEAD via the seeded local overlay. Per STEP 4, `--skip`
was not called; the finalize step will detect the empty staged diff.
