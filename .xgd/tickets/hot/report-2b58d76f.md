---
uid: report-2b58d76f
id: REPORT-1697
type: report
title: 'Sprint Review: Sprint 2'
created_by: xgd
created_at: '2026-08-08T01:56:51.565642+00:00'
updated_at: '2026-08-08T01:56:51.565642+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sprint_review
  subject_uid: sprint-a864c33e
---


# Sprint Review — Sprint 2

**Status**: PASS
**Intent**: bug-5cabb340 (BUG-32 — Rebranding gap: WEBUI_SCOPE still resolves the superseded scope)
**Story**: story-e674c60a (STORY-99, upgrade, CAP-85) — sole story, delta AC-1030

## Summary

Sprint 2 had exactly one job: close the single gap Sprint 1's review left open (report-a7535647,
Gap 1) — the main-checkout resolution anchor at `tools/generate/src/cli/webui.ts:70-101` was
load-bearing net-new production code carrying no acceptance criterion and no test, so three of its
five branches were unexecuted and its coverage was an accident of the checkout the suite ran in.
The sprint delivers AC-1030 (`acceptance_criterion-1b27e14b`) and one new suite,
`tests/reconciliation-component-resolution-anchor.test.ts` (385 lines, 5 UATs). I verified this by
execution and by mutation, not by reading the quality report.

The delivery matches the corrective item exactly and honours every execution constraint. The sprint
diff over `d21c8012a..HEAD` is **one test file plus ticket state** — no production file is touched,
which is what the `reconciliation`-shaped, tests-only constraint required. The four `.git`-shape
UATs run against temporary fixture trees under `os.tmpdir()`, so the evidence is checkout-independent
rather than provable only in the linked worktree the runner happens to sit in. Nothing stands in for
the resolver: `plantResolver()` copies the shipped `webui.ts` byte-for-byte and asserts the copy is
identical (`:104-107`), then runs it in a real `node` child process, so the anchor logic under test
cannot drift from production. Fixtures stand in only for checkout *shapes* and for distinguishably
tagged stand-in stores — precisely what AC-1030's Verification section authorises — and the fifth
UAT asserts the real-installation equality against the unsubstituted store.

## Verification performed

**Executed the evidence set in this worktree** (not taken from the report):

```
vitest run tests/reconciliation-component-resolution-anchor.test.ts \
           tests/bug32-webui-scope-rebrand.test.ts \
           tests/reconciliation-builder-workspace-origin.test.ts \
           tests/reconciliation-builder-workspace-chrome.test.ts
→ Test Files 4 passed (4) | Tests 26 passed (26), 0 skipped
```

All five AC-1030 UATs **ran** — none skipped (verbose run confirms 5 passed / 0 skipped), including
the real-installation one.

**Mutation-tested the new evidence** — the question a passing test cannot answer is whether it
discriminates. I disabled the anchor (`mainCheckout()` → return the walk origin unconditionally) and
re-ran:

| Scope | Result under a broken anchor |
|-------|------------------------------|
| AC-1030 suite alone | 3 failed, 1 passed, **1 skipped** |
| Full evidence set | **6 failed**, 11 passed, 9 skipped |

The three fixture UATs that should discriminate do discriminate, by name and with the marker
assertion naming the wrong anchor location. `no_repository_data_anchors_to_the_walk_origin` correctly
still passes — that shape's expected answer *is* the walk origin, so the mutation is a no-op for it,
not a hole. Alongside them, AC-960, AC-961 and AC-963 go red loudly. The evidence is real.

**Independently re-verified the intent's central claims** (regression mode):

- `git grep` for the superseded scope over tracked files outside `.xgd/**` → **zero hits**
- `git ls-files index.html` → **empty** (deleted, not updated — as the intent decided)
- exactly one scope literal in the tree: `tools/generate/src/cli/webui.ts:104`

**Full suite**: `6 failed | 1232 passed | 67 skipped (1305)`. The six are the same six Sprint 1's
review documented (`reconciliation-copy-edit-gesture-modal` ×5, `req115-builder-composition` ×1),
already filed as BUG-33 (`bug-ede1fb8c`) with the root cause traced. **No new failure.** Sprint 1
measured 1226 passed / 1299 total; the +6 is the sprint's new tests plus one arriving with
`sync_main`, with the red set unchanged.

## Intent Fidelity

