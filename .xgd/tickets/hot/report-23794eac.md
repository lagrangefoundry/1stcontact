---
uid: report-23794eac
id: REPORT-7862
type: report
title: 'Reconciliation Review: commits (BUNDLE-36)'
created_by: xgd
created_at: '2026-11-01T21:53:39.611764+00:00'
updated_at: '2026-11-01T21:53:39.611764+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-39edf66d
  anchor_uid: bundle-39edf66d
  overrides_audited: 1
  trust_boundary_overrides: 0
  override_misjudged:
  - report_uid: report-4f1b02e8
    rule: code_frozen
    batch_index: '0'
    reason: 'Item 3 (consistent with intent): the gate chosen for POST /api/grants
      and /api/grants/revoke is ownsBusiness(scope.businessId), so any customer owner
      may mint a live ''pro'' grant (on their own or, because body.businessId is unscoped,
      any business) and revoke any grant by id. Intent makes grants the operator''s
      tool: REQ-183 §6 (''Creating and revoking entitlements is REQ-170''s, because
      a surface that can grant itself access is not a portal''; ''REQ-170 is the operator''s
      tool: every account, every grant'') and REQ-180 D2 cited in REQ-183 §5 (a customer-reachable
      route onto a live pro grant ''is an unbounded free-plan mint'').'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none; commits mode)
**Anchor**: bundle-39edf66d
**Stories Reviewed**: 9 (story-7102ffe3, story-387c9dfe, story-7b1025b8, story-0034d937, story-a55c2f35, story-0ea74f39, story-83ff6262, story-e674c60a, story-fde7370b)

Intent: bundle-39edf66d body (REQ-185/170/183/186/188/189, BUG-51/52/53/54/56). The bundle has no comments. Quality evidence: report-8cc0c4f8, 220 passed / 0 failed / 0 skipped. Every AC number below is in its test_filter.

1 override audited, 0 touched a trust boundary.

## Behavior Inventory

77 behaviours were identified in the code across the 8 plan items: platform_admin split, invite transition, Contacts read, Contacts writes, contact axes, customer portal, local store safety, and workspace chrome.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Owner membership on the platform business; platform_operator column read only by scope.ts; ownsPlatformBusiness gate; role null on bypass; PLATFORM_ADMINS seeding | Covered | story-7102ffe3, story-387c9dfe | AC-2121/2149/2158/2166/2167 are evidenced. **AC-2165 and AC-2168 are `pending` with no `test_UAT_AC2165_` or `test_UAT_AC2168_` anywhere in tests/.** |
| 2 | Invite as an owner-gated, idempotent contact-to-invited transition; no membership or grant; canInvite/canFulfil; no mail sent | Covered | story-7b1025b8 | All 8 new ACs plus the modified ACs are evidenced. AC-1740/2078/2079 are correctly superseded. |
| 3 | Contacts list/detail, scoped and isolated; joined business/grant table; labels; styling | Covered | story-0034d937 | AC-2177..2187 are evidenced with runtime jsdom and workerd tests. |
| 4 | Grant open/revoke, record edit, status route, fulfil control | Covered, but the behaviour diverges from intent | story-a55c2f35 | See gap G1. |
| 5 | Access / pipeline axes, migration 0009, facets | Covered | story-0ea74f39 | AC-2203..2211 are evidenced. |
| 6 | /account portal through PreviewRenderer; account-portal module; delete explains only | Covered, with weak evidence | story-83ff6262 | See gaps G4 and G5. |
| 7 | Import 409 guard and force; 1c reset; createDraft created flag / starter guard | Partial | story-e674c60a, story-fde7370b | AC-2227/2228/1402 are evidenced. **AC-2229 is `pending` with no UAT.** |
| 8 | 401 handled as an ended session (load notice / mid-session strip); single control font-size token | Covered, but one claim is overstated | story-e674c60a | See gap G6. |
| 9 | reader.js material-bytes fetch bypasses send(), so a 401 there shows GONE rather than the session strip | Uncovered / contradicted | story-e674c60a | AC-2230 claims every builder request goes through one transport. |

## Gaps (for fix_reconciliation_review)

