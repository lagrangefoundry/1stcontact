---
uid: report-c1411ca4
id: REPORT-6764
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-10-26T01:12:43.468578+00:00'
updated_at: '2026-10-26T01:12:43.468578+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5607a08d
  plan_item_index: '1'
---

I updated both target stories so they match BUG-44, which removed the site's asset registry and overrides BUG-45 where the two disagree. I created no new stories and changed no runtime code. The ticket writes are saved locally, but each automatic push to `github.com:22` was blocked by the sandbox, so none of them has reached the remote yet.

I checked the intent against `tools/generate/src/cli/edit.ts`, `packages/site-schema/src/schema.ts` and `tools/generate/src/cli/ai/l1-surface.json`, and the code does what BUG-44 asks. There is one wording gap, which I recorded as a decision rather than a code issue:

- **Adding a file can't replace one.** BUG-44 says `add_asset` and `write_image` "refuse a name the store already holds unless told to replace it". Only `write_image` has a `replace` option. `add_asset` never had one, before or after BUG-44: it refuses and tells you to pick a different name with `as`. I read the sentence as describing the two operations together, wrote the AC to match the code, and logged this under "Reconciliation Decisions" in STORY-102. If you did mean `add_asset` to gain a replace option, that would be a separate upgrade.

**STORY-102 (story-c46abfa6)** is now an upgrade, and its points went from 2 to 3 because adding, drawing and removing assets are now in scope.
- **Changed:** AC-1018, AC-1020 and AC-1022 no longer mention the "declared" flag, alt text or the `(unregistered)` marker. I also retitled AC-1018.
- **Superseded:** AC-1019, linked to bundle-5607a08d. Its UAT stays as a record.
- **Added:**
  - AC-2009: a site definition with the old `assets` key still loads, and nothing reads the key.
  - AC-2010: `get_asset` finds anything `list_assets` shows, by id or by its `/assets/` path, and returns the same entry.
  - AC-2011: adding, drawing and removing an asset change only the stored files, never `site.json`, and each logs one journal entry.
  - AC-2012: the assistant's manual has no `alt` parameter on assets, never says registration is needed, and its missing-file note tells the assistant to ask for a drop.
  - AC-2013: backgrounds and layer children still accept an asset reference.

**STORY-107 (story-b3de4571)** is now an upgrade.
- **Changed:** AC-1104 and AC-1105. A drawing is stored as plain bytes with no registry entry or alt text, and a refused drawing leaves the site definition untouched. I retitled AC-1105.
- **Added:** AC-2014, which checks that `write_image`'s description says a drawing must never stand in for a file the client supplied. It tests the wording, not whether a model obeys it.

```
Upgrade mutations applied for plan item 1 of 9

Target Stories: story-c46abfa6, story-b3de4571
Primary Story UID: story-c46abfa6
Stories Modified: 2
ACs Modified: 5
ACs Added: 6
ACs Removed: 1

tickets_modified:
  stories:
    - "story-c46abfa6"
    - "story-b3de4571"
  acceptance_criteria:
    modified: ["acceptance_criterion-4cd04340", "acceptance_criterion-cd61874f", "acceptance_criterion-bc7cc7f1", "acceptance_criterion-651ded8e", "acceptance_criterion-ca166956"]
    added: ["acceptance_criterion-74edd81f", "acceptance_criterion-a569138c", "acceptance_criterion-92e317ae", "acceptance_criterion-e2ad8741", "acceptance_criterion-187a2bcb", "acceptance_criterion-e9d20f95"]
    removed: ["acceptance_criterion-c15ea16c"]

Progress: 1 of 9 plan items complete
```
