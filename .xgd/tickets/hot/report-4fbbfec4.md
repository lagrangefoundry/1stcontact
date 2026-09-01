---
uid: report-4fbbfec4
id: REPORT-3208
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:48:20.789842+00:00'
updated_at: '2026-09-01T04:48:20.789842+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, sparse-excluded (index-only,
  no working-tree markers). Rule **2e** (intent/bookkeeping ticket: `bug-*`,
  not a matrix-defining spec ticket, so 2d's ledger-replay does not apply).
  Resolved with `git checkout --ours --ignore-skip-worktree-bits` +
  `git add --sparse`.

  Per-fact analysis (base = `5db68a0`, ours = `52bab41`, theirs = `2d6d161`):

  | fact | base | theirs (incoming, free_coded) | ours (HEAD) | resolution |
  |---|---|---|---|---|
  | `fields.commits` | absent | `working_sha: 759cd87…` | **identical** | no conflict |
  | `fields.version` | absent | `0.2.15` | **identical** | no conflict |
  | `fields.story_points` | absent | `3` | **identical** | no conflict |
  | `fields.bundled_in` | absent | absent | `bundle-8eef3846` | ours only — kept |
  | `status` | `free_coding` | `free_coded` | `bundled` | same fact, ours later |
  | `last_field_updated` | `body` | `story_points` | `status` | derived from `status` |
  | `updated_at` | 2026-08-25T23:27:28 | 2026-08-25T23:28:10 | 2026-08-31T05:05:09 | ours later |
  | EOF newline | present | stripped | present | ours (cosmetic) |

  Ours is a **strict superset** of theirs: `git diff theirs ours` shows only
  additions/advances, no incoming content dropped. `status` is the single
  genuinely-competing fact, and it is not a divergence of intent but a
  lifecycle advance along the same track — `free_coded` → `bundled` — with
  ours carrying the later `updated_at` (2026-08-31 vs 2026-08-25). This
  matches the enrichment block's stated rule ("take the more recent commit by
  timestamp") and 2e's superset rule, which agree here.

  Body sections below the frontmatter are byte-identical on both sides apart
  from the trailing-newline difference.

## Incoming changes preserved

Confirmed. Every field the incoming commit (`148b2c2`, "Merge branch
'free-BUG-39' into xgd-working") added to this ticket is present verbatim in
the resolved version: `fields.commits` (same `working_sha`
`759cd87405a4b50f81995b2c9b510bf23be54fbd`, `reconcile_sha: null`,
`main_sha: null`), `fields.version: 0.2.15`, and `fields.story_points: 3`.
Nothing was discarded.

The staged diff vs HEAD is therefore **empty** — HEAD had already reached and
passed the incoming commit's state for this ticket. This is the
redundant-commit case (STEP 4 / BUG-1109 / BUG-1122), not the discarded case:
STEP 3's discriminator is whether the incoming commit's key changes are
*present in HEAD* (redundant) or *simply absent* (discarded), and here all
three are present and byte-identical. Per STEP 4 I did not call
`--skip`; the finalize step will detect the clean staged diff.

No code/implementation files, no UAT test files, and no spec tickets were in
this conflict set, so 2c/2f/2d did not apply and no BUG-1301 precedence
exception was invoked.

## Post-resolution state

- `git status --porcelain`: no UU/AA/DU/UD/AU/UA lines remain.
- Index entry at stage 0: `52bab41feef14c15dce46fe47aac7b19ab0f59e8`.
- `CHERRY_PICK_HEAD` intact at `148b2c20715aca83e3f414f61e6b07e84b6c7258` —
  no `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
