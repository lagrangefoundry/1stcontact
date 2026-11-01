---
uid: report-3983bd4c
id: REPORT-7584
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T12:06:49.404406+00:00'
updated_at: '2026-11-01T12:06:49.404406+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '9'
---

I applied plan item 9 (Library — badge the exception) to STORY-144 and its acceptance criteria. I checked the code before editing: `library.js`, `app.js` and `builder.css` do what REQ-181's "What landed" section says. Nowhere did the code contradict the intent, so no code issues are flagged.

**What changed in STORY-144:**
- **List scope:** the old "tenant-wide, with the site as a badge" description is replaced. The list is now the whole of the open business's material. Changing business in the header clears the list and then re-reads it, so no row from the previous business stays on screen, even if the re-read fails.
- **Badges:** placed site assets carry no badge. Only a site asset that never got placed shows a warning: the words *Not on the site*, a hidden glyph, a hover sentence, in the danger colour.
- **Row:** a row now reads icon, title, role pill, plus the warning only on that one exception.
- **Detail pane:** the placement field is relabelled *Placed on* (was *Used on*).
- **Technical notes:** they now say REQ-181 settles REQ-176's open placement-wording question. They also record that the Library has no site-change hook and that CHAT-36 reverses the old "second site inherits the first" reasoning.

**Two calls I made against the plan's wording:**
- The plan asked for a new criterion "a row reads type icon, title, then role pill". AC-2020 already asserts that order, so I updated it instead of adding a near-duplicate. It's listed under modified below.
- The plan asked for the "used on this site" filter criteria to be modified, so AC-1716 and AC-2018 are updated, not marked superseded. Their remaining claims still hold: three filters instead of four, and two placement readers that agree.

The old "used on this site" filter and "re-decided on site switch" behaviour is now gone from every criterion. AC-1714 still describes the list as the "account's" material; it was outside this item's scope, so I left it unchanged.

```
Upgrade mutations applied for plan item 9 of 10

Target Stories: story-1500b111
Primary Story UID: story-1500b111
Stories Modified: 1
ACs Modified: 5
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-1500b111"
  acceptance_criteria:
    modified: ["acceptance_criterion-946ff3b5", "acceptance_criterion-17ec5ed0", "acceptance_criterion-dc45179f", "acceptance_criterion-c72effd0", "acceptance_criterion-c3e5522d"]
    added: ["acceptance_criterion-76bf59bc"]
    removed: []

Progress: 9 of 10 plan items complete
```

| AC | What it says now |
|---|---|
| AC-1715 | The list is the open business's material, with no placement badge. A business switch leaves no previous rows, even on a failed re-read. |
| AC-1716 | Three filters (role, kind, text). No "used on this site" control. |
| AC-2018 | The warning and the *Placed on* row read one placement list and agree. |
| AC-2020 | A row reads icon, title, role pill. No placement pill. |
| AC-1717 | The record's placement field is labelled *Placed on*. |
| AC-2161 (new) | Only an unplaced site asset is badged, and the warning can be understood without colour. |
