---
uid: report-8dfe881d
id: REPORT-10859
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-04T16:31:36.150029+00:00'
updated_at: '2026-11-04T16:31:36.150029+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5052a63c
  plan_item_index: '3'
---

Plan item 3 is applied: all three target stories, 5 existing ACs and 6 new ACs now describe what the code does for REQ-191 (addresses) and REQ-193 (names). I created no stories and changed no runtime code. During AC creation the sandbox blocked an outbound connection to github.com:22. The ACs were created locally and are linked to their stories, but that sync attempt did not get through.

**Decisions I made where the plan and the code differ:**
- **One primary address vs at most one.** The plan and REQ-191's acceptance say "exactly one primary". REQ-191's own "What landed" section, and the code, enforce *at most one*. A contact with no address has zero, and a person whose addresses have no primary flag shows the oldest one. I wrote the ACs to say "at most one" and recorded this as a dated Reconciliation Decision on STORY-146.
- **Where the name is edited.** The plan says Who they are offers editing on the primary address and the name parts. In the code, name parts live in a separate **Their name** section. I restated AC-2188 to match: Email is the only editable field in Who they are, and the name pane has its own AC (AC-2252).
- **"Every part is optional".** The displayed name is the one required column. Clearing every part leaves the person with no name, while clearing only the displayed name with other parts still set is refused. Both are captured in AC-2251 and AC-2252.

I found no case where the code contradicts the intent, so no code issues are flagged.

```
Upgrade mutations applied for plan item 3 of 8

Target Stories: story-7b1025b8, story-0034d937, story-a55c2f35
Primary Story UID: story-7b1025b8
Stories Modified: 3
ACs Modified: 5
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7b1025b8"
    - "story-0034d937"
    - "story-a55c2f35"
  acceptance_criteria:
    modified: ["acceptance_criterion-8fead1a2", "acceptance_criterion-5d6bb323", "acceptance_criterion-7914c104", "acceptance_criterion-5c205ca2", "acceptance_criterion-890af8ec"]
    added: ["acceptance_criterion-04740da6", "acceptance_criterion-3b4b793b", "acceptance_criterion-c16be885", "acceptance_criterion-4fc9e350", "acceptance_criterion-0bc82a94", "acceptance_criterion-a7e49359"]
    removed: []

Progress: 3 of 8 plan items complete
```

**Story changes** (stories 163 and 164 had `story_kind` set from `feature` to `upgrade`; 146 was already `upgrade`):
- **STORY-146** gained the address-table model. The invite and login now find a person by any of their addresses, and the admission carries the primary. The invite gives a person with no name their first one but never replaces a name they already have. The old note about the people table's `(tenant_id, email)` index is replaced.
- **STORY-163:** each list row shows the current name and the primary address, with *formerly …* for real name changes. The detail pane gains a read-only Other addresses section, and the out-of-scope list is updated.
- **STORY-164:** correcting an address rewrites the primary row. Names are a superseding table edited in the Their name pane, which includes the greeting, the "Record a name change" dialog and the rules for clearing a name. Four dated Reconciliation Decisions are recorded.

**New ACs:**
- **AC-2247** (STORY-146): the address table's shape and that an address is unique within a business.
- **AC-2248** (STORY-146): finding a person by any of their addresses, including an invite or login at a secondary one.
- **AC-2249** (STORY-164): correcting an address rewrites the primary row, and which address is primary changes no key.
- **AC-2250** (STORY-163): the Other addresses section.
- **AC-2251** (STORY-164): the name model; only real name changes reach the client.
- **AC-2252** (STORY-164): the name pane and greeting.