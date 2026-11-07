---
uid: report-cef67b67
id: REPORT-11106
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-07T07:25:34.306745+00:00'
updated_at: '2026-11-07T07:25:34.306745+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7988e925
  plan_item_index: '4'
---

Plan item 4 is applied. Both target stories (STORY-146 and STORY-165) now describe adding and inviting as two separate acts, matching REQ-199 and the code. No runtime code or UATs were touched.

**Beyond the plan:** I restated five more ACs on STORY-146 than the plan listed. They described the invite finding or creating a person by address. The invite route now takes contact ids, so those properties now belong to the add route, and leaving the ACs as written would contradict both the code and REQ-199.

**Superseded, not deprecated:** AC-2175 ("no message is sent") is marked `superseded` by bundle-7988e925. REQ-199 explicitly replaces that behaviour.

**One mismatch between code and intent, recorded as a CODE-ISSUE in STORY-146:** the Contacts panel clears the checked selection after every answered send. That includes a send where every contact was refused. REQ-199 says the selection should survive a send in which nothing was sent. AC-2339 states the intent, so `fix_uat_coverage` needs to change the panel.

**Recorded under Reconciliation Decisions in STORY-146, where REQ-199 was silent:**
- **Unknown id:** an id that names nobody in the business gets a 404 with the same message either way. Contacts earlier in the selection have already been sent to by then.
- **Half-edited copy:** the operator's edited copy is used only when both Subject and Body arrive. Otherwise the template's own copy is sent.

**Push blocked:** each `xgd ticket create` tried to push to `github.com:22` and the sandbox blocked it. The four new ACs were created locally, but they haven't been pushed.

```
Upgrade mutations applied for plan item 4 of 7

Target Stories: story-7b1025b8, story-0ea74f39
Primary Story UID: story-7b1025b8
Stories Modified: 2
ACs Modified: 8
ACs Added: 4
ACs Removed: 1

tickets_modified:
  stories:
    - "story-7b1025b8"
    - "story-0ea74f39"
  acceptance_criteria:
    modified: ["acceptance_criterion-08105c13", "acceptance_criterion-b57f3f26", "acceptance_criterion-6c4e16be", "acceptance_criterion-c7cfa975", "acceptance_criterion-890af8ec", "acceptance_criterion-3b4b793b", "acceptance_criterion-8fead1a2", "acceptance_criterion-4fb92916"]
    added: ["acceptance_criterion-638552f4", "acceptance_criterion-c1839219", "acceptance_criterion-90483175", "acceptance_criterion-51c854d3"]
    removed: ["acceptance_criterion-b54ba690"]

Progress: 4 of 7 plan items complete
```

Modified ACs, in the order of the `modified` list: AC-2169, AC-2172, AC-2205, AC-1743, AC-1744, AC-2248, AC-2171, AC-2253. Added: AC-2336 to AC-2339. Removed: AC-2175 (superseded).