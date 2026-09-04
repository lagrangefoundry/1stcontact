---
uid: report-b93492d5
id: REPORT-3464
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-04T02:16:38.846478+00:00'
updated_at: '2026-09-04T02:16:38.846478+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-203b1dc2
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 15

**Target Stories**: story-c4f329d3 (STORY-117)
**Primary Story UID**: story-c4f329d3

**In scope for change**: STORY-117 body; AC-1295, AC-1293, AC-1296, AC-1300; two new ACs.
**Explicitly out of scope (unchanged)**: AC-1291, AC-1292, AC-1294, AC-1297, AC-1298, AC-1299, AC-1301–AC-1306 (AC-1291 belongs to plan item 3; AC-1305/AC-1298 remain true as written), and every other story in the matrix.

```
Stories Modified: 1
ACs Modified: 4
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-c4f329d3"
  acceptance_criteria:
    modified: ["AC-1295", "AC-1293", "AC-1296", "AC-1300"]
    added: ["AC-1500", "AC-1501"]
    removed: []
```

**What changed and why**

- **STORY-117 body** — `story_kind` → `upgrade`. Membership restated as the document's single-valued kind (not a boolean opt-in), with a new bullet stating the retired boolean is replaced rather than deprecated. Added the unrestricted shipped corpus, the exhaustive listing with truncation refused, and the visible-not-inferred corpus count. "The declaration is the thing in force" now says the shipped predicate is deliberately empty and that scaffold and committed declaration must agree. Technical Context gained the `doc_kind`-over-own-field rationale and the note that status is no longer pure-filesystem (the one place the listing failure is swallowed). Out of scope gained "documents nobody authors" so plan item 2's projections aren't absorbed here.
- **AC-1295** — was *"only as a genuine boolean"*; now membership is the knowledge-base kind matched exactly, with the retired boolean enumerated as explicitly out in every spelling it ever had.
- **AC-1293** — gained the marker-ticket count on the corpus line and the three distinguishable outcomes (agreement / warned disagreement with remedy / unknown when the store is unreadable, never zero).
- **AC-1296** and **AC-1300** — two modifications beyond the plan's list, under the documentation-completeness constraint: both were written against the retired flag ("they carry no opt-in", "which flag to set"), which the code no longer implements. Sharpened to name the marker field and value. Both sit inside REQ-164's declared footprint (its test plan covers the skip line naming the field and value).
- **AC-1500 / AC-1501** (new) — the unrestricted corpus (structural *and* behavioural, over three frontmatter shapes, both declarations asserted) and the exhaustive listing (fixture larger than one page; truncated listing refused by name).

**Reconciliation Decisions** recorded in STORY-117's Technical Context, dated 2026-09-03: formalising the three status renderings as binding (the intent's acceptance only asked for a matching count); stating the retired boolean's non-membership as a criterion in its own right; asserting both the scaffolded and committed declarations.

**One deliberate under-specification**: the status line currently renders `N exported + M projected`, and the health check compares tickets against the *exported* half. That arithmetic is REQ-165's (plan item 2), so AC-1293 is worded to hold both before and after the projection split rather than pinning item 2's composition here.

No new story tickets were created; no runtime code was modified (`git status` clean).

**Progress: 1 of 15 plan items complete**
