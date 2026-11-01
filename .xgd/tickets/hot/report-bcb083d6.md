---
uid: report-bcb083d6
id: REPORT-7801
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T18:28:58.732867+00:00'
updated_at: '2026-11-01T18:28:58.732867+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-39edf66d
  plan_item_index: '2'
---

I've applied all the mutations for plan item 2 to story-7b1025b8. No new stories were created and no runtime code was touched.

```
Upgrade mutations applied for plan item 2 of 8

Target Stories: story-7b1025b8
Primary Story UID: story-7b1025b8
Stories Modified: 1
ACs Modified: 5
ACs Added: 8
ACs Removed: 3 (superseded by bundle-39edf66d)

tickets_modified:
  stories:
    - "story-7b1025b8"
  acceptance_criteria:
    modified: ["acceptance_criterion-c7cfa975", "acceptance_criterion-3f0182e4", "acceptance_criterion-3e2eaa0f", "acceptance_criterion-d384dcb1", "acceptance_criterion-890af8ec"]
    added: ["acceptance_criterion-08105c13", "acceptance_criterion-de051c1d", "acceptance_criterion-8fead1a2", "acceptance_criterion-b57f3f26", "acceptance_criterion-84cb722b", "acceptance_criterion-16e701a9", "acceptance_criterion-b54ba690", "acceptance_criterion-a816942d"]
    removed: ["acceptance_criterion-aa26d407", "acceptance_criterion-79e972b6", "acceptance_criterion-3a93576d"]

Progress: 2 of 8 plan items complete
```

**What changed:**
- **Story:** It now says the invite is something any business owner can do. It promotes a contact already on record instead of adding a second copy, and writes no business, membership or access grant. Setting up a business for that person is a separate step. The story's scope and technical notes were updated to match.
- **Five ACs restated:**
  - AC-1743: re-inviting creates nothing at all, including no business and no grant.
  - AC-1742: the starter site comes from setting up a business, not from the invite.
  - AC-1745: the "platform tenant not configured" refusal now happens at sign-in instead of at the invite.
  - AC-2115: the invite writes no grant.
  - AC-1744: email case and spacing are ignored both at the invite route and at sign-in.
- **Three ACs marked superseded, not deleted:** AC-1740, AC-2078 and AC-2079 are now `superseded` by bundle-39edf66d, because REQ-186 explicitly retracts the invite that also set up a business. Two pieces of their content still hold, so I moved them into other ACs:
  - The business-setup details, and the refusal when the owner or business name is empty, are now in AC-1742.
  - The `no_membership` refusal for an invited person with no business is now in the new AC that says the invite writes no membership or grant.
- **Eight new ACs** cover the remaining REQ-186 behaviour: a single row is promoted and the result reports whether one was created; invites from different businesses differ only in which business they belong to; the invite time and name are not overwritten on a re-invite; only owners may invite; no membership or grant is written; `canInvite` and `canFulfil` are reported separately; the dialog says no message is sent; and the DOC-42 §1 sequence runs end to end.

**Reconciliation Decisions recorded in the story:**
- The invite route's success response contains the person and the `created` flag.
- The dev-open loopback path is refused with a 403; REQ-186 says to refuse it but doesn't name a status.
- The pipeline stage the invite sets, and the dialog's wording about becoming a member, belong to REQ-188 and are not repeated in this story.
- The "platform tenant not configured" refusal moved to sign-in, and the three superseded ACs are explained.

I found no places where the code contradicts the intent.

The ticket CLI tried to reach `github.com:22` over SSH and the sandbox blocked it. All the local ticket writes succeeded, but anything the CLI meant to sync to GitHub was not sent.
