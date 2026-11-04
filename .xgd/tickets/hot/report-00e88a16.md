---
uid: report-00e88a16
id: REPORT-10869
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-04T17:11:22.815988+00:00'
updated_at: '2026-11-04T17:11:22.815988+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5052a63c
  plan_item_index: '4'
---

Plan item 4 is done: all three target stories and four existing ACs now describe accounts as REQ-194 specifies, five new ACs were added, and no story tickets or runtime code were touched. Every ticket write succeeded. The five creates also showed a blocked outbound connection to `github.com:22` (most likely the CLI trying to sync over SSH), but each new AC was created on the reconcile branch.

The code agrees with REQ-194 on every point, so nothing is flagged for `fix_uat_coverage`. Three judgement calls are recorded under `## Reconciliation Decisions` in the stories:

- **Starter site name:** the plan's AC-1742 wording said the starter site is called `home`, but the intent and the code both call it `unnamed`. The AC says `unnamed`.
- **"No permission check reads role":** REQ-194's acceptance line says this literally, but the code has one predicate that reads role: the existing owner check that gates inviting and adding a business. REQ-194's own body keeps `'owner'` as the one allowed value and rules out only role-based access between people. So I wrote the AC as "nothing reads role beyond that single ownership question, and `owner` is the only value", which matches the shipped test `test_UAT_FC_REQ-194_no_permission_check_reads_role`.
- **Account billing name:** the invite copies the display name into the account's name. The intent doesn't mention this; it's recorded on STORY-146 without a separate AC.

STORY-166 needed no AC change: the portal's identity line now reads the payload's `person` field, but what AC-2222 checks is unchanged.

```
Upgrade mutations applied for plan item 4 of 8

Target Stories: story-7b1025b8, story-387c9dfe, story-83ff6262
Primary Story UID: story-7b1025b8
Stories Modified: 3
ACs Modified: 4
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7b1025b8"
    - "story-387c9dfe"
    - "story-83ff6262"
  acceptance_criteria:
    modified: ["acceptance_criterion-17f275a7", "acceptance_criterion-d384dcb1", "acceptance_criterion-be56b74c", "acceptance_criterion-3f0182e4"]
    added: ["acceptance_criterion-4fb92916", "acceptance_criterion-a1042e70", "acceptance_criterion-295b600f", "acceptance_criterion-211aa877", "acceptance_criterion-02172406"]
    removed: []

Progress: 4 of 8 plan items complete
```

New ACs:
- **AC-2253** (STORY-146): an invite creates an account with an opaque `acct_` key, and the database refuses a person with no account.
- **AC-2254** (STORY-146): an account may hold several people, and all of them become owners of its businesses.
- **AC-2257** (STORY-146): nothing reads role except the ownership question, and `owner` is the only value.
- **AC-2255** (STORY-162): a business names the account that owns it, and the platform business has no owner. No business id reads `acct_`.
- **AC-2256** (STORY-162): provisioning refuses an account that doesn't exist or has nobody on it. The operator's lookup by address returns an account, not a person.