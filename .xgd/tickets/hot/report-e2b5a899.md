---
uid: report-e2b5a899
id: REPORT-7188
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T01:34:28.470649+00:00'
updated_at: '2026-11-01T01:34:28.470649+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-fd009b93
  plan_item_index: '2'
---

I updated STORY-146 and its acceptance criteria to match the multi-business admission code. One thing needs a decision: AC-1750 still states that a person whose every business has lapsed is refused, which a later amendment to REQ-178 reverses.

**Why AC-1750 doesn't follow the amendment.** The REQ-178 section of the intent ticket now includes a section headed "Reopened 2026-09-04" (from DOC-42). Under it, a person whose businesses have all lapsed is admitted with nothing selectable instead of refused (`no_entitlement` stops being a refusal). Normally that would mean writing the amended rule into AC-1750 and flagging the code as wrong. I didn't, because this bundle doesn't contain that change. It carries only the original REQ-178 commit (`b1cafc80b7`), and the amendment describes itself as later commits on top of that one. In this branch, `admit()` still refuses with `no_entitlement` (`apps/control-app/src/identity.ts:476-478`), and the bundled UAT tests that refusal.

Matching the amendment here would leave `fix_uat_coverage` to change the resolver and router to the amendment's design, behaviour owned by REQ-180 and REQ-183 that belongs in the amendment's own commits. So AC-1750 describes the refusal as it landed. The story's "Reconciliation Decisions" section records this and what has to change when the amendment reconciles: AC-1750 becomes "admitted, nothing selectable" and the all-lapsed UAT is inverted. If you'd rather follow the intent strictly and flag the code now, AC-1750 needs rewriting.

**Other changes:**
- **Story:** rewritten around one person operating several businesses, each with its own grant. It also covers the shared business-provisioning step and the re-invite repair, and adds REQ-168/179/180 to the out-of-scope list.
- **Modified ACs (6):** AC-1748, 1750, 1751, 1752, 1753 and 1740, as the plan listed. Grant problems now mark one business unselectable, and the person is refused only when no business qualifies.
- **New ACs (5):** AC-2075 to AC-2079, all linked to STORY-146 (it now has 26 children).
- **Not in the plan:** I folded the two provisioning refusals (an empty owner or an empty name) into AC-2078. The REQ-178 notes and code have them but its acceptance list doesn't; the story records this as a reconciliation decision.

Each ticket create also hit a sandbox block on `github.com:22`. The tickets were saved locally and are readable, but they may not have synced to the remote.

```
Upgrade mutations applied for plan item 2 of 7

Target Stories: STORY-146
Primary Story UID: story-7b1025b8
Stories Modified: 1
ACs Modified: 6
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7b1025b8"
  acceptance_criteria:
    modified: ["acceptance_criterion-c65eae15", "acceptance_criterion-5968d5c2", "acceptance_criterion-cbbd3ee4", "acceptance_criterion-ddfa5b62", "acceptance_criterion-15ef9fae", "acceptance_criterion-aa26d407"]
    added: ["acceptance_criterion-dc59f060", "acceptance_criterion-c6bc805e", "acceptance_criterion-c7f1513b", "acceptance_criterion-79e972b6", "acceptance_criterion-3a93576d"]
    removed: []

Progress: 2 of 7 plan items complete
```
