---
uid: report-74f1a9cd
id: REPORT-3437
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:55:33.139128+00:00'
updated_at: '2026-09-04T00:55:33.139128+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, index-only conflict (path is
  outside the sparse-checkout cone, so no working-tree markers existed).
  Rule **2e** (intent/bookkeeping ticket, per-fact resolution). Resolved by
  taking the HEAD side, which is a strict per-fact superset of the incoming
  side. Staged with `git checkout --ours` + `git add --sparse`.

Sides:
- Ours (HEAD): `9b2789728d xgd(ticket): seed_local_overlay request request-78370159`
- Theirs (incoming, `139c79dec2`): `xgd(ticket): update request request-78370159`

The markdown body is byte-identical on both sides (including the missing
trailing newline). The entire conflict is in the YAML frontmatter. Per-fact:

| fact | base | ours (HEAD) | theirs (incoming) | taken |
|---|---|---|---|---|
| `updated_at` | 2026-09-01T00:47:45 | 2026-09-02T17:48:27 | 2026-09-01T00:53:57 | **ours** — later |
| `last_field_updated` | `body` | `status` | `status` | identical, no conflict |
| `status` | `free_coding` | `bundled` | `free_coded` | **ours** — later lifecycle position |
| `fields.story_points` | 8 | 13 | 8 | **ours** — only ours edited it; theirs is unchanged from base, so not a competing fact |
| `fields.commits[]` (2 working_sha entries) | absent | present | present | identical on both sides, no conflict |
| `fields.version: 0.2.26` | absent | present | present | identical on both sides, no conflict |
| `fields.bundled_in: bundle-203b1dc2` | absent | present | absent | **ours** — added only on our side |

No timeline tiebreak was needed for a genuinely competing fact: the only field
where the two sides assert different values for something *both* changed is
`status`, and there the two values are successive positions on the same
lifecycle (`free_coding` → `free_coded` → `bundled`), not rival claims. Taking
theirs would have reverted the bundle's own `bundled` bookkeeping and dropped
`bundled_in`.

## Incoming changes preserved

Every change the incoming commit made to this file is present in the resolved
version:

- `fields.commits` list with both entries (`855dd57a7c76…`, `482a1f984651…`,
  each with `reconcile_sha: null` / `main_sha: null`) — present, byte-identical.
- `fields.version: 0.2.26` — present, byte-identical.
- `last_field_updated: status` — present, byte-identical.
- Trailing-newline removal at EOF — present, byte-identical.
- `status` advanced off `free_coding` — present. Incoming set `free_coded`;
  HEAD carries `bundled`, which is downstream of `free_coded` on the same
  lifecycle, so the incoming intent (mark the free-code work complete) is
  preserved via the later state rather than discarded.
- `updated_at` bump — present as HEAD's later timestamp (2026-09-02T17:48:27,
  which supersedes the incoming 2026-09-01T00:53:57).

The incoming commit touched only this one file (`git show 139c79dec2 --stat`:
1 file changed, 12 insertions, 4 deletions), so there are no code or test files
in this cherry-pick and no BUG-1301 precedence drops to report.

## Note on the empty staged diff

`git diff --cached --stat HEAD` is empty: the resolution nets to no change vs
HEAD. This is the redundant-commit case (BUG-1109/BUG-1122), not a discard —
STEP 3's distinguishing check passes, because the incoming commit's key changes
are *present* in HEAD (the `commits` list, `version`, `last_field_updated`, and
a `status` at or past `free_coded`), having arrived via HEAD's own later
`seed_local_overlay` commit. Per STEP 4 no `--skip` was issued; the tree is
staged and `CHERRY_PICK_HEAD` is left intact for
`cherry_pick_finalize_resolution` to detect the clean diff and skip the commit.
