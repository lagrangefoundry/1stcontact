---
uid: comment-0e75df90
id: COMMENT-624
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-08-03T05:19:38.909428+00:00'
updated_at: '2026-08-03T05:19:38.909428+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-38d9fdde
  kind: note
---

## Batch 0 assessment — both failures resolved, no new edits required

### Diagnosis

Neither AC-742 nor AC-748 was a missing-test or stale-matrix problem. Both had **passing tests all along**; the AC coverage gate simply failed to credit them.

`xgd_source/quality/ac_coverage_gate.py` credits an AC by running `extract_ac_id_from_test_name()` over each passing test's **full** name (describe chain + test name). That function does `re.search(r"ac[-_]?(\d+)", …)` — **first match wins**.

At the time of the failing report (`report-8e246bc9`, "Scoped quality: fail (117 tests, 0 failed, 2 orphan AC(s))"), the recorded names were:

```
passed | AC-741 / AC-742 — fonts as painted test_UAT_AC742_no_visible_run_is_measured_against_a_fallback_face
passed | AC-747 / AC-748 — section geometry and scrims test_UAT_AC748_a_translucent_veil_is_recorded_as_a_colour_with_its_opacity
```

The AC id in the shared `describe` title matched first, so both tests were credited to **AC-741** and **AC-747**. AC-742 and AC-748 got zero credit and were reported as orphans — while the report simultaneously showed 117 tests, 0 failed. Two ACs sharing one describe block is what made it possible for the first to shadow the second.

This is category (1) — stale *test-side* expression of the contract, not a production bug and not a stale AC. The implementation and the criteria are both correct; only the naming shape was wrong.

### Fix

Already landed by the prior invocation of this prompt, commit `7011037fe` (`tests/reconciliation-capture-recording-contract.test.ts`):

```diff
-describe('AC-741 / AC-742 — fonts as painted', () => {
+describe('fonts as painted', () => {
-describe('AC-747 / AC-748 — section geometry and scrims', () => {
+describe('section geometry and scrims', () => {
```

Each test's own name is now the sole AC link, so a block covering two ACs cannot shadow the second. No assertion was weakened — the test bodies are untouched, and the ACs remain `active` (correctly: they are genuinely covered).

### Verification (all run this turn, output read)

| Check | Result |
|---|---|
| `vitest run tests/reconciliation-capture-recording-contract.test.ts` | **12 passed / 12**, incl. AC742 & AC748 |
| `check_active_ac_coverage(story_uid=story-244827df)` | `passed: True`, 12 active, **0 orphans** |
| `check_active_ac_coverage(intent_uid=bundle-4ff83a8b)` | `passed: True`, 171 active, **0 orphans** |
| Shadowing scan over all 117 report test names | **0 shadowed** — no other AC is at risk |
| `xgd quality run --test-filter-expression "AC-742 … or AC-748 …"` | **SUCCESS** (empty scope — the orphan pseudo-names match no real test, as expected) |

No edits were needed; the working tree is clean.

### Out-of-batch finding (not fixed — reporting, not silently dropping)

The full collection pass surfaced one unrelated failure:

`tests/bug17-fold-padding.test.ts:116` → `test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding`
```
ENOENT: storage/references/gigabytealchemy.ai/index/multistate.json
```

`/storage/references/` is **gitignored** (`.gitignore:146`), so this test reads a local, untracked capture artifact that does not exist in a fresh reconcile worktree. It is environment-dependent and fails here regardless of this batch. It is pre-existing (arrived with free-coded commit `7d918ec42`), unrelated to AC-742/AC-748, and outside this batch's scope — so I left it alone per instruction 7. Note it is also still an `FC_`-named orphan test, which reconcile's FC orphan gate will need to rename or delete. Sibling files (`req90-`, `req92-`, `req91-`, `req22-`) read the same directory and should be checked for the same guard gap when that is addressed.