**G1. Silent divergence absorption: grants are self-mintable by any business owner** (story-a55c2f35, AC-2200; override report-4f1b02e8).
- `apps/control-app/src/router.ts:1459-1495` gates POST /api/grants and POST /api/grants/revoke on `ownsBusiness(deps.admission, scope.businessId)`.
- `openGrant` (`apps/control-app/src/people.ts:653-683`) then writes whatever `body.businessId` names.
- `revokeGrant` (`people.ts:717-724`) updates `WHERE id = ?` without scoping to the tenant.
- So an owner of any customer business can mint a live `pro` grant for any business and withdraw any grant in any business.
- AC-2200 and its UAT (`tests/test_reconciliation_contacts_tab_editing.workers.test.ts:580-583`) pin a customer owner opening a `pro` grant on their own business with a 200 as intended behaviour.
- This contradicts intent:
  - REQ-183 §6 (bundle body ~l.917-929): "REQ-170 is the operator's tool: every account, every grant" and "Creating and revoking entitlements is REQ-170's, because a surface that can grant itself access is not a portal".
  - REQ-180 D2 as restated in REQ-183 §5 (~l.907-911): a customer-reachable route onto a live pro grant "is an unbounded free-plan mint".
- Remediation:
  - Restate AC-2200 so grant open/revoke is a 1st Contact fulfilment-operator act (the ownsPlatformBusiness gate), or else an explicitly recorded decision that an owner may grant only within their own scoped business.
  - Either way, add an AC that body.businessId and the revoked grant id must belong to the authorised scope (a cross-business id is refused and nothing is written).
  - Update the UAT to match. The code fix follows from the AC. The status route's ownsBusiness gate is not in dispute.

**G2. Stale story text after the override** (story-a55c2f35). The `## Reconciliation Decisions` section still says the grant and status routes "apply no ownership check" and that "a refused grant is a 500". Neither is true since report-4f1b02e8. The Description's Grants and Login-status bullets should state the gate, and the decision should record the change.

**G3. Planned ACs left pending with no UAT (plan items 1 and 7):**
- AC-2165 (story-7102ffe3/387c9dfe: owning the 1st Contact business is an ordinary owner membership, indistinguishable to a caller).
- AC-2168 (no single predicate answers both ownership and bypass entry).
- AC-2229 (story-fde7370b / story-e674c60a: createDraft reports creation; provisioning onto an existing starter slug leaves the definition and pages unchanged).
- Only FC tests exist: `tests/test_UAT_FC_REQ-185_platform_operator.workers.test.ts:78,91,122` and `tests/test_UAT_FC_BUG-51_local_store_is_preserved.workers.test.ts:183`. The BUG-51 one re-creates the sequence at store level instead of going through createStarterSite/provisionBusiness.
- Remediation: write `test_UAT_AC2165_`, `test_UAT_AC2168_` and `test_UAT_AC2229_` through the real entry points, then activate the ACs.

**G4. AC-2219 evidence is insufficient** (story-83ff6262; `tests/test_reconciliation_customer_portal.workers.test.ts:274`).
- The test never presses Delete account.
- It inspects the text of `capabilities.js` for `method: 'GET'`, which is source inspection.
- Its "all requests are GET" log records the test's own requests, not the client's.
- The footprint check proves only that loading the page writes nothing. A click handler that POSTs a delete would pass.
- Remediation: drive the served page, press Delete account and Close, capture the client's outgoing requests, assert no non-GET request and the account row unchanged, and assert the builder still loads, as the AC's Verification states.

**G5. Intent behaviour missing: "never TENANT_ID"** (REQ-183 D2/§7; story-83ff6262).
- The portal must resolve to the business the caller is an account OF, never env.TENANT_ID.
- In the AC-2212 UAT the caller's tenant and TENANT_ID are both PLATFORM, so a regression to reading TENANT_ID would pass.
- The one-level-down case (an account of a customer's business gets that business's portal) has no AC.
- Remediation: add an AC with a UAT where the caller's tenant is not TENANT_ID.

**G6. AC-2230 overstates the code** (story-e674c60a).
- The AC says every builder request goes through one transport.
- `apps/control-app/src/builder/reader.js:115,209` calls fetch directly for material file bytes, bypassing `send()` (`api.js:88`), so a 401 there renders GONE and raises no session strip.
- BUG-52's intent says nothing outside api.js calls fetch, so this is a code-vs-intent divergence absorbed into the AC as if true.
- Remediation: flag the discrepancy in the story, and either narrow the AC to the requests that actually route through send() with the reader exception recorded, or keep the AC and let it fail against the code.

