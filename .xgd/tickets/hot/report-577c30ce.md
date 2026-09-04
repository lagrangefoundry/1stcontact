---
uid: report-577c30ce
id: REPORT-3433
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:48:11.506228+00:00'
updated_at: '2026-09-04T00:48:11.506228+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — UU, out-of-cone (no working-tree
  file; the conflict exists only in the index, resolved via
  `git checkout --ours` + `git add --sparse`). Class 2e
  (intent/bookkeeping ticket) plus the auto-enrichment rule for this file
  ("Intent unknown on one or both sides. Take the more recent commit by
  timestamp"). Resolved to **ours**.

  - Base (stage 1): `12c843b5` — the blob written by the previous cherry-pick
    attempt's commit `14fab3a5`.
  - Ours (stage 2): `ccbacba4`, from `0ee399ee`
    `xgd(ticket): seed_local_overlay request request-6893f6ea`,
    2026-09-02 10:50:05 -0700.
  - Theirs (stage 3): `b6655afd`, from `CHERRY_PICK_HEAD` `b5230a96`
    `xgd(ticket): update request request-6893f6ea`, 2026-08-31 17:36:01 -0700.

This is the same file resolved at scope 198/0, one commit later in the
incoming series. The incoming commit is **frontmatter-only** — 3 insertions,
4 deletions, no body change:

| fact | theirs (`b5230a96`) | ours (`0ee399ee`) | kept |
|---|---|---|---|
| `updated_at` | 2026-09-01T00:36:01 | 2026-09-02T17:48:27 | ours (later) |
| `last_field_updated` | `status` | `status` | identical |
| `status` | `draft` → `free_coding` | `bundled` | ours (see below) |
| blank line after `---` | removed | already absent | equivalent |

Ours is the later commit on every contested fact, and `bundled` is downstream
of `free_coding` in the ticket lifecycle, not a competing value: ours also
carries `fields.commits[0].working_sha = 27450010586c65b293b2ad5cc6243815133a17be`,
`fields.version: 0.2.27` and `fields.bundled_in: bundle-203b1dc2`, which are
written by the free-coding/bundling flow itself. Taking theirs would have
rewound an operator-advanced status to an earlier state and dropped the
bundling fields.

## Incoming changes preserved

No code/implementation files were involved. Per-fact accounting for the
incoming commit:

- **Blank line after the frontmatter fence** — the incoming commit removes the
  stray blank line it had itself added in `14fab3a5`. Ours already has no
  blank line there, so this change is present in the resolved version.
- **`status: draft` → `free_coding`** — present in HEAD via a later route
  rather than absent. The ticket has already transited free-coding and moved
  on to `bundled`; the working-side commit SHA that the free-coding step
  recorded is in ours' `fields.commits`. This is a superseded lifecycle
  advance, not a discarded edit.
- **`updated_at` / `last_field_updated`** — bookkeeping scalars; ours carries
  the later timestamp and the same `last_field_updated: status`.
- **Body** — unchanged by this incoming commit. Ours' body remains the later
  revision verified at scope 198/0, which contains every section the
  `14fab3a5` content edit added.

No BUG-1301 precedence drops were needed.

**Net staged diff vs HEAD is empty.** This is the redundant case described in
STEP 4 (BUG-1109/BUG-1122), not the discarded case in STEP 3: the incoming
commit's only changes are a lifecycle advance HEAD has already moved past and
a whitespace fix HEAD already has. `--skip` was not called; the tree is
staged, conflict-free (`git ls-files -u` empty), and `CHERRY_PICK_HEAD` is
intact for `cherry_pick_finalize_resolution`.

Flagged for post-merge review per the enrichment rule for this file.
