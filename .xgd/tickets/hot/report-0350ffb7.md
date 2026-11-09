---
uid: report-0350ffb7
id: REPORT-12063
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T23:32:11.605711+00:00'
updated_at: '2026-11-09T23:32:11.605711+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-374f88d6
  plan_item_index: '5'
---

I updated story STORY-103 and added two acceptance criteria for plan item 5 (REQ-228 half A). I changed no code and wrote no UATs, as reconciliation requires. The code matches the intent on every point I checked, so I flagged no code issue.

**What the intent says.** REQ-228's half A section, including the operator's decision of 2026-09-11, says: "the consultant is granted `ReadTickets` over this client's whole store. `WriteTickets` is still withheld", and "That reach is the intention, not a side effect to be narrowed". The resolution ladder marked this settled at level 1. The code in `apps/control-app/src/ai.ts:344` and `ai.ts:551` does exactly that, and the command-line host never adds the ticket tools.

**The two new criteria:**
- **AC-2586:** on the Worker host the consultant can read this business's tickets but not write them, including past chat tickets and their transcripts.
  - It can look up any ticket in the business's own store, read a past conversation's transcript, and search the store.
  - None of the ticket-write tools is offered. If one is asked for by name, it is refused and the ticket stays unchanged.
  - Another business's tickets are refused, and so are references to another project.
  - The permission comes with the ticket tools themselves; it is not written into `instances.json`.
- **AC-2587:** where there is no ticket store (the `1c` command line), no ticket tools are offered and the session works normally. On the Worker host the ticket tools are always present, whatever other optional parts are set up.

**Things to check:**
- **The new story section sits at the very end of the body,** after "Story Points". `xgd ticket update` can only replace the whole 70k-character body or append to it, so I appended. The section says it extends the In-scope list.
- **It also narrows an older out-of-scope bullet** that says "Nothing here is tenant-scoped". That still holds for the knowledge base, but no longer for tickets.
- **Network warning:** each of the two `xgd ticket create` calls reported a blocked outbound connection to github.com:22. Both tickets were still created.

```
Upgrade mutations applied for plan item 5 of 8

Target Stories: story-a58a0974
Primary Story UID: story-a58a0974
Stories Modified: 1
ACs Modified: 0
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a58a0974"
  acceptance_criteria:
    modified: []
    added: ["acceptance_criterion-acccce49", "acceptance_criterion-40708b96"]
    removed: []

Progress: 5 of 8 plan items complete
```