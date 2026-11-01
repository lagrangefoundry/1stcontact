---
uid: report-fddeb967
id: REPORT-7247
type: report
title: 'Report: fix_plan for STORY-141'
created_by: xgd
created_at: '2026-11-01T03:31:27.546704+00:00'
updated_at: '2026-11-01T03:42:26.703802+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: STORY-141
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately
    dependency_tests:
    - test_UAT_AC1690_
    - test_UAT_AC1691_
    - test_UAT_AC1692_
    - test_UAT_AC1693_
    - test_UAT_AC1694_
    - test_UAT_AC1695_
    - test_UAT_AC1696_
    - test_UAT_AC1697_
    - test_UAT_AC1698_
    - test_UAT_FC_REQ_173_
    hypothesis: sessionTextDescriber (apps/control-app/src/ai.ts:159-165) passes the
      digest instruction as `system:`/`source:` keys that @lagrangefoundry/ai's Role
      constructor (roles.js:711) silently drops, so the model request carries empty
      system content.
    instructions: 'AC1688/AC1689/AC1699 are already resolved: the iteration-1 builder
      deleted their stale pre-REQ-173 copies from tests/reconciliation-material-description.workers.test.ts,
      and the digest-era versions pass. Keep that edit, and keep those tests green.
      The remaining failure, AC2097, is a production defect in apps/control-app/src/ai.ts
      sessionTextDescriber. The Role is constructed with `system: DOCUMENT_DIGEST_SYSTEM`
      and `source: {...}`, which Role ignores. Replace them with a single priming
      entry, `priming: [new lib.Entry({ name: ''digest-system'', text: DOCUMENT_DIGEST_SYSTEM
      })]`, matching the reference state (reconcile-src-BUNDLE-34 ai.ts:297-304, BUG-63).
      Then the assembled system content equals DOCUMENT_DIGEST_SYSTEM exactly. Also
      fix the doc comment at ai.ts:123 (''No corpus and no priming'') so it says the
      one instruction is the only priming. Do NOT port the later describerSession/image-describer
      consolidation (REQ-207) or change backend registration. That work is outside
      this story. Do not touch the AC2097 test: it is correct as written.'
    test_scope: test_UAT_AC2097_ or test_UAT_AC1688_ or test_UAT_AC1689_ or test_UAT_AC1699_
      or test_UAT_AC1690_ or test_UAT_AC1691_ or test_UAT_AC1692_ or test_UAT_AC1693_
      or test_UAT_AC1694_ or test_UAT_AC1695_ or test_UAT_AC1696_ or test_UAT_AC1697_
      or test_UAT_AC1698_ or test_UAT_FC_REQ_173_
    ladder:
      rung1: REQ-173 and BUG-63 require the digest instruction to be the describer's
        only priming; no intent in scope says otherwise.
      rung2: 'At reconcile-src-BUNDLE-34, apps/control-app/src/ai.ts:297-304 builds
        the describer Role with priming: [new lib.Entry({name: ''digest-system'',
        text: system})] — the instruction reaches the model as the sole system content.'
      rung3: AC2097 stands as written; the code changes (decided at rung 2).
    override:
      rule: code_frozen
      rung: 2
      justification: AC-2097 requires DOCUMENT_DIGEST_SYSTEM to be the only system
        content. The reference state delivers it as the single priming Entry, while
        the frozen working-tree code passes `system`/`source` keys that the AI library's
        Role constructor drops, so production sends an empty system prompt. The test
        is right and the code is wrong.
      files:
      - apps/control-app/src/ai.ts
      tip_evidence:
      - file: apps/control-app/src/ai.ts
        lines: 297-304
      trust_boundary: false
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
`sessionTextDescriber` in `apps/control-app/src/ai.ts:159-165` builds its `lib.Role` with `system:` / `source:` keys, which the AI library's `Role` constructor (`@lagrangefoundry/ai/src/roles.js:711`) silently drops. The model request therefore has empty system content, and AC-2097 fails on `systemText(req).trim() === DOCUMENT_DIGEST_SYSTEM`.

