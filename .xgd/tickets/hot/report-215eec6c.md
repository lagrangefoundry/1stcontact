---
uid: report-215eec6c
id: REPORT-6826
type: report
title: 'Report: fix_plan for story-a58a0974'
created_by: xgd
created_at: '2026-10-28T04:30:08.002096+00:00'
updated_at: '2026-10-28T04:30:08.002096+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-a58a0974
  fix_iteration: 1
  items:
  - index: 0
    tests:
    - tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2054_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view
    - tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2055_new_session_is_recorded_and_reported_under_the_consultant_name_alone
    - tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2056_session_stored_under_the_legacy_role_resumes_and_takes_an_editing_turn
    - tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2057_no_working_tree_file_carries_the_legacy_role_word_except_the_alias
    - tests/reconciliation-assistant-conversation-knowledge.test.ts::test_UAT_AC1319_priming_carries_the_map_then_the_purpose_then_the_manual
    - tests/reconciliation-assistant-conversation-knowledge.test.ts::test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1051_capability_answer_names_the_role_and_readiness_without_a_conversation
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1055_an_identifier_is_answered_only_when_it_names_a_site_this_account_holds
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1057_losing_the_host_mid_turn_costs_that_turn_and_not_the_conversation
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation
    - tests/reconciliation-assistant-conversation.test.ts::test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion
    - tests/reconciliation-assistant-turn-change-signal.test.ts::test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion
    - tests/reconciliation-assistant-turn-change-signal.test.ts::test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent
    - tests/reconciliation-assistant-turn-change-signal.test.ts::test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one
    dependency_tests:
    - test_UAT_AC1404_
    - test_UAT_AC1406_
    - test_UAT_AC1407_
    - test_UAT_AC1408_
    - test_UAT_AC1409_
    - test_UAT_AC1410_
    - test_UAT_AC1456_
    - test_UAT_AC1651_
    - test_UAT_AC1652_
    - test_UAT_AC1653_
    - test_UAT_AC1792_
    - test_UAT_AC1793_
    - test_UAT_AC1794_
    - test_UAT_AC2022_
    - test_UAT_AC2023_
    - test_UAT_AC2024_
    - test_UAT_AC2025_
    - test_UAT_AC2026_
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    - test_UAT_AC2029_
    - test_UAT_AC2030_
    - test_UAT_AC2031_
    - test_UAT_AC2032_
    - test_UAT_AC2033_
    - test_UAT_AC2034_
    - test_UAT_AC2035_
    hypothesis: tools/generate/src/cli/ai/host.ts:213 nodeDeps() still passes `logDir`,
      which the shared @lagrangefoundry/ai SessionManager now rejects ('unknown option
      logDir — `logDir` is now `junctions`'), so no Node session can open; separately
      AC2057 fails on four REQ-174 rename stragglers the tip has already removed.
    instructions: 'Two causes, both already settled at xgd-working''s tip; port them,
      do not redesign. (1) Every failing test except AC2057 goes through nodeDeps()
      in tools/generate/src/cli/ai/host.ts (directly, or via startBuilder), and session
      construction throws `SessionManager: unknown option logDir — logDir is now junctions`
      (reproduced on this branch: AC1319/AC1320 fail with exactly that message; the
      startBuilder files time out in beforeAll/turns the same way, and an earlier
      story in this bundle, story-58b2cec4, diagnosed the identical cause at host.ts:213
      in REPORT-6793 but the fix was never applied here because host.ts was outside
      that batch). Replace `logDir: path.join(dir, ''live''),` in nodeDeps() with
      `junctions: lib.fileJunctions(path.join(dir, ''live'')),`, exactly as tip host.ts:233-237
      does. host-core.ts:636 already forwards deps.junctions, so nothing else in the
      session path changes. Port ONLY that line: do not bring over the tip''s other
      nodeDeps additions (cases, extraSurfaces, workerKnowledge), which belong to
      other intents. (2) AC2057 (REQ-174: ''a guard scans the working tree for the
      old word and allows it in exactly one file'') fails because four files besides
      roles.ts still contain ''caretaker''. On the tip, roles.ts is the only file
      that does. The four are: apps/control-app/src/system-knowledge.ts:192 (a doc
      comment: reword ''what this caretaker is for'' to the tip''s phrasing, ''the
      role purpose'', see tip system-knowledge.ts:209-242; comment only, no code change);
      tests/reconciliation-assistant-arrival-notice-budget.test.ts:18 (comment naming
      the old `caretakerReminder` symbol: use the current symbol name in roles.ts);
      tests/reconciliation-assistant-conversation-continuity.workers.test.ts:338 (comment:
      say ''consultant''); and tests/reconciliation-assistant-conversation.test.ts:648
      (the AC1405 deployed-header fixture `role: ''caretaker''`: use CONSULTANT_ROLE
      / ''consultant''. Legacy-name resume is AC2056''s job, which builds its legacy
      header at runtime from LEGACY and stays untouched). The test walks untracked
      files as well, so make sure no scratch file in the working tree carries the
      word either. Your sandbox may refuse local port binding (EPERM on listen). If
      it does, that is the environment, not the code; report it rather than altering
      the tests'' startBuilder use. Run the dependency_tests too: the looking-surface
      suite (AC2022-AC2035) overrides junctions itself and must stay green, and AC1404-AC1410/AC1456/AC1651-AC1653/AC1792-AC1794
      consume the same host and knowledge path.'
    override:
      rule: code_frozen
      justification: REQ-174 (in window) requires the rename to 'leave nothing behind',
        with a guard that allows the old word 'in exactly one file', and its evidence
        item 4 requires a legacy-stored session to reopen and take an editing turn.
        AC-2057 and AC-2054..2056 demand the same. No Node session can open while
        host.ts passes the rejected logDir, and system-knowledge.ts carries a straggler
        in a comment. The xgd-working tip already has both changes (host.ts junctions
        line, REQ-452; no 'caretaker' outside roles.ts), so this ports tip behaviour
        and invents nothing.
      files:
      - tools/generate/src/cli/ai/host.ts
      - apps/control-app/src/system-knowledge.ts
      - tests/reconciliation-assistant-arrival-notice-budget.test.ts
      - tests/reconciliation-assistant-conversation-continuity.workers.test.ts
      - tests/reconciliation-assistant-conversation.test.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/host.ts
        lines: 230-237
      - file: apps/control-app/src/system-knowledge.ts
        lines: 209-242
      trust_boundary: false
    test_scope: test_UAT_AC1051_ or test_UAT_AC1052_ or test_UAT_AC1054_ or test_UAT_AC1055_
      or test_UAT_AC1056_ or test_UAT_AC1057_ or test_UAT_AC1058_ or test_UAT_AC1059_
      or test_UAT_AC1060_ or test_UAT_AC1061_ or test_UAT_AC1319_ or test_UAT_AC1320_
      or test_UAT_AC1405_ or test_UAT_AC1817_ or test_UAT_AC1818_ or test_UAT_AC2054_
      or test_UAT_AC2055_ or test_UAT_AC2056_ or test_UAT_AC2057_ or test_UAT_AC1404_
      or test_UAT_AC1406_ or test_UAT_AC1407_ or test_UAT_AC1408_ or test_UAT_AC1409_
      or test_UAT_AC1410_ or test_UAT_AC1456_ or test_UAT_AC1651_ or test_UAT_AC1652_
      or test_UAT_AC1653_ or test_UAT_AC1792_ or test_UAT_AC1793_ or test_UAT_AC1794_
      or test_UAT_AC2022_ or test_UAT_AC2023_ or test_UAT_AC2024_ or test_UAT_AC2025_
      or test_UAT_AC2026_ or test_UAT_AC2027_ or test_UAT_AC2028_ or test_UAT_AC2029_
      or test_UAT_AC2030_ or test_UAT_AC2031_ or test_UAT_AC2032_ or test_UAT_AC2033_
      or test_UAT_AC2034_ or test_UAT_AC2035_
---

# Fix Plan — Iteration 1

## Hypothesis
`tools/generate/src/cli/ai/host.ts:213` (`nodeDeps()`) still passes `logDir`. The shared `@lagrangefoundry/ai` `SessionManager` now rejects that option, so no Node session can open. Separately, AC2057 fails on four REQ-174 rename stragglers that the `xgd-working` tip has already removed.

## Analysis
- There are no prior fix_plan or batch_fix_assessment reports for story-a58a0974, so this is a true first iteration.
- Running the four node files on this branch reproduced the failure. AC1319 and AC1320 fail with `SessionManager: unknown option logDir — logDir is now junctions` at `openSession`.
- The three `startBuilder`-based files (consultant-role, conversation, turn-change-signal) all go through the same `nodeDeps()`. My sandbox also refused local port binding (EPERM), but that is my environment. A prior builder in this bundle ran `reconciliation-assistant-conversation.test.ts` and got the logDir error, not EPERM.
- story-58b2cec4 diagnosed the identical cause (REPORT-6793 handoff, REPORT-6791 assessment: "12 tests fail ... `SessionManager: unknown option logDir`, raised from `host.ts:213`"). The fix was never applied on this branch: `host.ts` still has `logDir` at line 213.
- The tip has the fix at `host.ts:233-237`: `junctions: lib.fileJunctions(path.join(dir, 'live'))`, under REQ-452. `host-core.ts:636` on this branch already forwards `deps.junctions`.
- AC2057 does not depend on sessions. It scans the working tree for `LEGACY_ROLE_NAMES` (`caretaker`). Four files other than `roles.ts` still match:
  - `apps/control-app/src/system-knowledge.ts:192` (a comment)
  - `tests/reconciliation-assistant-arrival-notice-budget.test.ts:18` (a comment)
  - `tests/reconciliation-assistant-conversation-continuity.workers.test.ts:338` (a comment)
  - `tests/reconciliation-assistant-conversation.test.ts:648` (the AC1405 fixture header `role: 'caretaker'`)

  At the tip, `git grep -ic caretaker` finds only `roles.ts`.
- The 15 "orphan AC" entries are exactly the in-scope ACs whose only tests are the failing node tests. AC1055, AC1057, AC1320 and AC1405 also have passing Worker tests, so they are not orphaned. The orphans clear when the node tests go green, and no matrix change is needed.
- No conflict was found between ACs. REQ-174 (in window) is the owning intent for AC2054-2057. Its text demands both the working legacy resume and the one-file guard.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2057_no_working_tree_file_carries_the_legacy_role_word_except_the_alias` — inter-test-dependency/environment — the walk includes untracked files, so a stray scratch or log file in the worktree can fail it. Consider limiting the walk to `git ls-files` plus untracked files that are not ignored.
- `tests/reconciliation-assistant-looking-surface.test.ts::hostFor` (helper used by AC2022-AC2035) — infra-reuse-gap — `logDir: undefined` is now a dead key once `nodeDeps` supplies `junctions`. Drop it when next in the file.
- `tests/reconciliation-assistant-conversation-knowledge.test.ts::test_UAT_AC1319_priming_carries_the_map_then_the_purpose_then_the_manual` — weak-observation (check) — confirm it asserts the order of the priming entries, not just that each is present.

## Batches
One batch: all 21 failures share one root cause in one production file (`host.ts`), plus a disjoint but trivial straggler fix for AC2057. They are kept together because the AC1405 fixture edit (straggler 4) sits in the same test file as the logDir-blocked tests. Dependency tests widen validation to the other consumers of `nodeDeps` and the knowledge path:
- AC1404-AC1410 and AC1456 (deployed host and continuity)
- AC1651-AC1653 (deployed knowledge)
- AC1792-AC1794 (chat ticket)
- AC2022-AC2035 (story-58b2cec4's looking surface, which builds on `nodeDeps`)

## Mode overrides (REQ-892)
Batch 0 is granted `code_frozen` on these files:
- `tools/generate/src/cli/ai/host.ts`
- `apps/control-app/src/system-knowledge.ts`
- `tests/reconciliation-assistant-arrival-notice-budget.test.ts`
- `tests/reconciliation-assistant-conversation-continuity.workers.test.ts`
- `tests/reconciliation-assistant-conversation.test.ts`

Justification:
- REQ-174 (in window) requires the rename to leave nothing behind, with a guard allowing the old word in exactly one file, and requires a legacy-stored session to reopen and take an editing turn. AC-2054 through AC-2057 demand the same.
- The tip already implements both changes. Tip evidence: `host.ts:230-237` (the junctions line) and `system-knowledge.ts:209-242` (the comment without the straggler).
- The grant ports one line of tip behaviour and one comment rewording. Nothing else from the tip's `nodeDeps` is ported.
- `trust_boundary`: false.
