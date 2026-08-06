---
uid: comment-72d9c538
id: COMMENT-690
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T03:10:25.921001+00:00'
updated_at: '2026-08-06T03:10:25.921001+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f379333d
  kind: note
---

All 27 tests across the story's five reconciliation test files pass (2 skipped are the engine-dependent browser probes AC-683/AC-688, which skip cleanly where no engine is installed — exactly as those ACs specify).

## Coverage analysis

The story carries **26 ACs**. 23 were already pinned by pre-existing reconciliation test files:

| File | ACs |
|---|---|
| `reconciliation-l1-substrate.test.ts` | 682, 683, 684, 685, 686, 687, 688, 723 |
| `reconciliation-l1-language.test.ts` | 725, 726, 727, 728 |
| `reconciliation-l1-shared-axis-groups.test.ts` | 685, 801, 802, 803, 804, 805 |
| `reconciliation-l1-control-and-texture.test.ts` | 806, 807, 829, 830, 831, 832 |

The three gaps were **AC-849, AC-850, AC-851** — the REQ-107 criteria that wired the envelope validator to the authoring path. I wrote one UAT for each.

Each drives a real entry point: `validateSite` (the single validator behind `loadSite`, and therefore behind render/publish/edit/import) and the `1c` CLI (`cmdNew` / `cmdRender` / `cmdPublish`) over a real on-disk workspace in a temp dir. No internal mocking; the only isolation is `mkdtempSync`.

- **AC-849** — an envelope-only violation (shape-legal `fontSizePx` past the ceiling) is refused by `validateSite` with the path anchored at `/pages/0/l1/…`; the in-range twin is accepted; a multi-page definition names the offending page (`/pages/1/…`) and leaves an L1-free page alone; `cmdRender` and `cmdPublish` both reject on disk naming that path, `cmdRevisions` confirms nothing was written, and both succeed once the value returns to range.
- **AC-850** — the four classes parameterized: out-of-range `fontWeight`, `javascript:` image `src` ("not an allowed URL"), an over-cap tree (`/pages/0/l1/root`, "exceeds cap 2000"), and a duplicate id reported at the *second* node's `id` path. Each paired with its corrected definition validating.
- **AC-851** — the independence check. The emitter, handed an unvalidated document, still emits `src=""` and no `href` for off-allowlist URLs while validation names both fields; and the three classes no emitter can catch (out-of-range axis, over-cap count, duplicate id) render without objection — the duplicate-id case emits `id="signup"` twice — while validation refuses all three.

Note for the review phase: `tests/req107-authored-l1-envelope.test.ts` still holds five `test_UAT_FC_REQ-107_*` functions. Those are FC orphans for this story and will need renaming or deletion by the review pass — AC-849/850/851 now cover their AC-1/2/3, and the file's AC-4 (`storage/sites/**` corpus control) is one the story explicitly declines to carry as a criterion.

```
UATs generated for story story-d0a8cfad (plan item 8 of 12)

Story: story-d0a8cfad
Test file(s) created:
  - tests/reconciliation-l1-authoring-envelope.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-authoring-envelope.test.ts"
```
