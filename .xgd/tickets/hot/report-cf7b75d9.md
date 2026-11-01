---
uid: report-cf7b75d9
id: REPORT-7580
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T11:57:57.640125+00:00'
updated_at: '2026-11-01T11:57:57.640125+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '8'
---

```
Story #8 created for reconciliation bundle-94dbe947

Story UID: story-387c9dfe (STORY-162)
Title: Business Fulfilment: Only The Operator Adds A Business, And A Business Arrives Whole
Type: feature
Acceptance Criteria: 12 created (AC-2149 – AC-2160)

Progress: 8 of 10 plan items complete
```

All 12 acceptance criteria are linked to STORY-162. The story sits under CAP-114 (Accounts, Membership & Entitlement), the same capability as STORY-160.

**Who is refused**
- **AC-2149:** an ordinary admitted customer gets a 404 and no business is written.
- **AC-2150:** the refusal body is `Not found.` and doesn't mention "admin" or "business".
- **AC-2151:** the local dev-open door, which has no signed-in identity, is refused with a 404.

**What succeeds**
- **AC-2152:** the operator adds a business and it is immediately selectable, with no lapse.
- **AC-2153:** all four parts are created in one operation (business, owner membership, live grant recording the operator in `granted_by`, starter site).
- **AC-2154:** creating an account provisions its first business through the same operation.

**Operator errors**
- **AC-2155:** an unknown email gets 404 with `No account with that email address.`
- **AC-2156:** a missing or blank account email or name gets 400.

**Guards**
- **AC-2157:** the businesses data the browser reads has exactly the keys `account` and `businesses`, so there is no self-serve way to add one.
- **AC-2158:** `platform_admin` is read in exactly two places, and a third read fails the build.
- **AC-2159:** no generic `isAdmin`-style check exists anywhere.
- **AC-2160:** nothing outside the two allowed files names or tests for "the platform's own tenant", including comparing a business id against the deployment's slug.

**One decision to check:** the REQ-180 ticket body says this route is refused "with the same single message every other refusal uses", which would be a 403. The code returns a 404 instead. I wrote the ACs to the 404 rather than flagging it as a code bug. The 404 was reported to you in the ticket's chat when it landed, and the later amendment says the route "stays exactly as it is". The other gaps the ticket doesn't cover (dev-open refusal, unknown-account message, 400 on missing fields, recording who granted the business) are written up as decisions in the story's Reconciliation Decisions section.

Each ticket write tried to reach github.com and the sandbox blocked it. The tickets were created; I didn't check whether they are committed locally.
