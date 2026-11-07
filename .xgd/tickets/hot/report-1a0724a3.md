---
uid: report-1a0724a3
id: REPORT-11200
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-07T23:25:29.753309+00:00'
updated_at: '2026-11-07T23:25:29.753309+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-7988e925
  anchor_uid: bundle-7988e925
  overrides_audited: 8
  trust_boundary_overrides: 0
  gaps:
  - kind: evidence
    acs:
    - AC-2342
    story_uid: story-0cd18650
    detail: 'test_UAT_AC2342_ proves the post-accept navigation (/terms -> ''/'',
      elsewhere reload) only by regex over the served inline script text (tests/test_reconciliation_terms_signup_provisioning.workers.test.ts:321-332).
      The script is never executed, so a broken wiring (wrong element id, listener
      not attached, fetch to the wrong path, branch never reached) still passes. Add
      an executed DOM UAT (node project, happy-dom as tests/reconciliation-library-live-feed.test.ts
      uses): load the page served for an unaccepted contact at /terms and at a builder
      URL, stub fetch to resolve ok for TERMS_ACCEPT_PATH, spy on location.assign/location.reload,
      click #accept, and assert assign(''/'') at /terms and reload() elsewhere, plus
      that a non-ok response re-enables the button and reveals #error. Update AC-2342''s
      Verification to describe the executed check.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bundle-7988e925 (BUNDLE-38: REQ-201, REQ-200, REQ-199, BUG-57, BUG-62, REQ-203, REQ-202)
**Stories Reviewed**: 8. The seven story slots given (story-7b1025b8 appears twice) plus story-0ea74f39 (STORY-165) and story-0cd18650 (STORY-161), which the plan targets but the list leaves out.

8 overrides audited, 0 touched a trust boundary.

This is the second review of this bundle. All three findings from the first review (report-770ee6b7) are verified fixed in the tree (fix commit 2d0ebd2419):
- AC-2154 is `superseded`, with `superseded_by_uid: bundle-7988e925`.
- `db/migrations/0002_session_rotation.sql` is deleted. `0001_baseline.sql` keeps only the nine-column `sessions` DDL and its four indexes, and it no longer refers to 0002.
- AC-2341 and AC-2342 are `active` and have UATs.

One new evidence gap remains (AC-2342, below).

## Behavior Inventory

46 behaviours in the intent (bundle body and comments) and in the plan's code inventory for commits 9fdf31c8..7f6e01af. The version bumps are excluded.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Live Library: an outside write enters, leaves or redraws one row; selection, rail and scroll survive; filter-excluded events are inert; reset re-arms; no EventSource means the old tab | Covered | story-1500b111 | AC-2324 |
| 2 | `{material, seq}` cursor read before the list; SSE `ready` frame; seq as `id:`; Last-Event-ID beats ?since; non-integer cursor is a 400; heartbeats | Covered | story-1500b111 | AC-2325 |
| 3 | Event row equals the list row with no second read; cause and kind carried; body re-read only for the open detail, never while it is being edited | Covered | story-1500b111 | AC-2326 |
| 4 | Feed scoped to the business | Covered | story-1500b111 | AC-2327 |
| 5 | Business switch closes the feed in clear(), before the re-read | Covered | story-1500b111 | AC-1715 (modified) |
| 6 | Baseline has ticket_changes and ticket_change_floor | Covered | story-1500b111 | AC-2328 |
| 7 | account-chrome declared by capabilities.accounts (a closed record); three states in the bytes; no site or business branch; builder link follows the person | Covered | story-179b8c06 | AC-2329 |
| 8 | No-JS POST form; 'check your email' whatever the status; only a network failure differs | Covered | story-179b8c06 | AC-2330 |
| 9 | Catalogued with an L2 preset; conformance | Covered | story-179b8c06 | AC-2331 |
| 10 | L1 `a` control with an allowlisted href | Covered | story-179b8c06 | AC-2332 |
| 11 | Apex served from APEX_SITE_KEY on every non-/site/ path; 404 when unset; APEX_BODY gone | Covered | story-d34eccd8 | AC-2333; AC-913 superseded |
| 12 | Read-only, host-bound session reader; a failed read is signed out | Covered | story-d34eccd8 | AC-2334 |
| 13 | Session-dependent responses: private, no-store, vary cookie, no etag, no shared cache; pages without chrome unchanged | Covered | story-d34eccd8 | AC-2335, AC-909, AC-911 |
| 14 | Add creates a Lead, sends nothing, and takes no flag | Covered | story-7b1025b8 | AC-2336 |
| 15 | Selection-gated Invite; read-only From; template prefill; To-List; Send N; one recipient per message; template seeded on GET | Covered | story-7b1025b8 | AC-2337 |
| 16 | Edits apply to one send; a body missing {{cta_url}} is refused | Covered | story-7b1025b8 | AC-2338 |
| 17 | Primary address only; refusal by name; per-contact outcomes; selection survives a send in which nothing was sent | Covered | story-7b1025b8 | AC-2339 |
| 18 | Invite acts on existing contacts only; owner gating on add and invite | Covered | story-7b1025b8 | AC-2169, AC-2172; AC-2175 superseded |
| 19 | Sent and failed sends move the contact to Invited; a refused contact does not move; re-invite keeps the stamp | Covered | story-0ea74f39 | AC-2205 |
| 20 | Truthful refusal sentence, including the scope refusal; reason logged once in admit, with platformAdminSeed | Covered | story-7b1025b8 | AC-1758, AC-1759 |
| 21 | A contact holding nothing who has not signed up is admitted to the terms only; signed-up-empty, withdrawn and lost memberships are refused | Covered | story-7b1025b8 | AC-2340; AC-2173 and AC-2154 superseded |
| 22 | Accept provisions the account's own business before the stamp: idempotent; owner membership; open-ended grant; starter site; name or placeholder; no accounts row; failure records nothing; operator gets nothing | Covered | story-0cd18650 | AC-2341 (strong executed UAT) |
| 23 | Accepting from /terms goes to the builder root; elsewhere the page reloads | **Partial (evidence)** | story-0cd18650 | AC-2342: the navigation is asserted only on script text. See Evidence |
| 24 | Sign-in issue cannot be told apart for known, unknown, inactive, capped or failing addresses; cap of 5 per hour; host-tenant resolution | Covered | story-e0ca0a36 | AC-2343..2346 |
| 25 | GET Continue page uses nothing; POST redeems and sets a shared cookie; one refusal page; cross-site POST refused | Covered | story-e0ca0a36 | AC-2347..2350 |
| 26 | Sign-out; session tried before the JWT; a dead cookie falls through to Access | Covered | story-e0ca0a36 | AC-2351, AC-2352 |
| 27 | Invite CTA is a 30-day token; withdrawal ends sessions; CORS only within the cookie domain | Covered | story-e0ca0a36 | AC-2353..2355 |
| 28 | Schema transcription and conformance suite; preflight; cookie vars; ACCESS.md Bypass | Partial (accepted) | story-e0ca0a36 | Covered by FC tests and Technical Context, as a recorded choice. See Judgment Calls |
| 29 | Smoke: draft checks gone; published asset/cache/index/404 checks; --site-key; no check can only skip; each skip names its argument | Covered | story-d5167ced | AC-1336..1340, AC-1425 |
| 30 | Smoke: cache pinned to the Worker's value; control origin derived only for the 1stcontact apex | Covered | story-d5167ced | AC-2356, AC-2357 |

