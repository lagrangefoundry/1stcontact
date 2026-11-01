---
uid: report-b1136ec4
id: REPORT-7545
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T09:54:59.041986+00:00'
updated_at: '2026-11-01T09:54:59.041986+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '4'
---

Upgrade mutations applied for plan item 4 of 10

STORY-146 (`story-7b1025b8`) now says membership is what admits a person, and entitlement no longer decides whether they get in. Each unselectable business explains why it can't be entered. A grant records its business and, optionally, an account. Reaching the builder also requires accepting the current terms. No runtime code or UATs were touched.

**Story changes**
- **Admission:** a person whose every business has lapsed is admitted, with nothing selectable. Refusing entry to a lapsed business is moved out to business scope (REQ-168).
- **Lapse reasons:** the four reasons are `expired` (with the date access ended), `revoked`, `not_yet` and `never_granted`.
- **Grant subject and object:** the business is the object and an optional account is the subject (REQ-184).
- **Terms:** the terms gate (REQ-169) is now the next check after admission.
- **Reconciliation Decisions:** three new entries, dated 2026-11-01:
  - The account-level `no_entitlement` refusal is superseded.
  - When a business has grants in several states, `not_yet` wins over `expired`, and `expired` over `revoked`. The intent never says which reason wins, so I took the order from the code.
  - The platform-admin path into a business without a membership is not covered by the new membership-only criterion. That path belongs to business scope (REQ-168).

**AC changes**
- **AC-2076:** a lapsed business now carries its reason, and the person is admitted whether or not any other business is entitled.
- **AC-1760:** the person must have accepted the current terms to reach the builder.
- **AC-1750:** marked `superseded` by `bundle-94dbe947`. Its two-sided expiry check is carried into the new AC-2112, so that evidence isn't lost.
- **New:**
  - AC-2112: everything lapsed means admitted with nothing selectable.
  - AC-2113: the four lapse reasons.
  - AC-2114: a lapse reason is only shown for businesses the person is a member of.
  - AC-2115: grant subject and object columns.
  - AC-2116: only per-business grants decide whether a business can be entered.

Each ticket write logged a blocked outbound connection to `github.com:22` (port 22 is SSH). The tickets were created and updated locally, but syncing them to the remote may need to be done outside this sandbox.

```
Upgrade mutations applied for plan item 4 of 10

Target Stories: story-7b1025b8
Primary Story UID: story-7b1025b8
Stories Modified: 1
ACs Modified: 2
ACs Added: 5
ACs Removed: 1

tickets_modified:
  stories:
    - "story-7b1025b8"
  acceptance_criteria:
    modified: ["acceptance_criterion-c6bc805e", "acceptance_criterion-4c1d0046"]
    added: ["acceptance_criterion-e515a53e", "acceptance_criterion-3e874f22", "acceptance_criterion-75da6dd7", "acceptance_criterion-d384dcb1", "acceptance_criterion-3ca01422"]
    removed: ["acceptance_criterion-5968d5c2"]

Progress: 4 of 10 plan items complete
```
