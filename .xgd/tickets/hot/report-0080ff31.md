---
uid: report-0080ff31
id: REPORT-11366
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T08:41:52.790149+00:00'
updated_at: '2026-11-08T08:41:52.790149+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 6
  items:
  - index: 0
    tests:
    - tests/test_reconciliation_contacts_add_invite.workers.test.ts::test_UAT_AC2409_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_templates_sender
    - tests/test_reconciliation_contacts_add_invite_tab.test.ts::test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list
    - tests/test_reconciliation_contacts_add_invite.workers.test.ts::test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment
    - tests/test_reconciliation_contacts_add_invite_tab.test.ts::test_UAT_AC2337_invite_is_disabled_until_a_row_is_checked_and_opens_a_message_with_read_only_from_and_a_to_list
    dependency_tests:
    - test_UAT_AC2371_
    hypothesis: AC-2337 is superseded by AC-2409 (REQ-205 retracted its sender clause),
      but its two UATs are still live and the workers one asserts the retracted deployment-wide
      sender (from === FROM), contradicting the seeded invite's own from; AC-2409
      has never been through a gate.
    instructions: 'Test-only. AC-2337 (acceptance_criterion-c1839219) is status: superseded,
      superseded_by_uid bundle-c0301347, and is replaced by AC-2409 (acceptance_criterion-f8f76ace).
      Retire its two UATs: tests/test_reconciliation_contacts_add_invite.workers.test.ts:646,
      which asserts draft.from and every sent from equal FROM (''no-reply@example.test''),
      the behaviour REQ-205 retracted; and tests/test_reconciliation_contacts_add_invite_tab.test.ts:214.
      Before deleting each one, confirm its AC-2409 sibling (:698 and :257) still
      asserts every clause that survives the retraction: one message per recipient,
      no comma-joined To, the spoofed from on the POST ignored, the read-only From,
      and the To-List. Then make both AC-2409 UATs green. Update the file header comments
      that name AC-2337 so they point at AC-2409. Production code is frozen and none
      is needed. Keep systemText() in tests/support/scripted-model-client.ts, which
      the bundle''s FC suites import. If the workers UAT cannot bind a local port
      in your sandbox (listen EPERM), report that and leave its verdict to the gate.
      Do not count it as passed.'
    ladder:
      rung1: 'Decided here: REQ-205, the later intent on the invite-sender surface,
        retracts REQ-199''s pin (''The invite sends from `invite@1stcontact.io`; sign-in
        does not.''), so the AC-2337 tests are superseded and are retired, and AC-2409
        stands.'
      rung2: Not needed; the behaviour is not disputed, and AC-2371 and AC-2409 already
        pass against the template-sender code at HEAD.
      rung3: AC-2409's tests stand unchanged; no production code changes.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: REPORT-11364 hands off the reconciliation review, which says
        story coverage and evidence are sufficient and that ''No further code, test
        or matrix remediation is available or needed''. Its only FAIL is the historical
        misjudged override report-7519d965 (story-4cabde9a batch 0). That override''s
        consequence is applied (REQ-146 edit reverted; denial recorded in report-40bf3ba2
        and REPORT-11362), and code_frozen is now denied for that batch. No production
        change is demanded, so code_frozen stands; this batch only retires the superseded
        AC-2337 tests and gates AC-2409. Clearing the historical misjudgment needs
        an operator waiver, not a builder pass.'
      files:
      - tests/test_reconciliation_contacts_add_invite.workers.test.ts
      - tests/test_reconciliation_contacts_add_invite_tab.test.ts
    test_scope: test_UAT_AC2409_ or test_UAT_AC2337_ or test_UAT_AC2371_
---

# Fix Plan — Iteration 6

## Hypothesis
The only evidence still out of line with the matrix is in tests: AC-2337 is superseded (REQ-205 retracted its sender clause; replaced by AC-2409), but its two UATs remain live, and the workers one asserts the retracted sender (`from === FROM`, the deployment-wide `no-reply@example.test`), so it contradicts the seeded invite's own `from` and fails in any run that selects it. Meanwhile AC-2409, its replacement, has never been through a gate.

