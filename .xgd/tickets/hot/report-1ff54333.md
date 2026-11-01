---
uid: report-1ff54333
id: REPORT-7868
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-01T22:53:08.795728+00:00'
updated_at: '2026-11-01T22:53:08.795728+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-39edf66d
  anchor_uid: bundle-39edf66d
  overrides_audited: 1
  trust_boundary_overrides: 0
  prior_review_gaps_resolved:
  - G1
  - G2
  - G3
  - G4
  - G5
  - G6
  - G7
  unrecorded_production_change:
    commit: 0ebff60cf67022c8042f700f830dc4ae9f321607
    workflow: fix_reconciliation_review
    files:
    - apps/control-app/src/router.ts
    - apps/control-app/src/people.ts
    - apps/control-app/src/builder/people.js
    mode_override_report: null
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (none; commits mode)
**Anchor**: bundle-39edf66d
**Stories Reviewed**: 9 (story-7102ffe3, story-387c9dfe, story-7b1025b8, story-0034d937, story-a55c2f35, story-0ea74f39, story-83ff6262, story-e674c60a, story-fde7370b)

Intent: the bundle-39edf66d body (REQ-185, REQ-170, REQ-183, REQ-186, BUG-51, REQ-188, REQ-189, BUG-52, BUG-53, BUG-54, BUG-56). The bundle has no comments.

Evidence: quality report-c0b5b97b at 87919984 passed 230, failed 0, skipped 0, with lint and build clean. That commit comes after every production change on this branch: `git diff 0ebff60..HEAD` touches no file under apps/, packages/, tools/, db/ or bin/. Every AC number named below is in its test_filter.

This is the second review pass. The previous review (FAIL, gaps G1–G7, plus override_misjudged report-fb9c667a) was re-checked gap by gap. All seven gaps are resolved.

**1 override audited, 0 touched a trust boundary.**

## Behavior Inventory

77 behaviours were identified in the code across the 8 plan items: the platform_admin split, the invite transition, the Contacts tab read side, the Contacts tab write side, the contact axes, the customer portal, local store safety, and workspace chrome. I re-read the current grant, status and record routes (router.ts:1336-1520, people.ts:636-761), plus the new UATs for the previous gaps.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Owner membership on the platform business; platform_operator read only by scope entry; ownsPlatformBusiness gate; role null on bypass; PLATFORM_ADMINS seeding | Covered | story-7102ffe3, story-387c9dfe | AC-2121/2149/2158/2166/2167 as before. AC-2165 and AC-2168 are now active, with workerd UATs (test_reconciliation_ownership_and_bypass_split.workers.test.ts:160,201) that drive /api/people and add-a-business through a real Worker and real D1. The AC-2168 three-person matrix tells the owner-only, operator-only and both cases apart. |
| 2 | Invite as an owner-gated, idempotent contact-to-invited transition; no membership or grant; canInvite/canFulfil; no mail sent | Covered | story-7b1025b8 | AC-2169..2176 plus the restated AC-1742/1743/1744/1745/2115. AC-1740/2078/2079 are superseded with superseded_by_uid bundle-39edf66d. `provisionInvite` survives only as a comment in identity.ts:20 and as the tests/support/invite-account.ts fixture. |
| 3 | Contacts list and detail, scoped and isolated; joined business/grant table; labels; styling | Covered | story-0034d937 | AC-2177..2187. |
| 4 | Grant open/revoke (operator-gated and confined to scope), record edit, status route (owner-gated), fulfil control | Covered | story-a55c2f35 | AC-2200 is restated and AC-2233 is new. The UATs (contacts_tab_editing.workers.test.ts:554,590,623) assert a 403 for the customer owner and for a member with the grant count unchanged, a 200 for the operator, a 400 "No such business among these contacts." / "No such grant." for out-of-scope ids with the row still active, and a 403 on the status route for a non-owner. The jsdom check at contacts_tab_editing.test.ts:335 confirms no Withdraw control for non-operators. |
| 5 | Access and pipeline axes, migration 0009, facets | Covered | story-0ea74f39 | AC-2203..2211. The interim three-state line (59b9839) is correctly not encoded. |
| 6 | /account portal through PreviewRenderer; account-portal module; Delete account explains and deletes nothing; never TENANT_ID | Covered | story-83ff6262 | AC-2219 now presses Delete account and Close on the served page, records every request the client sends to the real origin, and asserts that only GETs left the page, no form was submitted, the store is unchanged, and /account and / still answer 200 (customer_portal.test.ts:461; a workerd counterpart is at :310). The new AC-2234 seeds Bob into Salon with the Worker's TENANT_ID set to PLATFORM, so a regression to reading env.TENANT_ID would serve the wrong portal and fail (customer_portal.workers.test.ts:252). |
| 7 | Import 409 guard and --force; 1c reset; createDraft created flag and starter guard | Covered | story-e674c60a, story-fde7370b | AC-2227/2228/1402 as before. AC-2229 is now active, and its UATs go through the real provisionBusiness onto a pinned colliding slug. They assert that site_json, pages, version and counter are byte-identical, and that a fresh slug still gets the starter (starter_site_guard.workers.test.ts:40,50,104). |
| 8 | A 401 handled as an ended session (notice at load, strip mid-session); a valid session never misfires; non-401 failures unchanged; one control font-size token | Covered | story-e674c60a | AC-2230 now records the reader.js material-bytes fetch as an explicit exception outside send(), rather than claiming a single transport. AC-2231 covers a valid session across a reload and non-401 failures. AC-2232 covers the font-size token. |

## Ungrounded Stories

None found.

## Prior-review gaps, re-checked

