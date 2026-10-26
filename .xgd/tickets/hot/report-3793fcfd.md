---
uid: report-3793fcfd
id: REPORT-6767
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-10-26T01:27:13.590148+00:00'
updated_at: '2026-10-26T01:27:13.590148+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5607a08d
  plan_item_index: '2'
---

Plan item 2 is done. Both target stories are rewritten to match BUG-47 and the promotion behaviour that survived from BUG-45. Three ACs were updated and four new ones added; none were removed. I checked the code in `material.ts`, `router.ts` and `library.js` against the BUG-47 ticket and its chat transcript. The code matches the intent and I found nothing that contradicts it, so no code issues are flagged.

**STORY-143 (Site-Asset Promotion):**
- Kind is now `upgrade` and story points went from 2 to 3.
- Placement is now described as a recorded fact: a list of sites, written only after a promotion actually lands, and each site appears once.
- Promotion goes through the same asset-add path as every other asset, including its draft-journal entry.
- The site that was open at hand-over is described as an instruction to promotion, not a label stored on the material.
- The ticket's two accepted consequences (no backfill, and placement is recorded but not verified) are written down as scope notes, not as ACs.
- New reconciliation decision: promoting to a site that is already listed records it once.
- Removed the old overlay wording ("just for you to read"); the scope list now points to STORY-145 and STORY-144.

**STORY-144 (The Library):**
- New paragraph, "On this site means the bytes went there": the badge, the "Used on" row and the filter all read the one placement list.
- The detail record now shows "every site it is placed on".
- The scope and technical notes now cover `placed_on` replacing `site_slug`, and that this story only reads it while STORY-143 writes it.
- New reconciliation decision: the "Used on" row joins the sites with commas and is empty when the material is placed nowhere.

**ACs updated:**
- **AC-1715:** the badge is keyed on recorded placement. The check now includes a background file handed over while the site was open, which must not be badged.
- **AC-1716:** "used on this site" means the placement list includes the open site. It also records that the filter shows nothing when no site is open, which is what the code does.
- **AC-1711:** the renamed-on-collision name is the one reported and the one the site lists, because promotion uses the ordinary add path.

**ACs added:**
- **AC-2015:** a promotion that lands records exactly that site, re-promoting doesn't duplicate it, and a material on two sites lists both.
- **AC-2016:** a background file handed over while a site is open, a promotion that failed softly, and a fetched file all record no placement, and the material is kept.
- **AC-2017:** a landed promotion makes one draft-journal entry naming the asset; a refused promotion makes none.
- **AC-2018:** the badge, the "Used on" row and the filter agree on every row, including after switching site without re-reading the list.

AC-1717 still says "which site it is used on" in the singular. It was not in this item's change list, so I left it; AC-2018 now covers the plural "Used on" row. Each ticket write also logged a denied `github.com:22` connection, but every create and update reported success.

```
Upgrade mutations applied for plan item 2 of 9

Target Stories: story-aacb7060, story-1500b111
Primary Story UID: story-aacb7060
Stories Modified: 2
ACs Modified: 3
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-aacb7060"
    - "story-1500b111"
  acceptance_criteria:
    modified: ["acceptance_criterion-946ff3b5", "acceptance_criterion-17ec5ed0", "acceptance_criterion-98f8f69e"]
    added: ["acceptance_criterion-c8c0375c", "acceptance_criterion-88695277", "acceptance_criterion-b85050fa", "acceptance_criterion-dc45179f"]
    removed: []

Progress: 2 of 9 plan items complete
```
