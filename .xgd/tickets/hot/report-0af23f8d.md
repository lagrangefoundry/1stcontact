---
uid: report-0af23f8d
id: REPORT-10939
type: report
title: 'Fix reconciliation review: bundle-5052a63c'
created_by: xgd
created_at: '2026-11-04T21:42:13.914487+00:00'
updated_at: '2026-11-04T21:42:13.914487+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-5052a63c
  needs_more_work: false
  progress_made: true
---

## Stories created
None.

## ACs created
- acceptance_criterion-f3bb2e26 (AC-2323), story-387c9dfe. Gap 6: add-a-business resolves `accountEmail` only among 1st Contact people, while `canFulfil`, and so the Provision control, applies in any scoped business. Pinned as current behaviour, recorded as a CODE-ISSUE. UAT: `test_UAT_AC2323_add_a_business_resolves_the_address_only_among_platform_people_from_any_scoped_business` (tests/test_reconciliation_business_fulfilment.workers.test.ts).

## Stories modified
- story-387c9dfe: Reconciliation Decision (CODE-ISSUE) for the platform-only lookup (gap 6).
- story-a55c2f35: Reconciliation Decision (CODE-ISSUE) for the Provision control being offered in every business (gap 6).
- story-7d255580: corrected the Technical Context sentence. REQ-198 adds no render+send call site; that composition belongs to REQ-199.
- story-219b4217: CODE-ISSUE decisions for messages.ts. A store failure after the provider accepts is recorded as `failed`, and a late `delivered` overwrites `bounced`.

## ACs modified
- AC-2276: criterion and verification now state precisely that the `sent` capture list belongs to `capturingMailer`, and that the console line is the record observed through `mailerFor`. Decision recorded (gap 1).
- AC-2179: verification split into a server half (`/api/people` returns the primary when it is not the oldest) and a panel half. Decision recorded (gap 3).
- AC-2257: runtime evidence with a `staff` membership is now the primary verification; the source scan is a supplementary guard. Decision recorded (gap 5).
- AC-2202: offering rule corrected (`canFulfil` = owns the 1st Contact business, in any scope), with a pointer to AC-2323 (gap 6).
- AC-2153: "no part exists without the others" softened to the actual atomicity. Decision recorded.
- AC-2239: scoped to keys this repository mints; `tickets.uid` is external.

## ACs superseded
None.

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes (tests only; no production code)
- tests/test_reconciliation_outgoing_messages.workers.test.ts: AC2276 now asserts `capturingMailer().sent` equals the messages in send order, with no network calls (gap 1).
- tests/test_reconciliation_opaque_site_keys.workers.test.ts:
  - AC2240 slug change now edits and publishes under the new slug. It asserts a second revision, the same key, `/site/<key>/` serving the new copy, and that `rev/0002` exists (gap 2).
  - AC2242 forget now proves that a sibling site in the same business and a same-slug site in another business keep their rows and objects, and are still served (non-blocking).
- tests/reconciliation-identity-person-addresses-names.workers.test.ts:
  - AC2247 moves the primary flag to the newer address and asserts `peopleOf`, `personDetail().person.email`, `emails[0]` and `admit` (via either address) all show the new primary (gap 3).
  - New `test_UAT_AC2179_the_contacts_list_route_carries_the_primary_address_not_the_oldest`, run through `GET /api/people` (gap 3).
  - New `test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates`. A `staff` member is admitted and selectable, and gets the same `/api/people` list with `canInvite` false. They get 403 at invite, record and status, and 404 at add-a-business. The owner and the platform owner pass the gates (gap 5).
- tests/test_reconciliation_business_fulfilment.workers.test.ts:
  - AC2157 asserts that `person.name` is null when unnamed, equals the current name, and follows a supersession (gap 4).
  - New AC2323 UAT (gap 6).

## Confidence
Moderate to high. Every material gap (1 to 6) has discriminating evidence and/or corrected wording, and the minor ungrounded-wording items are fixed. Risk: the new and extended UATs were not run in this call, per the instructions. They are written against the real signatures, but the workflow's suite run is the first execution.
