---
uid: report-4f298f20
id: REPORT-2912
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T11:36:11.024179+00:00'
updated_at: '2026-08-31T11:36:11.024179+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-b3b7c399
  plan_item_index: '7'
---

Mutations applied. Summary of what changed and why:

**Story `story-5349d01f`** — retitled and rewritten. It documented `1c deploy`, a command that no longer exists in the tree (`tools/generate/src/deploy/` is gone, no `deploy` case in the CLI). It now describes publishing as one service (`publish/publish.ts`) sequencing the port's five revision storage verbs, called identically by the builder's `/api/publish` route and by `1c publish` — with the removals (two-channel deploy, content addressing, per-tree index, dry run, prune, draft preview snapshots) stated with reasons in Technical Context, and three `## Reconciliation Decisions` recorded where the intent was silent (the fs adapter also refreshing the local published dist dir; how the CLI reports the no-op; assets travelling into both halves of a revision).

**Kept and sharpened (2)** — AC-892 now carries the surviving "the artifact is complete" property, restated about a published revision and re-justified (the mutable draft lives in the store, so the frozen definition is the only copy of revision N — what makes checkout possible). AC-894's render-always property survives the command's deletion, restated about publish.

**Added (5)** — mint/render/store with no filesystem and one implementation behind two front doors; the unchanged-draft no-op with forward-only unaffected; validate-before-any-write; readable history plus forward-only checkout; the published-slug claim as a primary key refusing a second account before any byte is written.

**Archived (11)** — each with a change comment naming why the behaviour has no code left, not merely no test.

```
Upgrade mutations applied for plan item 7 of 11

Target Stories: story-5349d01f
Primary Story UID: story-5349d01f
Stories Modified: 1
ACs Modified: 2
ACs Added: 5
ACs Removed: 11

tickets_modified:
  stories:
    - "story-5349d01f"
  acceptance_criteria:
    modified: ["acceptance_criterion-0854ccc9", "acceptance_criterion-33a6622a"]
    added: ["acceptance_criterion-f207077a", "acceptance_criterion-a47a9712",
            "acceptance_criterion-6bd6f4e7", "acceptance_criterion-50925e49",
            "acceptance_criterion-51835b53"]
    removed: ["acceptance_criterion-77bdb689", "acceptance_criterion-48e04041",
              "acceptance_criterion-5a097866", "acceptance_criterion-fdcec177",
              "acceptance_criterion-6d49fb75", "acceptance_criterion-cff7798d",
              "acceptance_criterion-bf89142e", "acceptance_criterion-b873d838",
              "acceptance_criterion-1fd2d4da", "acceptance_criterion-c996ef8e",
              "acceptance_criterion-1d90d433"]

Progress: 7 of 11 plan items complete
```

Two boundary notes for the next items: the "live is derived, never stored / no manifest" AC and the `/preview/<slug>/published` redirect are deliberately left to item 8 (they are the visitor half's, and item 8's add list already carries both), and `test_UAT_FC_REQ-149_build_artifacts_serve_when_the_store_has_no_tenant` belongs to item 3's lazy-store/boot-guard ACs, not here.
