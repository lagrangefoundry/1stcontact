---
uid: report-467178ca
id: REPORT-4559
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T22:54:48.407964+00:00'
updated_at: '2026-09-20T22:54:48.407964+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — conflict class **AA** (both added);
  intent/bookkeeping bug ticket, rule **2e**. Incoming (`4677b81619`) is the
  ticket's original *create* commit: `status: draft`, `updated_at == created_at`
  (2026-08-24T21:06:08), `completed_at: null`, and no `chat_comment` /
  `commits` / `version` / `bundled_in` fields. HEAD is the strict superset —
  terminal `status: free_and_reconciled`, `updated_at` 2026-08-31T19:19:36,
  three recorded `working_sha`s, `version: 0.2.13`,
  `bundled_in: bundle-78f4e2fe`, plus the full confirmed-root-cause writeup.
  Per 2e ("one side a strict superset: keep the superset") the HEAD blob was
  taken wholesale; this also agrees with the injected metadata rule (take the
  more recent commit by timestamp). Staged with `git add --sparse` because the
  path is outside the sparse-checkout cone on resync branches (DOC-986 §2/§4.1),
  so the conflict existed only in the index with no working-tree markers.

## Incoming changes preserved

- No incoming content was discarded. The incoming draft body — the `PREVIEWS`
  WeakMap leading hypothesis, the candidate-fix list, and the
  "no telemetry / not started" prerequisite — is retained verbatim inside HEAD
  under "## Superseded — the original hypothesis, recorded because it was
  wrong", which explicitly preserves and then corrects it. Every incoming
  frontmatter value is either identical to HEAD's (`created_at`, `uid`, `id`,
  `type`, `created_by`) or strictly older (`updated_at`, `status`,
  `last_field_updated`, `completed_at`).
- No code/implementation files were in conflict, so no STEP 3 `git show`
  hunk-verification was required and no BUG-1301 precedence exception was
  invoked.
- The resulting staged diff against HEAD is empty — the incoming commit is the
  same ticket-create already at the base of HEAD's lineage for this file
  (`1c06c7cc89 xgd(ticket): create bug bug-6612c4b7`, which the resync anchor's
  `orphan_commits` map records as the rewrite of `4677b81619`). Per the mission,
  `git cherry-pick --skip` was NOT invoked; the finalize step will detect the
  clean staged diff. `CHERRY_PICK_HEAD` (`4677b816199d596f493093d78959d5e6c778d6a3`)
  is intact.
