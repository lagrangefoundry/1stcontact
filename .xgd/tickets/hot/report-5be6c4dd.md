---
uid: report-5be6c4dd
id: REPORT-3950
type: report
title: 'Reconciliation Review: commits (BUNDLE-26)'
created_by: xgd
created_at: '2026-09-11T06:59:30.948246+00:00'
updated_at: '2026-09-11T06:59:30.948246+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-87be4669
  anchor_uid: bundle-87be4669
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: —
**Anchor**: bundle-87be4669 (BUNDLE-26)
**Stories Reviewed**: 17 (16 distinct UIDs; story-7f437d57 is item 15's second target)

The failure is **not** in the stories. Story fidelity, coverage and plan-item
accounting all pass, and pass well. The failure is Step 5b, and its cause is
structural: **the implementation these stories document is not on this branch.**
Sixteen of seventeen plan items were reconciled against code that does not
exist in `HEAD`, so their UATs cannot be evidence of anything — two whole
suites cannot even resolve their imports.

---

## The finding, stated plainly

Of the twelve commits the bundle names, **none of the seven behaviour-bearing
ones is an ancestor of `HEAD`**:

| Intent | Commit | On this branch? |
|---|---|---|
| REQ-164 | `858d63202f` | **ABSENT** |
| REQ-165 | `52fd6302cc` | ABSENT as this sha — but the same work is present via `ba7171356d` / merge `97244b5e67` |
| REQ-159 | `21e6d142d5` | **ABSENT** |
| REQ-163 | `548c053deb` | **ABSENT** |
| REQ-161 | `855dd57a7c` | **ABSENT** |
| REQ-158 | `d4d50859a2` | **ABSENT** |
| REQ-167 | `61a0becc61` | **ABSENT** |

Corroborating, independently:

- `bundle-87be4669.fields.commits[]` carries `reconcile_sha: null` on **all
  twelve** entries — the cherry-pick recorded nothing as landed.
- `git log --oneline main..HEAD | grep FREE-CODED` returns exactly **one**
  commit: `aed219dbdf chore: bump version to 0.2.31 for REQ-165`.
- `git diff --stat main HEAD -- apps tools packages db kb` shows
  `kb-projection.ts` (+865) and `kb.ts` (+201) and **nothing else from this
  bundle**.

### Ten modules the reconciliation UATs import do not exist

Verified with `git ls-files` and `git cat-file -t HEAD:<path>`:

```
apps/control-app/src/material.ts          apps/control-app/src/knowledge.ts
apps/control-app/src/describe.ts          apps/control-app/src/system-knowledge.ts
apps/control-app/src/fetch-guard.ts       apps/control-app/src/builder/library.js
apps/control-app/src/identity.ts          apps/control-app/src/builder/upload.js
tools/generate/src/cli/kb-model.ts        db/migrations/0004_identity.sql
```

And REQ-164's own change never landed: `tools/generate/src/cli/kb.ts:187-199`
still defines `INCLUDE_FIELD = 'system_kb'` and `optedIn()`, line 325 still
gates membership on it, and line 544 still declares
`corpus: { type: ['doc'], 'fields.system_kb': true }` — the exact predicate
plan item 1 says was replaced by `corpus: {}`.

### The quality gate never noticed because it never ran anything

**All 19** `Scoped quality` reports produced during this reconcile are titled
`Scoped quality: pass (0 tests, 0 failed)`. Not one test was executed at any
point in the story cycle. The tip commits (`36571ca289 xgd(test_fix): done`,
`cadcb6afd9 Workflow test_fix_quality_check completed: done`) rest on those
zero-test passes.

---

## Behavior Inventory

**~110 behaviours** were inventoried from the seven intent bodies and their
"What landed" records (the plan's own inventory, re-read against the intents).
**The code for ~105 of them could not be read on this branch**, because the
files that implement them are absent. Only the REQ-165 projector
(`tools/generate/src/cli/kb-projection.ts`, 865 lines) and the REQ-165 half of
`kb.ts` were available to read.

This is itself a review finding: Step 2 of this review ("read the code
independently") was **not performable** for six of seven intents.

---

## Coverage Map

Coverage below is assessed against the **intent**, which is readable, and
against the **stories**, which are readable. The code column is what could not
be verified.

| # | Plan item / behaviour | Story | Story coverage | Evidence (Step 5b) |
|---|---|---|---|---|
| 1 | System KB corpus selection — membership is `doc_kind`, unrestricted corpus, exhaustive listing, visible short corpus (REQ-164) | story-c4f329d3 | Covered | **FAIL** — `reconciliation-system-knowledge-base.test.ts`: 17 of 18 tests fail. AC-1632 fails `expected {type:['doc'],'fields.system_kb':true} to deeply equal {}`; AC-1633 fails `expected 50 to be 60` (no `--no-limit`) |
| 2 | Projected reference (REQ-165) | story-5836022a | Covered | **PASS** — `reconciliation-projected-reference.test.ts` green; the code is present |
| 3 | KB bundle emission (REQ-158) | story-c4f329d3 | Covered | **FAIL** — `reconciliation-system-knowledge-base-packed.test.ts` 3/3 fail (AC-1647, AC-1648, AC-1649); `kbBundle`/`writeKbShim` absent |
| 4 | System KB in the deployed conversation (REQ-158) | story-a58a0974 | Covered | **FAIL** — `reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts` imports absent `system-knowledge.ts`; neighbouring `reconciliation-assistant-conversation-knowledge.test.ts` AC-1317/1318/1319/1320 all fail |
| 5 | Project KB corpus & index (REQ-159) | story-5281f009 | Covered | **FAIL** — `reconciliation-client-knowledge-base.test.ts` 3/3 fail (AC-1654, AC-1658, AC-1659); `.workers` half imports absent `knowledge.ts` |
| 6 | Project KB triggers & landscape (REQ-159) | story-ea7b4646 | Covered | **FAIL** — `reconciliation-client-knowledge-clocks.workers.test.ts` imports absent `knowledge.ts` |
| 7 | Material ingestion pipeline (REQ-163) | story-6ccaedd5 | Covered | **FAIL** — `reconciliation-material-ingestion.workers.test.ts` imports absent `material.ts`, `knowledge.ts` |
| 8 | Material description (REQ-163) | story-4cabde9a | Covered | **FAIL** — `reconciliation-material-description.workers.test.ts` imports absent `describe.ts` |
| 9 | Guarded fetch (REQ-163) | story-77f8fc9e | Covered | **FAIL** — `reconciliation-guarded-fetch.workers.test.ts` imports absent `fetch-guard.ts` |
| 10 | Site-asset promotion gate (REQ-163/161) | story-aacb7060 | Covered | **FAIL** — `reconciliation-site-asset-promotion.workers.test.ts` imports absent `material.ts` |
| 11 | The Library tab (REQ-161) | story-1500b111 | Covered | **FAIL** — `reconciliation-library-tab.test.ts` reports `Failed to resolve import "../apps/control-app/src/builder/library.js"`; 0 tests collected |
| 12 | The drop-to-upload overlay (REQ-161) | story-325da65f | Covered | **FAIL** — `reconciliation-upload-overlay.test.ts` reports `Failed to resolve import "../apps/control-app/src/builder/upload.js"`; 0 tests collected |
| 13 | Material field vocabulary (REQ-163/161) | story-e07c589b | Covered | **FAIL** — `reconciliation-material-types.workers.test.ts` imports absent `material.ts` |
| 14 | Blob addressing (REQ-161) | story-a7a12d81 | Covered | **PARTIAL** — the node half (`reconciliation-material-blob-storage.test.ts`, AC-1489/AC-1490, wrangler declarations) passes. The half that carries the actual restatement — AC-1488 addressing by attachment uid — is in the `.workers` suite and imports absent `material.ts` |
| 15 | Workspace criteria vs the declaration (REQ-161) | story-e674c60a, story-7f437d57 | Covered | **PASS with a caveat** — `reconciliation-builder-workspace-chrome.test.ts` and `reconciliation-builder-assistant-pane.test.ts` both green. But the restated AC-959/976/1064 are stated over the declaration precisely so a *second* declared tab cannot falsify them, and the Library tab that would exercise that is absent; they currently pass over a one-tab declaration, which is the configuration the old proxies also passed on |
| 16 | Identity: invite and admission (REQ-167) | story-7b1025b8 | Covered | **FAIL** — `reconciliation-identity-invite-and-admission.workers.test.ts` imports absent `identity.ts`; `db/migrations/0004_identity.sql` absent |
| 17 | The Access gate's verdict (REQ-167) | story-182e8cb9 | Covered | **FAIL** — `reconciliation-builder-private-access-verdict.test.ts` 1/1 fails: `test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no` (`guardAccess` still returns a boolean) |

### Suites executed, verbatim results

Workerd suites cannot be executed in this environment — `npm test -- tests/reconciliation-identity-invite-and-admission.workers.test.ts`
dies with `Error: listen EPERM: operation not permitted 127.0.0.1` before any
test runs. That is a sandbox property, **not** evidence about the code. Their
failure is established statically instead: every one of them imports at least
one module that `git cat-file -t HEAD:<path>` reports does not exist.

Node-project suites were run and their output read:

```
reconciliation-projected-reference.test.ts          PASS
reconciliation-material-blob-storage.test.ts        PASS
reconciliation-builder-workspace-chrome.test.ts     PASS
reconciliation-builder-assistant-pane.test.ts       PASS
reconciliation-library-tab.test.ts                  FAIL  (0 tests — unresolvable import)
reconciliation-upload-overlay.test.ts               FAIL  (0 tests — unresolvable import)
reconciliation-client-knowledge-base.test.ts        FAIL  3/3
reconciliation-system-knowledge-base-packed.test.ts FAIL  3/3
reconciliation-builder-private-access-verdict.test.ts FAIL 1/1
reconciliation-system-knowledge-base.test.ts        FAIL  17/18
reconciliation-assistant-conversation-knowledge.test.ts FAIL 4/4
```

Aggregate for the two runs covering the bundle's node half: **28 failed,
34 passed**, plus two suites that collected zero tests.

---

## What the stories get right

Recorded because the fix loop must not be pointed at them.

- **All 145 acceptance criteria on disk have a named `test_UAT_AC{N}_*`
  function.** Cross-referencing every `^id: AC-` in `.xgd/tickets/hot/` against
  every `test_UAT_AC[0-9]+` in `tests/` leaves an empty difference. The
  AC↔UAT mapping is structurally complete; the UATs simply cannot run.
- **All 17 stories carry a `## Reconciliation Decisions` section.** Every
  intent-silent behaviour formalized into an AC is recorded there as a dated
  decision with its reason, not left as an unattributed claim.
- **Every supersession the intents declare is flagged, not absorbed.**
  Spot-checked and confirmed on the four that matter most:
  - story-6ccaedd5 records that REQ-163's *"the same file uploaded twice yields
    one blob"* is withdrawn because REQ-161 — a later intent in the same bundle
    — removed content addressing, and states which properties survive.
  - story-a7a12d81 restates AC-1488, removes the dedup clause as false, keeps
    the cross-account isolation half, and marks the 2026-09-01 decision it
    supersedes rather than deleting it.
  - story-182e8cb9 restates AC-1375/1376/1380 as the gate's verdict rather than
    the served response, and explicitly declines to widen AC-1376 for the
    automation identity — naming the boundary instead.
  - story-c4f329d3 carries the boolean→`doc_kind` membership change.
- **No invented behaviour was found** in the stories sampled. Every claim read
  traces to an intent sentence or to a recorded reconciliation decision.
- **No absorbed divergence was found.** Where code and intent disagree (the
  dedup clause, the blob-first ordering, the six description statuses), the
  story names the disagreement and says which side wins and why.

---

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|---|---|---|
| 1. System KB corpus selection | story-c4f329d3 | ✓ |
| 2. Projected reference | story-5836022a (STORY-137) | ✓ |
| 3. KB bundle emission | story-c4f329d3 | ✓ |
| 4. System KB in the deployed conversation | story-a58a0974 | ✓ |
| 5. Project KB corpus & index | story-5281f009 (STORY-138) | ✓ |
| 6. Project KB triggers & landscape | story-ea7b4646 (STORY-139) | ✓ |
| 7. Material ingestion pipeline | story-6ccaedd5 (STORY-140) | ✓ |
| 8. Material description | story-4cabde9a (STORY-141) | ✓ |
| 9. Guarded fetch | story-77f8fc9e (STORY-142) | ✓ |
| 10. Site-asset promotion gate | story-aacb7060 (STORY-143) | ✓ |
| 11. The Library tab | story-1500b111 (STORY-144) | ✓ |
| 12. The drop-to-upload overlay | story-325da65f (STORY-145) | ✓ |
| 13. Material field vocabulary | story-e07c589b | ✓ |
| 14. Blob addressing | story-a7a12d81 | ✓ |
| 15. Workspace criteria vs the declaration | story-e674c60a, story-7f437d57 | ✓ |
| 16. Identity: invite and admission | story-7b1025b8 (STORY-146) | ✓ |
| 17. The Access gate's verdict | story-182e8cb9 | ✓ |

**17 of 17 plan items produced a story. Nothing was dropped.** Step 6 passes.

A related observation the plan anticipated and that did not hold: the plan
recorded that eleven of the twelve FC suites would "arrive with the outer
reconcile's cherry-pick". They did not arrive. The only FC suite ever on this
branch was `test_UAT_FC_REQ-165_projected_reference.test.ts`, and `8b4ccec650`
renamed it to `tests/reconciliation-projected-reference.test.ts` exactly as
designed. `check_fc_orphans` therefore had nothing to rename for the other
eleven — it had no orphans because it had no files.

---

## Judgment Calls

- **The story work is not what failed, and the fix loop must not rewrite it.**
  Under the materiality test, a developer reading these stories would come away
  with an accurate picture of what the operator intended to build across all
  seven intents. Steps 4 and 6 pass. Sending `fix_reconciliation_review` at the
  story bodies would degrade work that is already correct.
- **Item 15 is scored PASS despite the caveat.** The restated AC-959/976/1064
  are stated over the declaration rather than over a tab count, which is the
  claim the intent asked for, and they pass. That the second declared tab which
  would exercise the restatement is absent is a consequence of the same missing
  code, not a defect in the criteria.
- **Item 14 is scored PARTIAL rather than FAIL.** Its node half genuinely
  proves a real deployment claim (two distinct object stores, restated on both
  wrangler halves, mutation-tested) and passes. Only the addressing
  restatement — the item's substance — is unreachable.
- **Workerd suites are not scored on an execution failure.** `EPERM: listen
  127.0.0.1` is this sandbox, not the code. They are scored on the static fact
  that their imports do not resolve against `HEAD`, which is independent of
  whether a runner is available.
- **The 0-test quality reports are reported as a finding, not assumed benign.**
  Nineteen consecutive `pass (0 tests, 0 failed)` verdicts are what allowed a
  fully unevidenced matrix to reach this review.

---

## Verdict

**FAIL.**

Not for coverage gaps and not for fidelity: the stories faithfully and
completely document what the operator intended across REQ-164, REQ-165,
REQ-158, REQ-159, REQ-163, REQ-161 and REQ-167, every plan item produced
output, every supersession is flagged, and every AC has a named UAT.

It fails Step 5b, comprehensively. **Sixteen of seventeen plan items were
reconciled against an implementation that is absent from the reconcile branch.**
Ten source modules and one migration that the reconciliation UATs import do not
exist in `HEAD`; REQ-164's change to `kb.ts` never landed; none of the seven
behaviour-bearing bundle commits is an ancestor of `HEAD`; and
`fields.commits[].reconcile_sha` is null on all twelve. Twenty-eight of the
bundle's runnable node-half UATs fail and two suites collect zero tests. The
remaining suites cannot pass — not because they are weak, but because the code
under test is not here.

### What must happen, and it is not a story edit

This is a branch-state failure, and `fix_reconciliation_review` — which edits
stories, ACs and UATs — **cannot repair it**. Re-entering the story fix loop
against this report will burn cycles on artefacts that are already correct.

The required repair, in order:

1. **Land the bundle's code on `reconcile-BUNDLE-26`.** The cherry-pick of
   `858d63202f`, `21e6d142d5`, `52fd6302cc`, `548c053deb`, `855dd57a7c`,
   `f6c1366410`, `d4d50859a2` and `61a0becc61` either never ran or landed
   nothing. `fields.commits[].reconcile_sha` being null on every entry is the
   signal to check first.
2. **Re-run the scoped quality gate and confirm it collects a non-zero test
   count.** A `pass (0 tests, 0 failed)` verdict must be treated as a failure of
   the gate, not a pass of the code; nineteen of them in a row is how this
   reached review.
3. **Re-run this review** once the suites actually execute. Only then can any
   statement be made about whether these UATs are sufficient evidence — at
   present the question is unanswerable, because nothing has been observed.

Recommend surfacing to the operator rather than looping: per the workflow's own
constraint, a fix loop capped by `watchdog.max_fix_cycles` has no move available
that changes this outcome.