| Aspect | Status | Notes |
|--------|--------|-------|
| Problem addressed | PASS | AC-1030 asserts the anchor by name and by shape; the equality a linked worktree and the main checkout must satisfy is now stated and tested, not incidental. |
| Key behaviors present | PASS | All four `.git` shapes AC-1030 enumerates have a dedicated UAT: `.git` a directory, `.git` a pointer with `commondir`, a pointer without `commondir`, and no repository data at all. |
| Design decisions respected | PASS | The linked-worktree fixture is built by real `git init` + `git worktree add` (`:244-246`), so it cannot encode an assumption git does not share; the real-installation UAT builds its pointer by hand deliberately, to avoid mutating repository state concurrent workflow processes read (`:338-344`). |
| Constraints honored | PASS | **Tests-only**: sprint diff is `tests/reconciliation-component-resolution-anchor.test.ts` + `.xgd/tickets/**` and nothing else — no runtime change, as `reconciliation` shape demanded. **No mocking of the resolver**: shipped file copied and byte-compared, run in real `node`. **Regression set green**: 24 → 29 scoped tests, 0 failed, 0 skipped. |
| Evidence checkout-independent | PASS | Every shape is a `mkdtemp` fixture; `no_repository_data` even asserts its own precondition (`repositoryDataAbove(root)` is null, `:314-317`) so the fixture fails loudly rather than passing vacuously if tmpdir ever sat under a checkout. |
| Evidence validity | PASS | No repository-owned code mocked. Non-vacuity is asserted per shape: a decoy store is planted at every rival anchor location and its existence checked after the fact, so landing on the right one is a decision, not the only option. |
| Evidence discriminates | PASS | Mutation-verified above — a broken anchor turns 6 tests red across the evidence set. |
| No goalpost movement | PASS | Diff of AC-1030 and STORY-99 over the sprint is status transitions only (`pending`→`active`, `planned`→`completed`); no criterion text was softened to fit the implementation. |

## Observations (not corrective items)

- **`it.skipIf(!WEBUI_INSTALLED \|\| !GIT_COMMON_DIR)` on the fifth UAT
  (`reconciliation-component-resolution-anchor.test.ts:332`) degrades to *skip* under the very defect
  it guards.** The mutation run showed it: break the anchor, resolution fails, `WEBUI_INSTALLED` goes
  false, and `linked_working_tree_and_main_checkout_consume_the_identical_copy` skips instead of
  failing. That is the silent-green shape BUG-32 exists to close, appearing one level down — and it is
  worth recording, because Sprint 1's review had explicitly noted "no `skipIf` appears in the new
  suite" as a property of the delivery.

  It is **not** a sprint-level gap, for three reasons I checked rather than assumed. (1) AC-1030's own
  text sanctions it: "A failure to resolve after anchoring remains an environment precondition … and is
  read as such, not as a defect in this behaviour." (2) The compensating assertion exists and is
  unconditional — `reconciliation-builder-workspace-origin.test.ts:442` asserts
  `expect(WEBUI_INSTALLED).toBe(true)` as an outcome, so an absent or misresolved store fails AC-961
  loudly; the mutation run confirms AC-961 goes red, not skipped. (3) The four fixture UATs carrying
  the anchoring claim are unconditional and were shown to discriminate. So the sprint's evidence
  **collectively** cannot report green on a broken anchor, which is the property that matters. The UAT
  retains real power for the regression class where a wrong anchor still resolves to an existing store
  — there the equality assertion goes red.

- **`walkOrigin()`'s `catch` branch (`webui.ts:93-96`) remains unexecuted.** Sprint 1's review counted
  it as the fifth branch. It is the bundler-inlined `import.meta.url` fallback, it is two lines, and
  AC-1030 enumerates four checkout shapes and does not claim it — so it is outside the corrective
  item Sprint 1 specified and outside this sprint's declared delta. Recording it so it is not
  rediscovered as a surprise; it does not warrant a story.

- **Story-level quality scoping is correct and is not a gap.** report-3d1c4abe / report-c4bd0013
  filtered to `test_UAT_AC959`…`AC1030` with `deselected: 1276` — AC-scoped by design. Its 29 selected
  tests reconcile with the 26 I ran across the four evidence files plus the AC-1029/AC-966 tests living
  outside them.

## Completeness

No stories remain for this intent: `status=unplanned` and `status=planned` queries for
`fields.intent_uid=bug-5cabb340` both return nothing. The intent must therefore be fully satisfied at
the end of this sprint, and it is — Sprint 1 delivered the rebrand (scope written once, every
generated reference composed from it, superseded literal in no tracked file, silent-green skip
removed), Sprint 2 delivered the one evidence gap that review left open. All 22 of STORY-99's ACs are
active and covered.

## Conclusion

Sprint 2 faithfully implements its portion of the intent. The single corrective item Sprint 1's review
raised is closed exactly as specified, by checkout-independent evidence that mutation-testing confirms
discriminates, with no runtime code change and no goalpost movement. No gaps or distortions found.
