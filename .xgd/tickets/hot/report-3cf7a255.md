---
uid: report-3cf7a255
id: REPORT-11285
type: report
title: 'Report: fix_plan for story-a58a0974'
created_by: xgd
created_at: '2026-11-08T05:25:55.990536+00:00'
updated_at: '2026-11-08T05:36:54.228072+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-a58a0974
  fix_iteration: 4
  items:
  - index: 0
    tests:
    - tests/reconciliation-assistant-session-texts.test.ts::test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present
    - tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2066_per_turn_reminder_the_model_receives_calls_the_owner_the_client
    - tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record
    dependency_tests:
    - test_UAT_AC2054_
    - test_UAT_AC2055_
    - test_UAT_AC2056_
    - test_UAT_AC2057_
    - test_UAT_AC2374_
    - test_UAT_AC2375_
    - test_UAT_AC1404_
    - test_UAT_AC1405_
    - test_UAT_AC1406_
    - test_UAT_AC1407_
    - test_UAT_AC1408_
    - test_UAT_AC1410_
    hypothesis: AC2109 and AC2066 tests assert a superseded reminder shape (a DOC-33
      pointer; a single-line reminder) that AC-2109 replaced with six id-free paragraphs,
      and AC1409 fails on an assertion not yet observed against the working-tree storage
      design.
    instructions: 'Code is frozen and correct; all three fixes are in tests. (1) AC2109,
      session-texts.test.ts:232: the test asserts toContain(DOC-33), but AC-2109 now
      forbids any DOC-<n> id in the reminder. Replace it with what the AC verifies:
      the reminder points to the knowledge base for the method (/knowledge base/),
      matches no /DOC-\d+/, has no unfilled {placeholder} and does not end with a
      separator. Make these assertions on what the model received (firstSaw), not
      only on consultantReminder(). Rename the test so it no longer says doc33, keeping
      the test_UAT_AC2109_ token. (2) AC2066, consultant-role.test.ts:200-210: the
      slice ends at the first newline, so it captures only the site line. AC-2109
      makes the reminder six paragraphs separated by blank lines, and the word client
      first appears in paragraph 2. Capture the whole reminder block as sent: from
      the site-line opening through the method entry (priming.json:273-298 in the
      working tree), or the end of the message text that carries it. Assert client,
      no user and no legacy name over that block, and fix the stale one-line comment.
      Do not loosen the user or legacy checks. (3) AC1409, deployed.workers.test.ts:610-713:
      run it and read the first failing assertion. The working tree stores transcripts
      as chat tickets with chat_transcript comments (ai.ts:27-31, tickets.ts:388)
      and audit records at audit/<tenant>/<session>/ (ai.ts:284), as the AC says.
      If the failure is test drift against the working-tree API (helper, route shape,
      seed), fix the test so it still proves every observation AC-1409 lists. If production
      contradicts AC-1409, report blocked_by code_frozen with the failing assertion
      and the file:line; do not edit production.'
    test_scope: test_UAT_AC2109_ or test_UAT_AC2066_ or test_UAT_AC1409_ or test_UAT_AC2054_
      or test_UAT_AC2055_ or test_UAT_AC2056_ or test_UAT_AC2057_ or test_UAT_AC2374_
      or test_UAT_AC2375_ or test_UAT_AC1404_ or test_UAT_AC1405_ or test_UAT_AC1406_
      or test_UAT_AC1407_ or test_UAT_AC1408_ or test_UAT_AC1410_
    ladder:
      rung1: AC-2109 (in scope, story-a58a0974) says the reminder names no DOC id
        and is six blank-line-separated paragraphs; this decides AC2109 and AC2066,
        so the tests change.
      rung2: The reference reminders (priming.json:884+ at reconcile-src-BUNDLE-40)
        name no DOC id either, which agrees; for AC1409 the reference test is byte-identical,
        so it gives no extra signal.
      rung3: 'AC1409 stands: its failing assertion is unobserved and the AC matches
        the working-tree storage design, so the builder runs it and fixes test drift
        or reports blocked_by with evidence.'
  batches_pending: false
---

# Fix Plan — Iteration 4

## Hypothesis
Two of the three failures are stale test assertions. AC-2109 was rewritten so the reminder names no `DOC-<n>` id, but its test still expects 'DOC-33'. AC-2066's test reads only the first line of a reminder that AC-2109 now delivers as paragraphs, and the word "client" first appears in the second paragraph. AC-1409's failing assertion could not be observed and is decided at rung 3. The two orphan ACs are a consequence of these failing tests.

