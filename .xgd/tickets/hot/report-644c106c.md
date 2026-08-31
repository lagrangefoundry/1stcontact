---
uid: report-644c106c
id: REPORT-3095
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:53:02.085394+00:00'
updated_at: '2026-08-31T21:53:02.085394+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/chat-8c8e0f89.md` — class **AA** (both added, no merge base;
  index had stages 2 and 3 only). Bookkeeping/chat ticket, so rules **2b** (AA,
  one side a strict superset) and **2e** (intent/bookkeeping ticket, superset
  wins) both point the same way. Resolved by taking the INCOMING version whole:
  `git checkout --theirs` then `git add --sparse` (path is under `.xgd/tickets/`,
  outside the sparse-checkout cone per DOC-986 §2/§4.1).

  The two sides differ in exactly one fact. Frontmatter is byte-identical on both
  sides for `uid`, `id`, `type`, `title`, `created_by`, `created_at`,
  `updated_at`, `completed_at`, `last_field_updated`, `status`, and the body is
  identical (`<!-- xgd-chat-end -->`). The only divergence:

  - ours (HEAD): `fields: {}`
  - theirs (incoming `b8f42a016d4b58d8aa2ea75605b4c38302182f02`):
    `fields:\n  chat_comment: comment-48483d87`

  Incoming is therefore a strict superset — it adds a field HEAD never touched
  and changes no fact HEAD asserts. No per-fact timeline arbitration was needed
  (no fact is set differently on the two sides), so the enrichment note's
  "take the more recent commit by timestamp" fallback was not the operative
  rule; superset precedence resolved it without discarding anything from either
  side. Nothing was invented that is not present on the incoming side.

  Referent check: `comment-48483d87` does not exist in the incoming commit's
  tree, but it IS tracked on the HEAD side (`git ls-files --sparse` lists
  `.xgd/tickets/hot/comment-48483d87.md`; it is merely not materialized in the
  working tree because of sparse checkout). The `chat_comment` pointer therefore
  resolves correctly in the merged tree.

## Incoming changes preserved

Confirmed. The incoming commit `b8f42a01` adds this file in full (16
insertions, its only path — `git show --stat` shows one file changed). The
staged blob for `.xgd/tickets/hot/chat-8c8e0f89.md` hashes to
`b08e83a9aac87b8d5b5aed8dd92c223909c8260c`, which is exactly the stage-3
(theirs) blob from `git ls-files -u`. The resolution is byte-identical to what
the developer authored; every incoming change is present and nothing was
dropped.

No hunks were dropped, so the BUG-1301 precedence exception does not apply to
this resolution. No UAT test files were involved. No code/implementation files
were involved.

Post-resolution state: `git status --porcelain` shows no UU/AA/DU/UD/AU/UA
lines — only `M  .xgd/tickets/hot/chat-8c8e0f89.md` (staged). Net staged diff
vs HEAD is non-empty (2 insertions, 1 deletion), so this is not a
BUG-1109/BUG-1122 redundant-commit case. `CHERRY_PICK_HEAD` was left intact for
`cherry_pick_finalize_resolution`; no `--continue`/`--skip`/`--quit`/`--abort`
or other sequencer-state command was run.
