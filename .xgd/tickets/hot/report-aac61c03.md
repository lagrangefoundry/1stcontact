---
uid: report-aac61c03
id: REPORT-3311
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:37:33.392286+00:00'
updated_at: '2026-09-02T18:37:33.392286+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — class **AA** (both added), intent/bookkeeping
  ticket → rule **2e**. Resolved per-fact in favour of HEAD via
  `git checkout --ours` + `git add --sparse` (byte-exact HEAD blob, no hand-editing of
  YAML frontmatter).

  The incoming commit presents as a whole-file add only because resync `0d11a014`
  stripped `.xgd/tickets` from the main snapshot (BUG-904); it is an update, not a
  creation. The 303-line body is **byte-identical on both sides** — the entire
  conflict is confined to frontmatter.

  Per-fact resolution:

  | Fact | HEAD (`decf67f5`, 2026-08-31) | Incoming (`773e1698`, 2026-08-23) | Taken | Why |
  |---|---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | HEAD | Same field, differing values → later-positioned side. Also lifecycle-monotonic: `free_and_reconciled` is downstream of `ready_to_reconcile`; taking incoming would silently revert a completed reconcile. |
  | `updated_at` | `2026-08-31T14:22:36` | `2026-08-20T00:47:43` | HEAD | Later. |
  | `completed_at` | `2026-08-31T14:22:36` | `null` | HEAD | Later; paired with the status above. |
  | `fields.commits` | 1 entry (`a28d2f52`, history `[ade64575a, 055378794, a6e92ca26]`) | 2 entries (`a28d2f52` history `[ade64575a, a6e92ca26]`; `055378794` history `[]`) | HEAD | SHA sets are **identical** on both sides. HEAD folds `055378794` into `working_sha_history`; its `reconcile_sha`/`main_sha` were both `null`, so the fold is non-lossy. |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | HEAD | Field present on one side only → non-overlapping, keep it. |

  No field was invented, and no `intent_uid`/`story_uid`/`capability_uid` was touched.

## Incoming changes preserved

Diffing the incoming commit against its own working-branch predecessor
(`1e5306b1` → `773e1698`) isolates its actual intent to exactly two facts:

1. Advance the first commit entry's `working_sha` from `a6e92ca26` to
   `a28d2f52`, pushing `a6e92ca26` down into `working_sha_history`.
2. Add `fields.chat_comment: comment-a4605dbc`.

**Both are present verbatim in the resolved file.** HEAD carries
`working_sha: a28d2f522f0e5f06629ca9084ac14349b988ed85` with `a6e92ca26` in its
`working_sha_history`, and carries `chat_comment: comment-a4605dbc`. HEAD's state
is a strict superset: it holds both incoming facts and has advanced past them.

Nothing was discarded. No hunk was dropped, so the BUG-1301 precedence exception
does not apply here.

**Nets to no diff vs HEAD.** `git diff --cached HEAD` is empty — the incoming
commit is genuinely redundant, its effect having already reached this branch by an
earlier route rather than having been overwritten. This is the BUG-1109/BUG-1122
case, distinguished from a discard by the STEP 3 check above (incoming's key facts
are *present* in HEAD, not merely absent from my resolution). Per STEP 4 I did not
call `--skip`; the tree is staged and `CHERRY_PICK_HEAD` (`773e1698`) is left
intact for `cherry_pick_finalize_resolution`.

## Flagged for post-merge review

The auto-enrichment classified intent as unknown on one or both sides and asked
that this file be flagged. Two observations for the reviewer, neither actioned
here:

- HEAD records `bundled_in: bundle-b3b7c399`, while this reconcile run is
  `bundle-203b1dc2`. That is a pre-existing HEAD-side fact; altering it would be
  inventing content not on either side, so it was left as-is.
- The ticket is already `free_and_reconciled` with `completed_at` set, yet a
  `free_coded` commit for it was still queued in this bundle — consistent with the
  redundancy noted above.