## Analysis
**Prior history is cross-branch leakage.** The listed fix_plan reports (c019e0ba, 9df9a171, 215eec6c) and their comments describe BUNDLE-32: 21 failures caused by `logDir` in `host.ts`, and a `system-knowledge.ts` tip_evidence range. None of that matches this run's 3 failures. On this branch the only report for story-a58a0974 is the quality report report-ee4f10c9. Following the prompt's rule, I have not used those reports, and this plan is effectively the first diagnosis for this subject.

**Test files equal the reference, code does not.** `git diff reconcile-src-BUNDLE-40 HEAD` is empty for all three test files. It is large for the production files under test (priming.json: 299 lines in the working tree vs 1822 at the reference; host-core.ts, router.ts and ai.ts also differ). Reconcile mode freezes the code, so the tests have to describe what the working tree does.

**AC2109** (tests/reconciliation-assistant-session-texts.test.ts:232). I reproduced it locally: `expected 'You are working on the site "studio".…' to contain 'DOC-33'`. The AC-2109 body now says entry 4 "points without restating the method and without naming a document", and its Verification says the reminder "matches no `DOC-<n>` id". The working tree's priming.json:286-289 already says "the rest of your method is in your knowledge base, not in these lines", with no id. The reference's reminders (priming.json:884+) name no DOC id either. The fault is in the test: line 232 asserts the opposite of its own AC. The test name, `..._points_to_doc33_...`, is also stale.

**AC2066** (tests/reconciliation-assistant-consultant-role.test.ts:200-210). The test slices the reminder from `You are working on the site "<slug>".` to the first `\n`. Working-tree priming.json:273-298 builds the reminder from six entries joined by blank lines, as AC-2109 requires. That slice therefore captures only the site line, which contains no "client"; "your client" first appears in entry 2. The test comment "The reminder is one line" predates AC-2109's paragraph form. AC-2066 itself is about the whole reminder, so the test needs to capture the whole reminder block. I could not run it locally because the sandbox blocks binding a port, so I diagnosed this by reading the code. The other tests in that file pass in the quality run, so its beforeAll hook is fine there.

**AC1409** (tests/reconciliation-assistant-conversation-deployed.workers.test.ts:610-713). I could not run it locally: the workers pool fails with EPERM on listen. The quality report has no JUnit details. The working tree already keeps transcripts in the account-bound ticket store (`chat` ticket plus `chat_transcript` comment, ai.ts:27-31, tickets.ts:388) and audit records at `audit/<tenant>/<session>/…` (ai.ts:284), which is what the AC describes. The other AC14xx tests in the same file pass. The failing assertion is one of: the `/preview/<slug>/draft/assets/<logo>` reachability check (200 + `<svg`), a probe answering 200, the storedKeys-unchanged check, or the cross-account `get` rejection. The builder must run it and read which one.

## Spec Changes Made
None. AC-2109 already carries the correct wording, and AC-2066 and AC-1409 are consistent with the working tree.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-assistant-session-texts.test.ts::test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present — weak-observation — it checks `quiet` (the function's return value) for the DOC/stage/length properties instead of what the model saw (`firstSaw`). Those assertions should be made on the reminder as received.
- tests/reconciliation-assistant-session-texts.test.ts::test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present — weak-observation — AC-2109 requires "no unfilled {placeholder}" and "does not end with a separator", and the test asserts neither.

## Batches
One batch with all three tests. The fixes are test-only, and AC2066 and AC2109 assert on the same reminder surface, so they must be resolved together under AC-2109's paragraph form. AC1409 is in a separate file but is small and fits the same pass.

## Resolution ladder (REQ-938)
Batch 0:
- AC2109 was decided at **rung 1**. AC-2109, which is in scope and owned by story-a58a0974, forbids naming any DOC id. The test changes and the code stands. Rung 2 agrees: the reference reminders name no DOC id.
- AC2066 was decided at **rung 1**. AC-2109's ordered paragraphs define the reminder's shape, and AC-2066 is about the whole reminder, so the test changes to capture the whole block. The code stands.
- AC1409 was decided at **rung 3**. Its failing assertion is unobserved and the AC matches the working tree's storage design, so the test stands. The builder runs it, and if the failure is a fixture or helper drift against the working-tree API, it corrects the test without weakening it. If production is wrong, the builder reports `blocked_by code_frozen` with evidence.