## Ungrounded Stories

None.

## Supersession Check (Step 4c): PASS

REQ-203 overturns 'invited and no more is no_membership', and the ACs pinning it (AC-2173, AC-2154) are both `superseded` with `superseded_by_uid: bundle-7988e925`. REQ-199 retracts 'the dialog states no message is sent' (AC-2175 superseded). REQ-200 retracts the apex holding response (AC-913 superseded). No AC that pins retracted behaviour is still active.

## Evidence Sufficiency (Step 5b): FAIL

The latest scoped quality report (report-cf335330, commit 398cc16165) shows 206 passed and 0 failed, with lint, build and preflight clean. Its filter includes every active AC reviewed here, AC2341_ and AC2342_ among them. No product files have changed since that commit. Spot checks of AC-2324..2326, AC-2329, AC-2341 and AC-1758/1759 found real entry points (worker.fetch in workerd over real D1, or the published render plus DOM), no mocking of internal code, and assertions that would fail if the behaviour were removed.

**Gap: AC-2342 (story-0cd18650).** `test_UAT_AC2342_accepting_from_the_terms_path_goes_to_the_builder_root_and_elsewhere_reloads_the_requested_url` (tests/test_reconciliation_terms_signup_provisioning.workers.test.ts:307) proves the AC's central claim, where accepting sends the person, only with a regex over the inline script text the Worker serves (lines 321-332): `if (res.ok) { if (location.pathname === "/terms") location.assign('/') else location.reload() ...`. The script is never run, so this is a source-inspection assertion. A broken implementation passes it. For example, `getElementById` names the wrong id, the listener is never attached, the fetch targets the wrong path, or the branch sits in dead code. The rest of the test (accept, then the root serves the builder, /terms shows the record, TABS[0] is SITE_TAB) is behavioural and sound. The AC's own Verification excuses the text check because workerd does not execute page scripts. The repo already runs happy-dom tests in its node project, though (for example tests/reconciliation-library-live-feed.test.ts), so the executed check is available.

**Remediation.** Add an executed UAT in the node project:
1. Render the interstitial HTML that terms.ts serves for an unaccepted contact, once at `/terms` and once at a builder URL.
2. Load it in happy-dom, stub `fetch` to resolve `{ok: true}` for `TERMS_ACCEPT_PATH`, and spy on `location.assign` and `location.reload`.
3. Click `#accept`, then assert `assign('/')` at /terms and `reload()` with no assign elsewhere. Also assert the POST body carries the version, and that a non-ok response re-enables the button and un-hides `#error`.
4. Rewrite AC-2342's Verification to describe the executed check. The served-script regex can stay as a structural extra, but it is not the evidence.