**G7. Supersession (Step 4c): active ACs still pinning the retracted composite invite** (story-7b1025b8).
- AC-1748's Verification refers to "the business the invite created … the grant the invite created".
- AC-1760's Verification has an invite plus acceptance reaching the builder. That contradicts AC-2173: an invite alone is refused no_membership. Its test passes only via the inviteAccount fixture.
- Both were authored under the earlier composite-invite intent (STORY-146 / REQ-170's original invite section) and are unambiguously retracted by REQ-186 ("the invite writes no memberships and no entitlements").
- Remediation: rewrite their Verification to the invite + provisionBusiness sequence. If their criterion itself pins the composite, set `status: superseded` with `superseded_by_uid: bundle-39edf66d`.
- AC-1741 (an account label supplied with the invite) and AC-2075 have the same stale wording, less severe.

## Ungrounded Stories

None found. Every story claim is supported by intent or code.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Scope & fulfilment gate (upgrade) | story-7102ffe3, story-387c9dfe | ✓ (2 of 4 new ACs pending, G3) |
| 2. Invite (upgrade) | story-7b1025b8 | ✓ |
| 3. Contacts tab read (feature) | story-0034d937 | ✓ |
| 4. Contacts tab writes (feature) | story-a55c2f35 | ✓ (G1, G2) |
| 5. Contact axes (feature) | story-0ea74f39 | ✓ |
| 6. Customer portal (feature) | story-83ff6262 | ✓ (G4, G5) |
| 7. Local store safety (upgrade) | story-e674c60a, story-fde7370b | ✓ (AC-2229 pending, G3) |
| 8. Workspace chrome (upgrade) | story-e674c60a | ✓ (G6) |

## Mode Override Audit

1 override audited, 0 touched a trust boundary. report-4f1b02e8 (code_frozen, rung 1, router.ts):
1. Only named files were touched (`unnamed_files_touched` is empty). PASS.
2. Earlier tests pass: granted_head 888d9b9e is an ancestor of 319fe630, scored by report-8cc0c4f8 (220/0). PASS.
3. Consistent with intent: **FAIL**, see G1. The status-route gate and the InvalidGrantError→400 mapping are fine. The grant-route gate admits every customer owner to a self-grant, which REQ-183 §6 and REQ-180 D2 forbid.
4. Within the stated scope. PASS.
5. `trust_boundary_touched` is false. PASS.
6. Files were confined to `files`, and the behaviour is demanded by AC-2200. PASS mechanically, but AC-2200 itself carries the G1 divergence.

This is recorded as `override_misjudged` (item 3).

## Judgment Calls

- AC-2158's static source scan is accepted. "A second read fails the build" is a structural claim, and AC-2149/AC-2121 supply the behavioural evidence.
- The CSS-rule parsing in AC-2187/2211/2232 is accepted as the AC's own stated Verification, alongside runtime classList checks. jsdom does not resolve `var()` colours for AC-2186; this is minor.
- Minor and not failing: the `ensurePlatformOperator` skip when any non-owner membership row exists (identity.ts:729); a refused listing leaves the switcher on the new business (app.js:737-756); the counter check and import write are not atomic (router.ts:1021-1037); every InvalidGrantError maps to 400, including the internal read-back failure; stale test names in the business_fulfilment guards; the portal copy "not shown here yet" (portal.ts:110); the AC-2172 non-owner 403 may come from scope refusal rather than the owner check.

## Verdict

FAIL. Coverage and evidence gaps were found:
- G1: grant routes absorb a self-mint divergence contrary to REQ-183 §6 and REQ-180 D2; override report-4f1b02e8 misjudged on item 3.
- G2: stale story-a55c2f35 decisions.
- G3: AC-2165, AC-2168 and AC-2229 are pending with no UATs.
- G4: AC-2219's UAT never exercises Delete account.
- G5: "never TENANT_ID" is unpinned.
- G6: AC-2230 claims a single transport the code does not have.
- G7: AC-1748 and AC-1760 still pin the retracted composite invite.

The fix loop will address these.
