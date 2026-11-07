---
uid: report-ed168387
id: REPORT-11119
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-07T08:23:39.206110+00:00'
updated_at: '2026-11-07T08:23:39.206110+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7988e925
  plan_item_index: '6'
---

```
Story #6 created for reconciliation bundle-7988e925

Story UID: story-e0ca0a36 (STORY-171)
Title: Passwordless sign-in: a person signs in from an emailed link, and an invite link signs its recipient in
Type: feature
Acceptance Criteria: 13 created (AC-2343 … AC-2355)

Progress: 6 of 7 plan items complete
```

- **Capability:** the story sits under CAP-103 (Operator Access Gate). Access stays as the second way in, so the gate is the right home.
- **What the ACs cover:**
  - Requesting a link, including that the answer is the same for known, unknown, inactive, over-the-cap and internally failing addresses.
  - The cap of 5 links per hour.
  - Resolving addresses only within the business the request host belongs to.
  - The Continue page on GET, which uses nothing up.
  - Redeeming on POST: a 303 redirect and a cookie both hosts can read.
  - One identical refusal page for expired, used and unknown links.
  - Refusing a cross-site POST.
  - Sign-out.
  - The builder admitting on a session or an Access token, with a dead cookie falling through to Access.
  - Invite links carrying a token.
  - Withdrawing a login ending every session.
  - Cross-origin preflights allowed only from inside the cookie domain.
- **Reconciliation Decisions:** six are recorded in the story, covering behaviour the ticket was silent on or that changed during implementation. For example, the refusal page always returns 200, and withdrawal is triggered by a status change because there is no delete route.
- **Not ACs:** the schema-vs-`SCHEMA_STATEMENTS` check, the cookie settings in the config files, and the Access Bypass policy in `ACCESS.md` are written up as deployment-contract evidence in Technical Context.
- **No contradictions:** the code and the intent agree throughout, so nothing is flagged for a code fix.
- **Sync didn't push:** after every ticket write, xgd tried to push to `github.com:22` and the sandbox blocked it. The tickets exist locally but haven't been pushed.