---
uid: report-64ef373a
id: REPORT-3936
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-11T06:05:00.768414+00:00'
updated_at: '2026-09-11T06:05:00.768414+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-87be4669
  plan_item_index: '14'
---

Mutations applied and committed. The intent (REQ-161's "Existing acceptance criteria this supersedes" section) states this restatement explicitly, and the landed code agrees with it — `readBlob` now passes `attachment.uid` as the blob key, and the REQ-162 suite's key composition was rewritten from `t/<tenant>/blob/<sha256>` to `t/<tenant>/blob/<attachment.uid>` in `855dd57a7c`, with the dedup comment removed and the isolation claim kept.

```
Upgrade mutations applied for plan item 14 of 17

Target Stories: story-a7a12d81
Primary Story UID: story-a7a12d81
Stories Modified: 1
ACs Modified: 3
ACs Added: 1
ACs Removed: 0 (the plan's "remove" is a clause inside AC-1488, applied as a modification — no AC ticket was archived)

tickets_modified:
  stories:
    - "story-a7a12d81"   # STORY-127, story_kind feature -> upgrade
  acceptance_criteria:
    modified: ["acceptance_criterion-2eedb758",   # AC-1488
               "acceptance_criterion-53d3dd10",   # AC-1487
               "acceptance_criterion-f14db6cc"]   # AC-1486
    added:    ["acceptance_criterion-85b5e592"]   # AC-1739
    removed:  []

Progress: 14 of 17 plan items complete
```

What changed and why:

- **STORY-127 body** — the "addressed by their content" clause in the story statement, the *Addressing is derived from the content* paragraph, and the in-scope line now state record-derived, account-scoped addressing with the digest as an integrity field, and give the reason the trade was refused (a shared object can't be trashed without breaking a sibling, and moving it is what makes deletion revoke reach). A dated `## Reconciliation Decisions` entry (2026-09-10) records the correction and explicitly supersedes the 2026-09-01 decision that stated the dedup half.
- **AC-1488** — dedup-within-an-account clause removed as false and replaced by "one record, one stored object": identical bytes twice under one account are two distinct locations carrying one digest. The cross-account isolation bullet and the "account comes from the handle, never a caller" clause are untouched, per the intent's statement that those claims are unchanged.
- **AC-1487** — only the address-composition sentence changed (account + attachment record, not account + content address). The load-bearing claim — bytes in the material store, nothing in the public site's store — is verbatim.
- **AC-1486** — "content address" restated as "integrity digest", with a clause noting it describes the content rather than locating it. The 64-hex form, the size, and the listing claim are unchanged.
- **AC-1739 (new)** — the ownership consequence the plan asked for: two records holding identical content are two objects, and removing one leaves the sibling present and byte-for-byte unchanged, with the shared digest surviving the removal.

Sibling ACs AC-1489/AC-1490 (configuration) were checked and carry no addressing language, so they were left alone. No runtime code was touched — working tree is clean apart from the ticket-store change log.