## Analysis
- **Failure set is empty.** The latest scoped gates, REPORT-11361 (report-60c312cb, 6dadc10758) and REPORT-11365 (report-a19f84a4, 5df6155815), both pass 224 tests with 0 failed and 0 skipped. The iteration-4 batch was verified by the builder (report-9415b697: AC1054, AC1817 and AC1818 passed). The REQ-209 browser ACs ran with 0 skipped, so that evidence is real.
- **The hypothesis is new on purpose.** Iterations 3 and 4 each filed "all iteration-2 failures are fixed at HEAD". It was true, and it is closed. This plan does not repeat it. It targets the one open evidence item, the superseded-AC tests, in a different file and a different layer (matrix and test alignment, not the font-metrics fixture).
- **The block this run returned on, REPORT-11364 (report-8cd436a6, `code_frozen`, batch_index -1)**, is the reconciliation review handed off as a block. Its own verdict: "The story coverage and evidence are now sufficient. The only reason for this FAIL is the override audit." The misjudged override, report-7519d965 (story-4cabde9a batch 0, `ai.ts`), is historical. Its consequence is already applied: the REQ-146 test edit is reverted, and the denial is recorded in report-40bf3ba2 and REPORT-11362. The review states "No further code, test or matrix remediation is available or needed." `code_frozen` is also now denied for story-4cabde9a batch 0, so no grant could be made there anyway. Nothing in the review needs a production change, so the block is **declined**. Clearing the historical misjudgment needs an operator waiver, not a builder pass.
- **What the review did leave actionable, within the rule:**
  1. `tests/test_reconciliation_contacts_add_invite.workers.test.ts:646` `test_UAT_AC2337_…from_the_deployment` asserts `draft.from` and every sent `from` equal `FROM`. That is the behaviour AC-2337 pinned and REQ-205 retracted. AC-2337 is `status: superseded` with `superseded_by_uid: bundle-c0301347`. AC-2409's UAT, at :698, already restates every surviving clause against `SEED_TEMPLATES.invite.from`, including the ignored spoofed `from`.
  2. `tests/test_reconciliation_contacts_add_invite_tab.test.ts:214` `test_UAT_AC2337_invite_is_disabled…` pins the same superseded AC. Its sibling `test_UAT_AC2409_…` at :257 covers it with the template's sender.
  3. AC-2409 is outside the run's scoped filter, so neither of its UATs has a gate result.
  Retiring a superseded AC's tests and gating its replacement are test-only edits. `code_frozen` does not govern them.
- **Isolation.** No pass-alone/fail-in-suite pattern in the history. The AC-2337 workers test is a deterministic contradiction, not contamination.
- The workers UAT needs local port binding. Builder sandboxes have refused it (`listen EPERM 127.0.0.1`, per REPORT-11364), so the gate is where AC-2409's workers evidence has to come from.

## Spec Changes Made
none. AC-2337 is already superseded and AC-2409 is already active; this plan only aligns their tests.

## Weak Evidence Flags (preventative — best effort)
- Scoped gate filter — weak-observation — the FC prefixes `test_UAT_FC_REQ_205_`, `_206_`, `_208_`, `_182_` and `_BUG_65_` match nothing, because those suites are named with hyphens (`test_UAT_FC_REQ-205_…`). Only FC_REQ_207 and FC_REQ_209 ran. The AC-tagged UATs carry the evidence, but the filter overstates what was gated.
- tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts — weak-observation — every case skips itself when Chromium cannot launch. Keep the gate's skipped count at 0 for this file, or treat a skip as missing evidence.
- tests/test_UAT_FC_BUG-58_invite_modal_fits — inter-test-dependency — depends on built `dist-assets`, so it fails in branch worktrees and passes in the primary checkout. Build the assets in setup, or fail with a named precondition.

## Batches
One batch, test-only: retire both UATs of the superseded AC-2337, and gate both UATs of its replacement AC-2409. AC-2371, which gates the same per-template sender through the mail path, runs as the dependency. They form one batch because they assert the same surface, the invite's resolved sender, and splitting them would hide the contradiction this batch resolves.

## Resolution ladder (REQ-938)
Batch 0 — decided at rung 1. REQ-205, the later intent in scope on the invite-sender surface, retracts REQ-199's pin ("The invite sends from `invite@1stcontact.io`; sign-in does not."). So the AC-2337 tests that assert the deployment-wide sender are superseded and are retired, and AC-2409 stands. Rung 2 is not needed: the behaviour is not in dispute, and AC-2371 and AC-2409 already pass against it. Rung 3: AC-2409's tests stand unchanged, and no production code changes.

The `code_frozen` block REPORT-11364 is **declined** (rung 1). The review it carries finds no production remediation needed. The historical misjudged override report-7519d965 has its consequence applied, and `code_frozen` is denied for that batch. This batch edits test files only.