## Mode Override Audit

| Report | Rule / rung | Files touched | Items | Verdict |
|--------|-------------|---------------|-------|---------|
| report-078b06e6 (story-179b8c06, b0) | code_frozen / 1 | packages/site-schema/src/schema.ts (`.strict()`) | 1-6 pass; REQ-200 asks for a closed record | OK |
| report-96aef569 (story-179b8c06, b0) | code_frozen / 1 | test file only | pass | OK |
| report-87a5036b / report-bacbbf6e (story-179b8c06, b1) | code_frozen / 2 | module-assets.ts (cli and generated), build-artifact test | pass; AC-1624 needs a bundle that parses; trust_boundary_touched false | OK |
| report-8a166a9b (story-7b1025b8, b0) | code_frozen / 1 | builder/people.js plus tests | pass; REQ-199 says the selection clears only once something was sent | OK |
| report-de676490 / report-aea06ed9 (story-e0ca0a36, b0) | code_frozen / 2 | 0001_baseline.sql, 0002_session_rotation.sql | Item 6 already found misjudged (report-770ee6b7, recorded in report-0f17bc9b and report-f3af340d, rule denied for that batch). Remediated: 2d0ebd2419 deleted 0002. The net change left in the tree is the 0001 sessions DDL plus two indexes, which REQ-202 ('a migration applies the component's SCHEMA_STATEMENTS') and AC-2347..2354 require | Misjudgment remediated; not re-raised |
| report-47493afa (aligned_to_tip, AC-2208) | - | tests only | 1: evidence exists at reconcile-src-BUNDLE-38 (baseline `pipeline_stage ... DEFAULT 'lead'`, `ensurePlatformOperator`). 2: no later in-window intent requires a backfill (REQ-201 §12 says the database was wiped); erratum comment present. 3: AC-2208 rewritten and still active | OK |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Material Library Surface (REQ-201) | story-1500b111 | ✓ |
| 2. Behavior Modules / account-chrome (REQ-200) | story-179b8c06 | ✓ |
| 3. Site Delivery: Public Serving (REQ-200) | story-d34eccd8 | ✓ |
| 4. Contacts: Add, Invite & Send (REQ-199) | story-7b1025b8, story-0ea74f39 | ✓ |
| 5. Admission & Onboarding (REQ-203, BUG-62) | story-7b1025b8, story-0cd18650 | ✓ (ACs present and active; AC-2342 evidence gap above) |
| 6. Passwordless Sign-In (REQ-202) | story-e0ca0a36 (STORY-171, new) | ✓ |
| 7. Platform Smoke (BUG-57) | story-d5167ced | ✓ |

## Judgment Calls

- Library internals (one filter per material type, the 2s tailer) are implementation detail. AC-2324, AC-2325 and AC-2327 pin their observable effects.
- REQ-202's deployment-contract items (schema vs SCHEMA_STATEMENTS, assertPasswordlessContract, preflight, cookie vars, ACCESS.md) are proved by FC tests and recorded in Technical Context, with no AC of their own. This is accepted as before. Recommended, not blocking: add a schema/conformance AC to match AC-2328.
- REQ-203 versus STORY-162 ('only the operator adds a business') is not a contradiction: REQ-203 provisions only an account's first business and adds no control.
- BUG-57's refinement (control origin derived only for the 1stcontact apex) is the operator's own later wording in the same ticket, and AC-2357 follows it. Faithful.
- Non-blocking hygiene for the fix loop or structural validation:
  - `tests/test_reconciliation_business_fulfilment.workers.test.ts:279` (`test_UAT_AC2154_`) still asserts the retracted `no_membership` refusal and imports `invitePerson` from people.ts, which no longer exports it. Its AC is superseded, so delete or retire the test.
  - The test named `test_UAT_AC2173_` (tests/reconciliation-identity-invite-provision-admission.workers.test.ts:397) now asserts AC-2340's behaviour under a superseded AC id. Rename it to AC2340.
  - `tests/test_UAT_FC_REQ-203_signup_provisions_business.workers.test.ts` is a likely FC orphan.
  - The stories list given to this review omits story-0cd18650 and story-0ea74f39.

## Verdict

FAIL. Intent fidelity, coverage, supersession and plan accounting all pass, and the first review's findings are fixed. One evidence gap remains for `fix_reconciliation_review`:

1. **AC-2342 (story-0cd18650, STORY-161):** the post-accept navigation is proved only by regex over served script text. Add an executed happy-dom UAT that clicks `#accept` with fetch stubbed and asserts `location.assign('/')` at /terms and `location.reload()` elsewhere (plus the failure path), and update AC-2342's Verification to match.
