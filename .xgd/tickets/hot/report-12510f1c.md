---
uid: report-12510f1c
id: REPORT-3436
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:53:15.513597+00:00'
updated_at: '2026-09-04T00:53:15.513597+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **AA (both added)**, intent/bookkeeping
  ticket (rule 2e; enrichment rule "more recent commit by timestamp" agrees).
  Resolved to the **ours/HEAD** side via `git checkout --ours` + `git add --sparse`
  (path is outside the sparse-checkout cone, so the conflict existed only in the
  index with no working-tree markers).

  Basis: the two sides' Markdown bodies are **byte-identical**. The only
  differences are lifecycle frontmatter, where HEAD is a strict superset:

  | field | incoming (`create`, 2026-09-01T00:50:39Z) | ours (`seed_local_overlay`, 2026-09-02T17:48:27Z) |
  |---|---|---|
  | `status` | `draft` | `bundled` |
  | `last_field_updated` | `created_at` | `status` |
  | `fields.chat_comment` | absent | `comment-6477139e` |
  | `fields.commits` | absent | 2 working_sha entries |
  | `fields.version` | absent | `0.2.29` |
  | `fields.bundled_in` | absent | `bundle-203b1dc2` |

  Ours is both the later-positioned side and the superset, so the two applicable
  2e clauses converge. Taking the incoming side would have reverted the ticket's
  operator-set status to `draft` and dropped the bundle bookkeeping that names
  this very reconcile bundle (`bundled_in: bundle-203b1dc2`). No fields were
  merged by hand and no content was invented; the resolution is exactly the
  HEAD blob.

  One cosmetic note, recorded rather than acted on: HEAD's version carries a
  trailing `\n\n-` with no final newline that the incoming version lacks. It is
  pre-existing HEAD state from the overlay seed, not a conflict artifact, so it
  was left untouched — stripping it would have smuggled an unrelated cleanup
  into this cherry-pick.

## Incoming changes preserved

Incoming commit `76b69e1a7d5caf55c09e6189f4dc1b5e6f8ef74d`
(`xgd(ticket): create request request-3bc4b835`) is a single-file, 163-line
file creation. Its entire payload — the full ticket body (the gap statement,
migration `0004_identity.sql` DDL, the no-CHECK-constraint rationale, the
opaque-account-id rule, the invite-provisions / login-binds split, the
expiry-must-expire UAT requirements, and the out-of-scope section) plus the
`uid`/`id`/`type`/`title`/`created_by`/`created_at` and
`priority`/`story_points`/`auto_merge_back`/`needs_review` frontmatter — is
present verbatim in the resolved file. `git diff <incoming-blob> <ours-blob>`
shows **no deletions of any body line**; every hunk is a frontmatter
advancement on the ours side.

No code/implementation files were involved in this conflict, and no hunk was
dropped under the BUG-1301 precedence exception.

## Staging state

`git status --porcelain` reports no conflict-class lines. The staged tree is
identical to HEAD (`git diff --cached --stat HEAD` is empty) because the
incoming ticket content already reached this branch through the later overlay
seed — the redundant-commit case of BUG-1109/BUG-1122, not a discard. STEP 3's
distinguishing test passes: the incoming commit's key changes are *present* in
HEAD rather than absent. Per STEP 4, `--skip` was not called; the cherry-pick
sequencer state (`CHERRY_PICK_HEAD` = `76b69e1a...`, HEAD = `4a5ef935b5`) is
left intact for `cherry_pick_finalize_resolution` to detect the clean staged
diff and skip the commit.
