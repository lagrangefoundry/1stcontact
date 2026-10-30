---
uid: report-b1dadb75
id: REPORT-6136
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:23:13.231718+00:00'
updated_at: '2026-10-04T23:23:13.231718+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — pick 52fd6302cc (REQ-165 projected reference)

Pick: `52fd6302cc` `feat(kb): projected reference — the product's own facts, generated [FREE-CODED]` (2026-08-31 16:00).
HEAD `beaaae517b`, apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`, retry count 1, prior_stage_failure empty.

## Outcome: pick already integrated — zero net change

HEAD already carries REQ-165 through the replayed `4573b1ee81 Merge branch 'free-REQ-165' into xgd-working`.
The pick's three cleanly-applied paths (`kb-projection.ts`, `test_UAT_FC_REQ-165_projected_reference.test.ts`,
`packages/framework/src/modules/index.ts`) are byte-identical to HEAD (`git diff --stat CHERRY_PICK_HEAD HEAD` is empty for them).

| Path | Resolution | Evidence |
|---|---|---|
| `package.json` | ours | base .20 / theirs .21 / ours .40. .21 is retired; the next pick, `c056002a52` (.21→.22), already resolved `--ours` (REPORT-6096). The higher value comes from xgd-working bumps already replayed onto this branch, not from main. |
| `tools/generate/src/cli/kb.ts` | ours | Every added line of the pick is in HEAD (`writeProjections`, `projectedDocument`, `projected` in `kbStatus`), except `SYSTEM_KB_DOC_KIND` and its docblock. That constant is absent at the apply target too: incoming's own lineage replaced it with REQ-164's `DOC_KIND_FIELD` / `doc_kind: system_kb` (see `bf817873a2`, "drop the duplicate doc_kind declaration left by the merge"). |
| `tools/generate/src/cli/index.ts` | ours | All of the pick's lines are in HEAD. The two that do not match exactly appear in a later form: the `writeProjections` import is now a multi-line import list, and the status line reads `corpus: ${exported} exported + ${s.projected} projected`. |
| `tests/reconciliation-system-knowledge-base.test.ts` | ours | The pick's `binding.kb.description` assertion (HEAD l.850) and its `projected: 0` fields in the `kbStatus` expectations (l.940/960/975) are in HEAD, in the later `toMatchObject` + `tickets` form. |
| `tests/test_UAT_FC_REQ-123_system_kb.test.ts` (DU) | `git rm` | HEAD's `671a09196f` deliberately retired this suite as a duplicate of the AC-traceable file ("All fifteen of its scenarios verify AC-1291..AC-1306 in the same shape"). That is a legitimate consolidation, not churn. The pick's only change to the file is the `prompt`→`description` assertion fix, and that already lives in the surviving suite. Note that the file still exists at the apply target, so later picks that touch it will hit the same DU and should get the same `git rm`. |

The enrichment's "take the more recent by timestamp" rule does not apply: the ours-side commits are xgd-working work replayed later, and every incoming hunk is already present.
Nothing is left for post-merge review.

`git status --porcelain` is empty, `git diff --cached --stat HEAD` is empty, CHERRY_PICK_HEAD is intact, and HEAD has not moved.
No tests were run because there is no net change.
