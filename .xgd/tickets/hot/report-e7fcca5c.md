---
uid: report-e7fcca5c
id: REPORT-4413
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:02:43.177985+00:00'
updated_at: '2026-09-19T12:02:43.177985+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, index-only (path is outside the sparse-checkout cone, so there were no working-tree conflict markers; resolved via `git checkout --ours` + `git add --sparse`). Rule **2e** (intent/bookkeeping ticket, `request-*`): *one side is a strict superset of the other — keep the superset*. Kept **ours**.

  Enrichment metadata:
  - ours: `xgd(ticket): seed_local_overlay request request-bbff35c7`
  - theirs (incoming free_coded, `580518e48a`): `xgd(ticket): update request request-bbff35c7`

  Three-way blob comparison (base `64d8cce6`, ours `c1046591`, theirs `22ce0c14`):

  | fact | base | theirs (incoming) | ours (kept) |
  |---|---|---|---|
  | `status` | `draft` | `free_coded` | `bundled` |
  | `last_field_updated` | `body` | `status` | `status` |
  | `fields.commits` | absent | `e9bd703b`, `751b0706` | **identical** `e9bd703b`, `751b0706` |
  | `fields.version` | absent | `0.2.34` | **identical** `0.2.34` |
  | `fields.bundled_in` | absent | absent | `bundle-8e1807f6` |
  | `completed_at` | `null` | `null` | `2026-09-14T10:29:11Z` |
  | `updated_at` | `2026-09-01T19:54:48Z` | `2026-09-01T19:56:43Z` | `2026-09-16T01:48:40Z` |
  | body (markdown) | — | **byte-identical to ours** | **byte-identical to theirs** |

  The full `ours..theirs` delta is 26 lines, entirely frontmatter; the ticket body is unchanged on both sides, so there is no per-fact content conflict to compose. Every field the incoming side introduces is already present in ours with the same value; ours additionally carries the later lifecycle state. Taking theirs would have reverted the ticket from `bundled` to `free_coded`, dropped `bundled_in: bundle-8e1807f6`, and cleared `completed_at` — a regression of this very bundle's own bookkeeping.

## Incoming changes preserved

Confirmed. `git show 580518e48a -- .xgd/tickets/hot/request-bbff35c7.md` is the `draft` → `free_coded` status advance plus the addition of `fields.commits` (`e9bd703b`, `751b0706`) and `fields.version: 0.2.34`. All three are present in the staged resolution:

- `fields.commits` — present, byte-identical to the incoming side.
- `fields.version: 0.2.34` — present, identical.
- status advance — present and carried further: HEAD already moved the ticket past `free_coded` to `bundled` and stamped `bundled_in: bundle-8e1807f6` / `completed_at`.

No hunk was dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict.

Note for the finalize step: the staged tree is identical to HEAD (`git status --porcelain` is empty, `:0:` blob = ours blob `c1046591`), so this cherry-pick nets to no diff. Per STEP 4 this is the *redundant-commit* case, not the discarded case — STEP 3's discriminator confirms it: the incoming commit's key changes are present in HEAD (via the later `seed_local_overlay`/bundle commits that already recorded the same commits list and version), not absent. `--skip` was not called; `CHERRY_PICK_HEAD` (`580518e48a`) is left intact for `cherry_pick_finalize_resolution`.
