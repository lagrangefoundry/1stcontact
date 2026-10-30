---
uid: report-d18dffd3
id: REPORT-5403
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T23:04:43.361253+00:00'
updated_at: '2026-09-28T23:04:43.361253+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping
  ticket (§2e). The path is outside the sparse-checkout cone
  (`.xgd/tickets/` is excluded on this resync branch), so the conflict
  existed only in the index with no working-tree markers; resolved by
  writing the ours-side blob to stage 0 via `git update-index
  --index-info` and restoring the `skip-worktree` bit that the other
  ticket entries carry.

  Both sides are `xgd(ticket): update request request-78370159`.
  Comparing the three stages:
  - **Theirs** (`4207df5246`, incoming): bumps `updated_at` to
    `2026-09-01T00:47:45`, and rewrites the blob-addressing bullet to
    cover `[[REQ-163]]` *and* `[[REQ-162]]` with the expanded
    "`sha256` is an integrity field now rather than the address"
    wording.
  - **Ours** (HEAD): contains that *same* body rewrite byte-for-byte,
    plus strictly later metadata — `updated_at`
    `2026-09-09T21:32:50`, `status: free_coding → bundled`,
    `last_field_updated: status`, `story_points: 8 → 13`, and new
    `commits` / `version: 0.2.26` / `bundled_in: bundle-87be4669`
    fields.

  Per-fact resolution: the only real content change theirs carries is
  already present in ours, so there is no competing fact on the body.
  On the metadata facts (`updated_at`, `last_field_updated`, `status`)
  ours is the later-positioned intent, and rolling those back would
  un-bundle the ticket. Ours taken wholesale.

  Net effect: the staged tree is identical to HEAD for this path
  (`git diff --cached HEAD` is empty), so this cherry-pick is a no-op.
  Per the instructions I did not call `--skip`; finalize will detect
  the empty staged diff.

## Incoming changes preserved

- `.xgd/tickets/hot/request-78370159.md` — verified against
  `git show 4207df5246 -- <path>`. The incoming body rewrite is
  present in the staged blob: line 238 carries the
  `[[REQ-163]]'s and [[REQ-162]]'s blob-addressing criteria` heading,
  line 244 the `sha256 is an integrity field now rather than the
  address` clause, and line 251 the trailing `[[REQ-162]]` reference.
  The incoming `updated_at` value (`2026-09-01T00:47:45`) is
  intentionally not preserved — it is superseded by the later
  `2026-09-09T21:32:50` on the HEAD side, which is a metadata fact,
  not developer content.

No hunks were dropped under the BUG-1301 precedence exception; no
code or test files were involved in this conflict.
