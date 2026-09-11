---
uid: report-0c1cdaa8
id: REPORT-3617
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:02:36.625334+00:00'
updated_at: '2026-09-10T01:02:36.625334+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

Cherry-pick in progress: `876811161c93c70b11e0d4258b52983725f9fde5`
("Merge branch 'free-BUG-39' into xgd-working", 2026-08-25 16:27:59 -0700).
Two conflicts, both UU, both confined to scalar frontmatter/version facts —
every code file in the commit merged cleanly.

- **`.xgd/tickets/hot/bug-23d1ec27.md`** (BUG-39) — UU, intent/bookkeeping
  ticket, rule 2e (per-fact resolution, later-positioned intent wins per fact).
  The conflicted hunk was the four-line `updated_at` / `completed_at` /
  `last_field_updated` / `status` block only; the ticket body merged cleanly.
  - `status`: HEAD `bundled` (set 2026-08-31T05:05:09Z by
    `0929135455 xgd(ticket): seed_local_overlay`) vs incoming `free_coding`
    (2026-08-25T23:27:28Z). Same fact, HEAD is the later position and is a
    lifecycle advance past `free_coding` — kept HEAD. Reverting a
    workflow-advanced status to an older value is exactly the regression this
    rule exists to prevent.
  - `updated_at`: kept HEAD's later `2026-08-31T05:05:09.315020+00:00`.
  - `last_field_updated`: kept HEAD's `status`, consistent with the composed
    timeline's most recent field update.
  - `completed_at`: `null` on both sides, no conflict of fact.
  - Resolved by editing the conflicted hunk in place rather than
    `checkout --ours`, so git's clean merge of the body was preserved verbatim
    instead of being overwritten by HEAD's whole blob.

- **`package.json`** — UU, scalar version conflict.
  HEAD `0.2.20` (`510d4082 [FREE-CODED] REQ-162 — version 0.2.20`,
  2026-08-31 14:41:02 -0700) vs incoming `0.2.15`
  (`759cd874 [FREE-CODED] ...`, 2026-08-25 16:26:47 -0700). Both sides are
  `free_coded`, so the working-timeline exception applies: the later position
  wins. Kept HEAD's `0.2.20`. The incoming bump is release bookkeeping, not
  code intent, and 0.2.15 is strictly behind — taking it would silently roll
  the package version backwards. Incoming's diff to this file was the version
  line and nothing else, so no other incoming content was at stake.

Staged with `git add --sparse` (`.xgd/tickets/` is outside the sparse-checkout
cone on this branch). `git status --porcelain` reports no remaining conflict
classes. `CHERRY_PICK_HEAD` left intact for
`cherry_pick_finalize_resolution`; no `--continue`/`--skip`/`--abort`/`reset`
was run.

## Incoming changes preserved

- **`.xgd/tickets/hot/bug-23d1ec27.md`** — preserved in full.
  `git diff --ignore-all-space 8768111 -- <file>` against the resolved working
  tree yields exactly one hunk, entirely inside the frontmatter, containing
  only the superseded facts above plus the `fields.commits` /
  `fields.version` / `fields.story_points` / `fields.bundled_in` entries HEAD
  added and incoming never had. Zero body hunks: the incoming commit's entire
  rewrite of the ticket — the "blast radius" paragraph, the `AnthropicAccumulator`
  root-cause rewrite, "## Fix — as landed" with its suite table, "### The
  evidence for this ticket", "## Watch for — resolved", "## Out of scope — a
  second, unrelated defect surfaced", the ✅-annotated acceptance criteria and
  the `./bin/1c assets` reproduce note — is present byte-for-byte.

- **`package.json`** — the incoming diff was `0.2.14` → `0.2.15` and nothing
  else. Superseded by HEAD's later `0.2.20`, not discarded: the version fact
  itself is present and carries the newer value.

- **Code/test files in the commit** — no conflict, and verified present in
  HEAD rather than lost to a clean-merge escape. The commit's ten test-side
  files were checked against HEAD:
  - Byte-identical between `8768111` and HEAD: `tests/support/scripted-model-client.ts`,
    `tests/test_UAT_FC_BUG-39_model_double_contract.test.ts`,
    `tests/test_UAT_FC_REQ-122_chat_host.test.ts`,
    `tests/test_UAT_FC_REQ-127_session_binding.test.ts`,
    `tests/test_UAT_FC_REQ-131_change_journal.test.ts`,
    `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`,
    `tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts`,
    `tests/reconciliation-draft-change-journal.test.ts`.
  - Evolved further on HEAD but retaining this commit's conversion:
    `tests/reconciliation-assistant-conversation.test.ts` and
    `tests/reconciliation-assistant-conversation-knowledge.test.ts`.
  - The commit's defining change — collapsing four hand-maintained
    transcriptions of the streaming wire protocol into one shared double — was
    confirmed by grep: all eight converted suites import
    `{ ... } from './support/scripted-model-client'` in HEAD. No suite has
    drifted back to an inline double.

- **No UAT test function was deleted** on either side of this conflict; no
  hunk was dropped, so the BUG-1301 precedence exception was not invoked.

## Note for the finalize step

The resolution nets to **no staged diff vs HEAD** (`git diff --cached HEAD`
is empty). This is the redundant-commit case (BUG-1109/BUG-1122), not a
discard: STEP 3's distinction resolves to "present in HEAD via a different
route" — this same merge is already in the bundle branch's history as
`fe03200d68 Merge branch 'free-BUG-39' into xgd-working` (2026-08-25
16:27:59 -0700, remapped sha), and the 2026-08-31 `seed_local_overlay`
re-seeded the ticket from the post-merge working timeline. Per instruction,
`--skip` was NOT called; finalize should detect the clean staged diff and skip
the commit itself.
