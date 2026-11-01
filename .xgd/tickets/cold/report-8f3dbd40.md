---
uid: report-8f3dbd40
id: REPORT-955
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-24T22:42:57.940385+00:00'
updated_at: '2026-07-24T22:42:57.940385+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-84af044b
  plan_item_index: '1'
---

All mutations applied and auto-committed. No runtime code touched, no new story created.

## ⚠️ The plan under-reported one thing — I verified it and recorded it

The plan's observation said *"no `'capability'` **discriminant** remains, which holds"* and dismissed the test-file residue as cosmetic. It does not hold, and it is not cosmetic:

**`tests/reconciliation-capability-modules.test.ts` is STORY-85's own reconciliation UAT file — carrying the UATs for all eight of this story's ACs (AC-697…AC-704) — and it does not load.** It still imports `validateCapability*` / `CapabilityMeta` from `packages/framework/src/modules/capability`, a path deleted by the `git mv`. Verified this session:

```
FAIL tests/reconciliation-capability-modules.test.ts (0 test)
Error: Cannot find module '../packages/framework/src/modules/capability'
```

Two fixtures inside it also still author `kind: 'capability'` (lines 83, 454). This is the **same class of miss as item 2's AC-682 fixture** — the file is 24 Jul matrix work, the rename commit is 21 Jul, so the grep-driven sweep never saw it. The plan caught the pattern for STORY-83 but not for STORY-85, its own item-1 story.

Consequence: the `uat_coverage: pass` marking on all eight ACs is **stale** — none of those UATs currently execute. I recorded this as a "Known UAT defect" section in the story's Technical Context so the downstream UAT stage repairs it (test-only: imports → `modules/behavior`, identifiers → `Behavior*`, fixture discriminants → `kind: 'behavior'`). I did not touch `uat_coverage` — that field is system-computed, and I'd rather it be recomputed after the repair than guessed at here.

## Mutations applied

**CAP-72** retitled → *Behavior Module Contract & Catalog*, body restated, with a note that "capability" now names only the matrix.

**STORY-85** retitled → *Behavior modules: vetted core + typed config + L1 presentation slots*, `story_kind: feature → upgrade`. Body restated in the renamed vocabulary; every behavioural obligation preserved verbatim. Added to Technical Context: the `Behavior*` published surface, the no-back-compat-alias rule, the deliberate `capabilities.js` non-change, and the UAT defect above. Out-of-scope line now explicitly cedes the L1 slot leaf's renamed field to STORY-83, so item 2 doesn't collide.

**ACs modified (5):** AC-697 and AC-704 retitled + rebodied; AC-702 retitled, and its body now states outright that `capabilities.js` is deliberately unchanged so a later reader doesn't "complete" the rename and break the page reference; AC-698 and AC-703 body prose only, titles unchanged as planned.

**AC added (1):** AC-722 — pins the `Behavior*` published surface, the atomic `kind: 'behavior'` discriminant across the catalog, and the absence of any back-compat alias. Absorbs the two passing FC tests. Written against the package-root contract (a published artifact interface), not internal file paths.

AC-699/700/701 I checked and left alone — zero `capability` mentions, no change warranted.

```
Upgrade mutations applied for plan item 1 of 2

Target Stories: story-179b8c06
Primary Story UID: story-179b8c06
Stories Modified: 1  (+1 capability bucket retitled)
ACs Modified: 5
ACs Added: 1
ACs Removed: 0

tickets_modified:
  capabilities:
    - "capability-ce902be4"
  stories:
    - "story-179b8c06"
  acceptance_criteria:
    modified: ["acceptance_criterion-145872b3", "acceptance_criterion-7761b6dd",
               "acceptance_criterion-a2c7925e", "acceptance_criterion-ccefcbab",
               "acceptance_criterion-9a05baf2"]
    added:    ["acceptance_criterion-8d11ea8d"]
    removed:  []

Progress: 1 of 2 plan items complete
```

Item 2 (L1 slot seam / STORY-83) is untouched and remains for the next call.
