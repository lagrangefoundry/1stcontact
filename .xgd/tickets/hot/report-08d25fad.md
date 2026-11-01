---
uid: report-08d25fad
id: REPORT-7554
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T10:27:17.310736+00:00'
updated_at: '2026-11-01T10:27:17.310736+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '5'
---

```
Story #5 created for reconciliation bundle-94dbe947

Story UID: story-7102ffe3 (STORY-160)
Title: Business Scope: Every Request Operates Exactly One Business, Chosen By Who The Caller Is
Type: feature
Acceptance Criteria: 15 created (AC-2117 – AC-2131)

Progress: 5 of 10 plan items complete
```

All 15 ACs are filed under capability CAP-114 (Accounts, Membership & Entitlement), with story points 3 and dependency on plan item 4. They cover:
- **Targets:** choosing a business with the `/b/<id>/` prefix, refusing a target the caller isn't a member of, refusing a lapsed target, falling back to the first selectable business, the `platform_admin` bypass and its limits, and dropping deactivated businesses.
- **Dev-open and configuration:** the dev-open branch ignores any target and fails when `TENANT_ID` is unset, `TENANT_ID` is read only by the resolver and `identity.ts`, and store openers refuse an empty scope.
- **Isolation:** preview assets come from the page's own business, two businesses get separate chat hosts (and a failed host build isn't cached), and a session resumed after a membership expires is refused.
- **Accounts with nothing selectable** (the REQ-178 change): the chrome and `/api/businesses` still load, and business-scoped routes return their own 403 logged as `no_entitlement`.
- **Migration:** the operator keeps access to `1stcontact`, and re-running the migration changes nothing.

Notes:
- **Possible missing test (AC-2128, resume after a membership expires):** REQ-168 says a test covers this, but none of the three existing test files appears to. I recorded it as a reconciliation decision, so regression should add that test.
- **Decisions recorded on the story:** four behaviours the original spec didn't state were formalised under "Reconciliation Decisions": dev-open ignoring a target, the empty-scope refusal, evicting a failed chat host, and the null-scope 403.
- **Ticket commits weren't pushed:** each ticket write tried to reach `github.com:22`, and the sandbox blocked it. The tickets were still created locally (every create reported success), but they haven't reached the remote.