- **G1 (grants self-mintable):** resolved. The grant routes are gated on ownsPlatformBusiness (router.ts:1471, 1508) and confined to scope by businessInScope/grantBusinessInScope (people.ts:736-761). This is consistent with REQ-183 §6 ("REQ-170 is the operator's tool: every account, every grant"; "a surface that can grant itself access is not a portal") and REQ-180 D2. The status route keeps ownsBusiness, per BUG-54/REQ-170.
- **G2:** resolved. The story-a55c2f35 Description and Reconciliation Decisions now state the current gates and record how they changed.
- **G3:** resolved. AC-2165, AC-2168 and AC-2229 are active, with UATs through real entry points.
- **G4:** resolved (see row 6).
- **G5:** resolved. AC-2234 was added.
- **G6:** resolved. AC-2230 states the reader.js exception explicitly instead of overclaiming.
- **G7:** resolved. AC-1748, AC-1760, AC-2075 and AC-1741 now verify through invite + provisionBusiness, and AC-1760 cites AC-2173 (an invite alone is refused no_membership).

## Supersession Check (Step 4c)

PASS. The ACs retracted by REQ-186 (AC-1740, AC-2078, AC-2079) are `superseded` with superseded_by_uid bundle-39edf66d. The plan's `modify` ACs (AC-2121, AC-2158, AC-2149, AC-1742..1745, AC-2115, AC-1402) are restated to the new intent. No active AC still pins the composite invite or the single-flag platform_admin model.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Scope & fulfilment gate (upgrade) | story-7102ffe3, story-387c9dfe | ✓ |
| 2. Invite (upgrade) | story-7b1025b8 | ✓ |
| 3. Contacts tab read (feature) | story-0034d937 | ✓ |
| 4. Contacts tab writes (feature) | story-a55c2f35 | ✓ |
| 5. Contact axes (feature) | story-0ea74f39 | ✓ |
| 6. Customer portal (feature) | story-83ff6262 | ✓ |
| 7. Local store safety (upgrade) | story-e674c60a, story-fde7370b | ✓ |
| 8. Workspace chrome (upgrade) | story-e674c60a | ✓ |

## Mode Override Audit

1 override audited, 0 touched a trust boundary.

report-4f1b02e8 (code_frozen, rung 1, router.ts; batch 0 of story-a55c2f35):
1. Only named files were touched (`unnamed_files_touched` is empty). PASS.
2. Earlier stories' tests pass: report-c0b5b97b at 87919984 passed 230/0, and its filter includes the evidence ACs of the earlier stories (STORY-99, STORY-121, STORY-146, STORY-160, STORY-162). PASS.
3. Consistent with intent. **As originally granted, the grant-route hunk (ownsBusiness on /api/grants and /api/grants/revoke) failed this item.** That failure is already recorded as override_misjudged in report-fb9c667a, and code_frozen was denied for batch 0. That hunk no longer exists at HEAD: commit 0ebff60 replaced it with the operator gate plus the scope confinement. The hunks that survive are consistent with REQ-170 and AC-2198/2199/2200: InvalidGrantError maps to 400, and the status route keeps its ownsBusiness 403 gate. I am not raising the misjudgment a second time, because there is nothing left in the tree for the fix loop to repair. PASS on the current tree.
4. Within the scope the planner stated. PASS.
5. `trust_boundary_touched` and `trust_boundary_mismatch` are both false. PASS.
6. Confined to `files`, and every behaviour is demanded by an AC. PASS.

### Not a failure, but the operator should see this

**Commit 0ebff60 (workflow fix_reconciliation_review) changed production code in a reconcile run without a mode_override record**:
- apps/control-app/src/router.ts: the grant routes moved from the ownsBusiness gate to the ownsPlatformBusiness gate, with scope checks added;
- apps/control-app/src/people.ts: businessInScope and grantBusinessInScope were added;
- apps/control-app/src/builder/people.js: Withdraw is rendered only when canFulfil is true.

The previous review's G1 remediation ("the code fix follows from the AC") invited this change. The override mechanism, however, says a denied rule is decided "at the next rung" by the next plan, not by the review fix step. As a result this authorization change never went through the override checklist or the trust-boundary computation.

I audited it by hand against the same checklist:
- the diff is confined to those three files;
- it contains no trust_boundary_patterns match;
- it is consistent with REQ-183 §6 and REQ-180 D2;
- it is pinned by the AC-2200 and AC-2233 UATs (real Worker, real D1, verified Access token), which pass at 87919984.

It is therefore recorded here, and in `fields.unrecorded_production_change`, rather than failed on. The workflow should not let fix_reconciliation_review edit production code without recording it.

## Judgment Calls

- No AC covers "provisionInvite no longer exists" (REQ-186 acceptance). This is accepted as a code-structure fact. The grep confirms no production symbol is left, and the behaviour that replaced it is fully pinned (AC-2169..2176, AC-1742).
- The REQ-188 DOC-42 amendment is a documentation obligation with no runtime behaviour. Recording it as a decision in story-0ea74f39 rather than as an AC is accepted.
- The BUG-52 harness token lifetime is test infrastructure and carries no AC, as the plan states.
- AC-2158's static source scan is accepted as a structural claim, with behavioural evidence from AC-2149/2121/2168.
- Minor points carried from the previous review, not failing: every InvalidGrantError maps to 400, including the internal read-back failure at people.ts:693; the counter check and the import write are not atomic.

## Verdict

PASS. The stories accurately and completely document the behaviour surface. A developer reading them would have a correct picture of what the operator intended to build. Every gap from the previous review is closed with UATs that run through the real entry points, every plan item produced its story, and no active AC pins retracted behaviour. The one process concern, an unrecorded production change in 0ebff60, is described above for the operator. It was audited by hand and found consistent with intent.
