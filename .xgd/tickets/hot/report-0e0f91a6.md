---
uid: report-0e0f91a6
id: REPORT-3939
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-11T06:15:16.470919+00:00'
updated_at: '2026-09-11T06:15:16.470919+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-87be4669
  plan_item_index: '15'
---

Confirmed — the worktree still declares one tab; the second lands with the outer reconcile's cherry-pick of `855dd57a7c`. Both restatements hold under either declaration, which is the point of stating them over the declaration rather than a literal count.

```
Upgrade mutations applied for plan item 15 of 17

Target Stories: story-e674c60a, story-7f437d57
Primary Story UID: story-e674c60a
Stories Modified: 2
ACs Modified: 3
ACs Added: 0
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e674c60a"
    - "story-7f437d57"
  acceptance_criteria:
    modified: ["acceptance_criterion-6f87920c", "acceptance_criterion-922c2d11", "acceptance_criterion-40a51203"]
    added: []
    removed: []

Progress: 15 of 17 plan items complete
```

**What changed and why**

REQ-161's body names all three criteria as superseded and states the restatement, so this is explicit supersession, not inference.

- **AC-959** — the panel count moves from the literal `1` to the declaration's own length, and "the first declared tab is the one that opens" is added. The stable-`site`-id and display-panel-hosting halves are unchanged.
- **AC-976** — restated over *every* declared tab. The key change is that "this id is the active tab" now applies to the first declared tab only; with one tab the two readings were indistinguishable, which is why the old wording read as exact. The fill option is asserted as *exactly the tabs that declare it*, and the mutation check survives.
- **AC-1064** — restated by what a control offers: examine every dropdown, keep those offering one of the store's site slugs, exactly one survives and it is the toolbar's. The old `count(select) === 1` proxy is gone. The conversation-follows-site half is untouched.

Both stories gained a dated `## Reconciliation Decisions` entry, and STORY-99's "One tab, filling the window" bullet became "Tabs are declared, and the chrome renders exactly what is declared", with an out-of-scope line pointing a second tab's *contents* at its own capability (item 11's story, `story-1500b111`) rather than describing them here.

**Two things worth flagging**

1. Ground truth for this item came from `git show 855dd57a7c` — `library.js`, `upload.js` and the two-entry `TABS` are not in this worktree's HEAD (`config.js:50` still reads `TABS = [SITE_TAB]`). The commit is reachable in the object store, so the landed suite rewrites and the `LIBRARY_TAB` declaration were readable. Downstream UAT generation for these criteria will pass on today's one-tab checkout and stays correct once the cherry-pick lands — that is what stating them over the declaration buys.
2. AC-1064's restatement discriminates site controls by whether a dropdown's options include a site slug. The Library's role filter offers the literal value `site` as a *role*, so a store containing a site whose slug is `site` would make that filter read as a second site control. The landed suite has the same property. Not a defect in anything shipped, but if it ever bites, the fix is to match on the slug set rather than on any single value — worth knowing before someone names a site `site`.
