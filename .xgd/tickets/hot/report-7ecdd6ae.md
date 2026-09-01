---
uid: report-7ecdd6ae
id: REPORT-3265
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:28:32.937631+00:00'
updated_at: '2026-09-01T23:28:32.937631+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **UU**, intent/bookkeeping ticket
  (rule 2e). Sparse-excluded on this branch (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; materialized with
  `git checkout --ignore-skip-worktree-bits --ours` (note: `git checkout` has no
  `--sparse` flag) and staged with `git add --sparse`.
  **Rule applied: keep the superset (ours).** Ours is a strict content superset
  of theirs, and the enrichment's fallback ("intent unknown, take the more recent
  commit by timestamp") points the same way — HEAD-side latest
  `a9260691cc` 2026-09-01 16:21:16 -0700 vs incoming `00a976b04e`
  2026-08-31 13:42:52 -0700. Flagged for post-merge review per that rule.

## Incoming changes preserved

Verified by diffing stage :3: against stage :2:. Every substantive addition the
incoming commit made is present in the resolved (ours) version:

- **"3. The blob store, in its own bucket."** — present verbatim, including the
  `1stcontact-sites` must-not-share argument, the BUG-31 / [[DOC-12]] §7
  precedent, and the disclosure-vs-overwrite reasoning.
- **The `t/<tenant>/blob/<sha256>` key-shape rationale** ([[DOC-38]] §7.2,
  existence oracle, [[DOC-37]] erasure, declared in both wrangler blocks) —
  absorbed verbatim into ours' `**The bucket is `1stcontact-material`.**`
  paragraph, which additionally names the bucket and adds
  `vitest.workers.config.mts`.
- **Acceptance bullet "A blob bucket distinct from `1stcontact-sites`, declared
  top-level and under `[env.production]`, with a UAT pinning both"** — present
  identically.
- **Acceptance bullet on attachment ops** — present in refined form: ours says
  `ticketStoreFor(env)` throws when the blob binding is absent, and explicitly
  notes the component's call-time refusal is correct upstream behaviour. This is
  the same fact carried forward with a later correction, not a discard.
- **Renumbering `3. The TypePack` -> `4. The TypePack`** — present.

The only lines in theirs that are absent from ours are frontmatter
(`updated_at`, `last_field_updated: body`, `status: draft`), superseded by ours'
later reconcile bookkeeping (`status: reconciling`, `updated_at`
2026-09-01T00:01:02, plus `commits`/`orphan_commits`/`version`/`chat_comment`),
and prose that ours rewrites in place (the `1. The schema.` paragraph, expanded
with the `0003_ticket_store.sql` name and the shared-`tenants` ALTER; the
`## Open questions` section, replaced by `## Both open questions are now
settled`, which answers both).

No BUG-1301 precedence exception was needed; no hunk was dropped.

## Note for the finalize step

The staged tree nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is
empty). This is the redundant-commit case (BUG-1109/BUG-1122), not a discard:
STEP 3's check confirms the incoming commit's changes are *present* in HEAD via a
later route — HEAD already carries this content plus a `## What landed
(free-coded, 2026-08-31)` section documenting the free-coded work downstream of
it. Per STEP 4, `--skip` was not called; finalize will detect the clean staged
diff. `CHERRY_PICK_HEAD` left intact.
