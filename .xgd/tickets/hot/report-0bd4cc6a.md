---
uid: report-0bd4cc6a
id: REPORT-7864
type: report
title: 'Fix reconciliation review: bundle-39edf66d'
created_by: xgd
created_at: '2026-11-01T22:23:40.305954+00:00'
updated_at: '2026-11-01T22:23:40.305954+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-39edf66d
  needs_more_work: false
  progress_made: true
---

## Stories created
None.

## Stories modified
- **story-a55c2f35 (G1, G2).** The Story line, the Grants bullet and the Login-status bullet now state the gates:
  - grants are the 1st Contact operator's act (`ownsPlatformBusiness`) and are confined to the scope;
  - the status route is `ownsBusiness`;
  - the Withdraw control renders only on `canFulfil`.

  The two stale CODE-ISSUE decisions ("apply no ownership check", "a refused grant is a 500") are rewritten as resolved. The rewrite records the history: as landed, then override report-4f1b02e8, then the review verdict override_misjudged report-fb9c667a, then the current gate.
- **story-e674c60a (G6).** Added a CODE-ISSUE decision: `reader.js` fetches material bytes outside `send()`, which diverges from BUG-52's intent. AC-2230 is narrowed to match. Routing the reader through `send()` is left as a follow-up and is not absorbed into the matrix.
- **ACs modified:**
  - AC-2200: restated as the operator gate for grant open/revoke, 403 to everyone else including the business's own owner. Status stays owner-gated. The panel offers no Withdraw to non-operators.
  - AC-2230: the single-transport claim is narrowed to `send()` requests, with the reader exception recorded.
  - AC-2165, AC-2168, AC-2229: pending → active, now that UATs exist.
  - AC-1748, AC-1760, AC-2075: Verification rewritten to the invite + `provisionBusiness` sequence. The criteria are unchanged.
  - AC-1741: wording moved from the composite invite to provisioning. The opacity property is unchanged.
- **ACs created:**
  - AC-2233 (acceptance_criterion-a302f9c3, story-a55c2f35): a grant's business, or a revoked grant's business, must be within the scope. Otherwise 400 and nothing is written.
  - AC-2234 (acceptance_criterion-d1428271, story-83ff6262): the portal is the caller's own tenant, never `env.TENANT_ID` (G5).

## Stories deleted
None.

## ACs superseded
None. G7's AC-1748 and AC-1760 had criteria that still hold; only their Verification pinned the retracted composite invite, so it was rewritten rather than superseded.

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes
- **`apps/control-app/src/router.ts` (G1).**
  - `POST /api/grants` and `POST /api/grants/revoke` are now gated on `ownsPlatformBusiness`; any other caller gets 403.
  - Open refuses a `businessId` outside the scope with 400 "No such business among these contacts.".
  - Revoke refuses a grant whose business is outside the scope with 400 "No such grant." (the same answer as an unknown id).
  - The status route still uses `ownsBusiness`.
- **`apps/control-app/src/people.ts`.** New `businessInScope` and `grantBusinessInScope`. A business is in scope when someone in the scoped business holds a membership on it, which is the same population as the detail's business table.
- **`apps/control-app/src/builder/people.js`.** The Withdraw control renders only when `canFulfil` is true.
- **Tests:**
  - `tests/test_reconciliation_contacts_tab_editing.workers.test.ts`: AC2200 rewritten. Member and customer owner get 403; the operator gets 200. The status route is split into its own AC2200 case. New AC2233 cross-scope case using the hosting bypass.
  - `tests/test_reconciliation_contacts_tab_editing.test.ts`: the AC2199 jsdom case passes `canFulfil: true`. New AC2200 case: no Withdraw control for a customer owner.
  - New `tests/test_reconciliation_ownership_and_bypass_split.workers.test.ts` (AC2165, AC2168). Both go through the Worker: `/api/people` `canInvite`/`canFulfil`, `/api/admin/businesses`, scope prefix, and the `not_a_member` log.
  - New `tests/test_reconciliation_starter_site_guard.workers.test.ts` (AC2229). Covers `createDraft` true/false. `provisionBusiness` is driven onto an existing authored slug by pinning its first `getRandomValues` call; the definition, pages, version and counter are unchanged. A fresh slug gets the starter.
  - `tests/test_reconciliation_customer_portal.test.ts`: new AC2219 jsdom case. It drives the served page against the real builder origin, presses Delete account and Close, and records the client's own requests (GET only) and any submits (none). The store snapshot is unchanged, and the portal and builder still load.
  - `tests/test_reconciliation_customer_portal.workers.test.ts`: AC2219 drops the source-text scan and the test's self-logged request list, and adds a builder load check. New AC2234 case: a caller whose `tenant_id` (Salon) is not `TENANT_ID` gets Salon's portal, whether scoped or unscoped.
- `tsc --noEmit` on control-app is clean. Tests were not run, per the instructions.

## Confidence
Moderate to high that the next review passes: every gap from G1 to G7 has a matrix change, and code or UATs where needed. The main risks are in the new tests, which have not been run:
- the workerd `vi.spyOn(crypto, 'getRandomValues')` pin in the AC2229 collision case;
- the AC2168 `console.warn` capture.

Neither depends on product behaviour I am unsure of.
