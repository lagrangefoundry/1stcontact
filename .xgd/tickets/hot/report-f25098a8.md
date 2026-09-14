---
uid: report-f25098a8
id: REPORT-4238
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-14T05:32:12.512914+00:00'
updated_at: '2026-09-14T05:32:12.512914+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-8e1807f6
  plan_item_index: '4'
---

Upgrade mutations applied for plan item 4 of 10

**What I read first.** BUG-40's section of bundle-8e1807f6 (Cause 2: `1c assets` `rm -rf`'d the directory it was about to fill; the fix assembles in `dist-assets.staging/` and swaps once whole. Cause 3 item 4: AC-1331's `--skip-preflight` leg split into two claims). Then the code: `tools/generate/src/cli/assets.ts:537-600` (stage aside, then two renames — old tree to `.retired`, staging to `dist-assets`, retired removed) and `bin/build:87-113` (the flag gates only the preflight block; `1c assets` then runs unconditionally and needs the same component store).

**Intent vs. code: no contradiction.** BUG-40 states the guarantee in its own words, so both mutations formalize stated intent rather than code the spec was silent on. The one judgment call — BUG-40's test plan says "no new behaviour is introduced, so no new UAT" and files the change under AC-1331's incomplete-store leg — is recorded as Reconciliation Decision 8 on the story: the serving criteria passing in one run is evidence the race is gone, not a statement of the guarantee, and no criterion said what a concurrent reader of the asset tree observes.

```
Target Stories: story-d5167ced
Primary Story UID: story-d5167ced
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d5167ced"          # STORY-119 — asset-tree replacement paragraph, skip clause in
                                # the build paragraph, two In-scope bullets, Reconciliation
                                # Decisions 8 and 9 (dated 2026-09-13)
  acceptance_criteria:
    modified: ["acceptance_criterion-ae2bb537"]   # AC-1331 — skip clause split into two legs
    added: ["acceptance_criterion-a6e6e62a"]      # AC-1791 — whole-tree swap guarantee
    removed: []
```

AC-1791 is written about what a reader observes (a whole previous tree or a whole new one; a failed build leaves the previous one serving) rather than about staging directories or renames. AC-1331 now states both legs explicitly: skipping the check on a tree with a component genuinely absent reaches the generated-asset stage and stops there non-zero with no bundler invoked; skipping it on a complete tree completes. Story AC count went 18 → 19. No new story was created, and `git status` shows only ticket-store bookkeeping — no runtime file touched.

Progress: 4 of 10 plan items complete
