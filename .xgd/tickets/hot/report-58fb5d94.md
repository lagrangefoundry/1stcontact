---
uid: report-58fb5d94
id: REPORT-4146
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:54:38.311805+00:00'
updated_at: '2026-09-13T21:54:38.311805+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **AA (both added)**, intent/bookkeeping
  ticket (REQ-162, a `request`). Rule 2e + 2b: ours is a strict superset of
  theirs, so the superset was kept (`git checkout --ours
  --ignore-skip-worktree-bits`, then `git add --sparse` — the path is outside
  the sparse-checkout cone per DOC-986 §2/§4.1, so the conflict existed only in
  the index with no working-tree markers).

  The AA class is a seeded-overlay artifact, not a genuine both-added race. The
  bundle branch was seeded by `8b5aa7c1ec xgd(ticket): seed_local_overlay request
  request-13a5e206`, which imported the ticket's *final* state from xgd-working;
  the bundle then cherry-picks the chronologically *earlier*
  `c2c4b393c8 xgd(ticket): create request request-13a5e206`. Git finds no merge
  base for the path and reports AA rather than UU.

  Evidence for the superset relationship:
  - `git log -- <path>` on the HEAD side shows `seed_local_overlay` followed by
    ~240 `xgd(ticket): update` commits and **no create commit** — the create
    being applied is the ancestor of ours, reached via the overlay.
  - Immutable fields are byte-identical on both sides: `uid`, `id`, `title`,
    `created_at` (`2026-08-31T20:32:40.203324+00:00`).
  - theirs: `status: draft`, `updated_at == created_at`, `last_field_updated:
    created_at`, four `fields`. ours: `status: free_and_reconciled`,
    `updated_at 2026-09-02T01:34:36`, `completed_at` set, `result: pass`, plus
    `chat_comment`, `commits`, `version`, `orphan_commits`, `merged_at_commit`.

  This also matches the enrichment block's own rule ("take the more recent commit
  by timestamp"): ours is the `update` of 2026-09-02, theirs the `create` of
  2026-08-31.

## Incoming changes preserved

Yes — present in HEAD via the overlay route, not discarded.

`git diff :3: :2:` removes 13 lines. Four are the frontmatter fields superseded
above (`updated_at`, `completed_at`, `last_field_updated`, `status`). The other
nine are prose, and each is the developer's own later edit to their own create,
already integrated into HEAD through the update chain:

- `**3. The TypePack**, carrying:` → renumbered to `**4. The TypePack**` after a
  new deliverable ("**3.** The blob store, in its own bucket", `1stcontact-material`)
  was inserted ahead of it.
- The `**1. The schema.**` paragraph → expanded in place, naming the migration
  `0003_ticket_store.sql` and adding the `ALTER TABLE tenants ADD COLUMN config`
  rationale.
- `## Open questions` and two of its bullets → replaced by
  `## Both open questions are now settled`.

Nothing from the incoming create is absent from the resolved file except text its
own author subsequently rewrote. Every section of theirs is present in ours in
its evolved form, so taking ours discards no developer content.

The staged result is therefore an empty diff vs HEAD — **redundant, not
discarded** (STEP 3's distinction; BUG-1109/BUG-1122). Per STEP 4 I did not call
`--skip`; `CHERRY_PICK_HEAD` is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff.

No code files, no UAT test files, and no spec tickets were involved, so the
BUG-1301 precedence exception is not in play — no hunk was dropped under it.