## Analysis
- Three of the four listed failures are already resolved. They are the pre-REQ-173 copies of AC1688/AC1689/AC1699 in `tests/reconciliation-material-description.workers.test.ts`, which expected the body to be the document's own text. The iteration-1 builder (report-33e3d65f) deleted them. I confirmed in the working tree that that file no longer holds AC1688/AC1689/AC1699. The digest-era versions in `tests/reconciliation-material-description-digest.workers.test.ts` cover the same ACs and pass. The quality report (report-3ba098ae, commit 28d5fed) predates that edit. No AC change is needed.
- AC2097 is a real production defect, and the builder reported it as `blocked_by: code_frozen`. I checked the diagnosis:
  - The working tree `apps/control-app/src/ai.ts:159-165` passes `system: DOCUMENT_DIGEST_SYSTEM, source: {documents: () => []}`.
  - The library's `Role` constructor (`roles.js:711-723`) reads only `priming` (and similar keys), so the instruction is dropped.
  - The library exports `Entry` (`roles.js:106`, `{name, text, provider}`).
- At the reference state, `git show reconcile-src-BUNDLE-34:apps/control-app/src/ai.ts` lines 297-304 builds the describer role as `priming: [new lib.Entry({ name: 'digest-system', text: system })]`, with a BUG-63 comment: "the preamble is not a field but the first priming entry, and this role's priming is the whole of it". The user's running code delivers the digest instruction as the sole priming entry. That is exactly what AC-2097 asserts.
- A later bundle commit (BUG-63 / the describerSession consolidation) fixed this, and the current cherry-pick point does not include it yet. The builder must port only the priming fix, not the later `describerSession` / image-describer consolidation (REQ-207), which is outside this story's commit.
- I found no cross-suite contamination, no conflicting ACs and no isolation issue.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-173_describer_session.test.ts::test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else — weak-observation — it asserts `toContain(DOCUMENT_DIGEST_SYSTEM)`, but its name promises "nothing else". Tighten it to equality on the trimmed system text, as AC2097 does.
- tests/reconciliation-material-description.workers.test.ts (pre-digest file) — infra-reuse-gap — it duplicates the AC1690–AC1698 scenarios that the digest-era file also covers under the same AC numbers. A later reconciliation should retire the duplicates so that only one UAT per AC remains.

## Batches
One batch. It holds AC2097, the only real failure, plus the digest-era AC1688/AC1689/AC1699 tests and the REQ-173 describer-session FC tests as blast radius, because all of them go through `sessionTextDescriber`. The fix is one hunk in one production file.

## Mode overrides (REQ-892)
- Batch 0 — rule `code_frozen`, rung 2. Files: `apps/control-app/src/ai.ts`. Justification: AC-2097 requires the digest instruction to be the only system content. The reference state (`ai.ts:297-304` at reconcile-src-BUNDLE-34) delivers it as the single priming `Entry`, while the frozen working-tree code passes keys the library ignores. The test is right and the code is wrong. tip_evidence: `apps/control-app/src/ai.ts` 297-304. trust_boundary: false. Dependency tests: AC1688–AC1699 and the `test_UAT_FC_REQ_173_` suite, the other consumers of `sessionTextDescriber` (through describe.ts and router.ts).

## Resolution ladder (REQ-938)
- Batch 0: decided at rung 2.
  - Rung 1: REQ-173 (the describer intent) and BUG-63 both require the digest instruction to be the describer's only priming, and no intent in scope says otherwise.
  - Rung 2: at reconcile-src-BUNDLE-34, `apps/control-app/src/ai.ts:297-304` builds the role with `priming: [new lib.Entry({ name: 'digest-system', text: system })]`.
  - Rung 3: AC2097 stands as written, and the code changes to satisfy it.