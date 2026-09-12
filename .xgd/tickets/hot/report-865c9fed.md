---
uid: report-865c9fed
id: REPORT-4122
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:05:57.210129+00:00'
updated_at: '2026-09-12T20:05:57.210129+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Context

Incoming commit `876811161c` is a merge of `free-BUG-39` into `xgd-working`.
Its effective content (diff vs first parent `ab2f423dde`) is the free-branch
commit `759cd87405` "test(chat-host): one streaming model double, shared by
every suite [FREE-CODED]".

HEAD already contains that SAME work as `61e4aae3dd` (same subject, same
`[FREE-CODED]` marker). Blob comparison of `759cd87405` vs `61e4aae3dd` over
`tests/` and `package.json` shows every conflicting file is byte-identical
between them except `tests/reconciliation-assistant-conversation.test.ts`,
which HEAD extended afterwards. Two later HEAD commits then built on top:
`12c967de95` (fix_uat_validation) and `a1680d56b6` (fix_uat_coverage).

So on every conflicting file, OURS = INCOMING + subsequent HEAD-side work.
Resolution is OURS throughout; nothing incoming is lost.

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, rule 2e (intent/bookkeeping ticket).
  Bodies are word-for-word identical after whitespace/table-pipe normalisation
  (verified by normalised diff); the only real differences are frontmatter.
  OURS is both later-positioned (`updated_at` 2026-08-31 vs 2026-08-25) and a
  strict superset of facts: `status: bundled` (vs `free_coding`), plus
  `commits.working_sha`, `version`, `story_points`, `bundled_in:
  bundle-8eef3846`, none of which exist on the incoming side. Took OURS.
  (Incoming's body keeps a proper markdown table where OURS has it flattened
  by an overlay round-trip — a formatting difference only, no fact lost.)

- `package.json` — UU, rule 2g (config, scalar). Incoming bumps
  0.2.14 → 0.2.15; HEAD is already 0.2.31. Monotonic version counter, HEAD
  strictly ahead — kept 0.2.31.

- `tests/reconciliation-assistant-conversation-knowledge.test.ts` — UU, rule 2c.
  Incoming's only change is swapping the inline model double for
  `import { says, scriptedClient } from './support/scripted-model-client'`.
  OURS has that import plus a later rewrite of the priming/degradation cases
  (`setKnowledgeRoot`, `CARETAKER_PURPOSE`, derived `readGroupTools`). Took OURS.

- `tests/reconciliation-assistant-conversation.test.ts` — UU, rule 2c.
  Incoming swaps to `calls, says, scriptedClient` from the shared double.
  OURS has that import, widened to `calls, modelSaw, says, scriptedClient,
  stalls`, plus the AC-1055 rewrite (BUG-38) and the new AC-1057 mid-turn case.
  Took OURS.

- `tests/reconciliation-draft-change-journal.test.ts` — UU, rule 2c.
  Incoming deletes the file's 3rd inline transcription of the wire protocol and
  imports the shared double. OURS has exactly that, plus `modelSaw` and a new
  `test_UAT_AC1621_the_manual_carries_the_rule_the_sequence_and_the_undo_note`
  case. Took OURS.

- `tests/support/scripted-model-client.ts` — AA, rule 2b (both added).
  OURS is a strict superset of INCOMING: same module header and same
  `scriptedClient` / `says` / `calls`, additionally widening `ModelRequest.system`
  to `string | text-block[]`, widening `ModelStep` to allow an `AsyncIterable`,
  iterating with `for await`, and exporting `modelSaw` / `textOf` / `stalls`.
  Kept the superset (OURS). Every symbol incoming exports is present with a
  compatible signature.

- `tests/test_UAT_FC_REQ-131_change_journal.test.ts` — UU, rule 2c + 2f.
  Incoming deletes the file's local `scriptedClient` and imports the shared one.
  OURS has that, with the import widened to include `modelSaw` and two
  assertions moved from `client.seen[n].system` to `modelSaw(client.seen[n])`.
  No test function present on either side was deleted: both sides carry
  `test_UAT_FC_REQ_131_the_reminder_carries_the_signal_only_when_something_changed`
  and it survives in the resolution.

## Incoming changes preserved

Verified per file by diffing stage 3 (incoming) against stage 2 (ours); in every
case the diff is one-directional — ours adds to theirs and removes nothing
theirs introduced:

- `scripted-model-client.ts`: all of incoming's exports and its module header
  are present verbatim in the resolved file.
- All four test files: incoming's `./support/scripted-model-client` import and
  the removal of the inline pre-streaming doubles are present in the resolved
  files; no inline model-double transcription was reintroduced.
- `package.json`: incoming's intent (version bump) is present and superseded —
  0.2.31 > 0.2.15.
- `bug-23d1ec27.md`: incoming's body text is present word-for-word.

Additional confirmation that this cherry-pick is REDUNDANT rather than
discarded (BUG-1109/BUG-1122): the new file the incoming commit adds,
`tests/test_UAT_FC_BUG-39_model_double_contract.test.ts`, is already in HEAD at
the identical blob `42adb8ce23`. After staging, `git diff --cached HEAD` is
empty — the incoming commit's effect is entirely present in HEAD already via
`61e4aae3dd`. Per STEP 4, `--skip` was NOT invoked; the finalize step will
detect the clean staged diff.

No hunk was dropped under the BUG-1301 precedence exception; no exception was
needed.

## Flagged for post-merge review

Per the enrichment's "Intent unknown on one or both sides" rule, all seven files
are flagged. The one worth a human glance is `bug-23d1ec27.md`, where the
markdown table under "## Fix — as landed" survives in flattened form on the
HEAD side.
