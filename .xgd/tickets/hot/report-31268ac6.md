---
uid: report-31268ac6
id: REPORT-3438
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:56:53.470092+00:00'
updated_at: '2026-09-04T00:56:53.470092+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, index-only conflict (the path
  is outside the sparse-checkout cone, so no working-tree markers existed).
  Rule **2e** (intent/bookkeeping ticket, per-fact resolution). Resolved by
  taking the HEAD side. Staged with `git checkout --ours` +
  `git add --sparse`.

Sides:
- Ours (HEAD): `eaff760406` tip; ticket last written by
  `xgd(ticket): seed_local_overlay request request-78370159`
- Theirs (incoming, `60e4959eb7`): `xgd(ticket): update request request-78370159`
  (Mon Aug 31 17:54:01 2026)

This is the immediate successor of the commit resolved in the previous attempt
(`139c79dec2`, 17:53:57). Its whole payload is a `story_points` bump. The
markdown body is byte-identical on all three stages — the entire conflict is in
the YAML frontmatter. Per-fact:

| fact | base | ours (HEAD) | theirs (incoming) | taken |
|---|---|---|---|---|
| `fields.story_points` | 8 | 13 | 13 | **both sides agree** — this is the incoming commit's actual payload and it is already in HEAD; not a conflict |
| `updated_at` | 2026-09-01T00:53:57 | 2026-09-02T17:48:27 | 2026-09-01T00:54:01 | **ours** — later |
| `last_field_updated` | `status` | `status` | `story_points` | **ours** — a trailing marker of which field was written last; ours' `status` write (09-02) postdates theirs' `story_points` write (09-01) |
| `status` | `free_coded` | `bundled` | `free_coded` | **ours** — later position on the same lifecycle |
| `fields.bundled_in` | absent | `bundle-203b1dc2` | absent | **ours** — added only on our side |
| body (296 lines) | — | — | — | identical on all stages |

No `xgd working-timeline` tiebreak was needed: the only substantive field
(`story_points`) is *identical* on both sides, and every remaining difference is
bookkeeping where ours is strictly later-timestamped and a strict superset
(`bundled_in` exists only on our side). Taking theirs would have reverted the
bundle's own `bundled` status and dropped `bundled_in` while changing nothing
about the developer's actual edit.

## Incoming changes preserved

The incoming commit made exactly three frontmatter changes; all are accounted
for in the resolved version:

- `fields.story_points: 8 → 13` — **present**. HEAD carries `story_points: 13`
  (verified at line 15 of the HEAD blob). This is the commit's substantive
  intent and it survives intact.
- `updated_at` bump to `2026-09-01T00:54:01` — superseded by HEAD's strictly
  later `2026-09-02T17:48:27`.
- `last_field_updated: status → story_points` — superseded by HEAD's later
  `status` write. This field records only which field was most recently
  touched; HEAD's value is correct for HEAD's own later edit.

The incoming commit touched only this one file (`git show 60e4959eb7 --stat`:
1 file changed, 3 insertions, 3 deletions), so there are no code or test files
in this cherry-pick and no BUG-1301 precedence drops to report.

## Note on the empty staged diff

`git diff --cached --stat HEAD` is empty: the resolution nets to no change vs
HEAD. This is the redundant-commit case (BUG-1109/BUG-1122), not a discard, and
STEP 3's distinguishing check passes cleanly — the incoming commit's key change
(`story_points: 13`) is *present* in HEAD, having arrived via HEAD's own later
`seed_local_overlay` commit, rather than being absent. Per STEP 4 no `--skip`
was issued; the tree is staged and `CHERRY_PICK_HEAD` is left intact for
`cherry_pick_finalize_resolution` to detect the clean diff and skip the commit.
