---
uid: report-53bf3b19
id: REPORT-3102
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:12:09.464043+00:00'
updated_at: '2026-08-31T22:12:09.464043+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (rule 2e),
  out of the sparse-checkout cone (DOC-986 §2/§4.1) so the conflict existed only in
  the index, with no working-tree markers. Resolved with
  `git checkout --ours` + `git add --sparse`.

  Per-fact resolution (not whole-file winner-picking):

  | fact | ours (HEAD) | theirs (incoming) | resolution |
  |---|---|---|---|
  | entire body (Symptom → Reproduce) | identical | identical | **no conflict** — byte-identical on both sides |
  | `status` | `bundled` | `free_coding` | ours — later intent (2026-08-31 vs 2026-08-25); this bundle's own bookkeeping |
  | `updated_at` | `2026-08-31T05:05:09` | `2026-08-25T23:27:28` | ours — later |
  | `last_field_updated` | `status` | `body` | ours — consistent with its own operation; the body edit is already present in HEAD |
  | `fields.commits` / `version: 0.2.15` / `story_points: 3` / `bundled_in: bundle-8eef3846` | added | untouched | ours — superset rule; incoming never touched these fields |

  No fact was taken from neither side, and no content was invented. Ours is a
  strict superset: it contains 100% of the incoming's body edits plus the
  bundling bookkeeping. Taking theirs would have reverted `status` from
  `bundled` to `free_coding` and dropped this bundle's own `bundled_in` /
  `commits` / `version` records.

## Incoming changes preserved

The incoming commit is `876811161c93c70b11e0d4258b52983725f9fde5`
("Merge branch 'free-BUG-39' into xgd-working"), touching 12 files. Only the
ticket conflicted; the other 11 merged without conflict.

**All of the incoming commit's code changes are already present in HEAD,
verbatim.** Verified by blob comparison (`git diff <CPHEAD> HEAD -- <paths>`
returns empty, i.e. identical blobs) for every one of:

- `tests/support/scripted-model-client.ts` (the new shared double — the heart of BUG-39)
- `tests/test_UAT_FC_BUG-39_model_double_contract.test.ts` (the new 2-case evidence suite)
- `tests/test_UAT_FC_REQ-122_chat_host.test.ts`
- `tests/test_UAT_FC_REQ-127_session_binding.test.ts`
- `tests/test_UAT_FC_REQ-131_change_journal.test.ts`
- `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`
- `tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts`
- `tests/reconciliation-draft-change-journal.test.ts`
- `tests/reconciliation-assistant-conversation-knowledge.test.ts`
- `package.json`

The 12th file, `tests/reconciliation-assistant-conversation.test.ts`, is the only
one where HEAD differs from the incoming commit — and it differs by being
*ahead*, not behind. HEAD still carries the incoming's core change
(`import { calls, says, scriptedClient } from './support/scripted-model-client'`
at line 18, with 13 `scriptedClient(...)` call sites and no residual inline
`content_block` transcription); the delta is additional later work that adds
*more* uses of the shared double. Nothing from the incoming side was lost.

This is the redundant-commit case, not the discarded-commit case that STEP 3
guards against: the incoming commit's key changes are present in HEAD via a
different route — commit `92c6465d56` *"test(chat-host): one streaming model
double, shared by every suite [FREE-CODED]"*, which landed the same free-coded
work through post-watermark sync. STEP 3's discard test therefore passes; the
incoming intent is fully realised in the tree.

No UAT test function was deleted from either side, so rule 2f is not engaged and
the BUG-1301 precedence exception was not invoked — no hunk was dropped under it.

## Staging state

Conflict resolved and staged; no unmerged index entries remain. `CHERRY_PICK_HEAD`
is deliberately left intact for `cherry_pick_finalize_resolution` — no
`--continue` / `--skip` / `--quit` / `--abort` / `reset` was run.

The staged tree nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty),
because both halves of this commit — the code and the ticket body — already
landed in HEAD. Per STEP 4 this is not a failure and `--skip` was not called;
Python's finalize step will detect the clean staged diff and skip the commit.
