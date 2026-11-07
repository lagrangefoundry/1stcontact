---
uid: report-770ee6b7
id: REPORT-11186
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-07T22:27:51.046833+00:00'
updated_at: '2026-11-07T22:27:51.046833+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-7988e925
  anchor_uid: bundle-7988e925
  overrides_audited: 8
  trust_boundary_overrides: 0
  override_misjudged:
  - report_uid: report-de676490
    rule: code_frozen
    batch_index: '0'
    reason: 'item 6: db/migrations/0002_session_rotation.sql adds behaviour (converging
      an already-deployed old-shape sessions table) that no AC or intent in scope
      demands; copied verbatim from out-of-window reference commit 59f8754161 (REQ-231)'
  gaps:
  - kind: supersession
    ac: AC-2154
    story_uid: story-387c9dfe
    authoring_intent: bundle-94dbe947
    superseded_by_uid: bundle-7988e925
    detail: Pins 'invited-only admission is refused no_membership', retracted by REQ-203;
      still active
  - kind: evidence
    acs:
    - AC-2341
    - AC-2342
    story_uid: story-0cd18650
    detail: Pending with no test_UAT_AC2341_/AC2342_; REQ-203 provisioning-on-accept
      and /terms->root unproven; plan item 5 incomplete
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bundle-7988e925 (BUNDLE-38: REQ-201, REQ-200, REQ-199, BUG-57, BUG-62, REQ-203, REQ-202)
**Stories Reviewed**: 8 (STORY-144 story-1500b111, STORY-85 story-179b8c06, STORY-95 story-d34eccd8, STORY-146 story-7b1025b8, STORY-165 story-0ea74f39, STORY-161 story-0cd18650, STORY-171 story-e0ca0a36, STORY-119 story-d5167ced)

8 overrides audited (7 mode_override + 1 aligned_to_tip), 0 touched a trust boundary.

## Behavior Inventory

46 behaviours found in the intent (the bundle body, plus erratum COMMENT-7945) and in the plan's code inventory for commits 9fdf31c8..7f6e01af. The version-bump commits are excluded.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Library subscribes to a change feed; outside writes splice one row; enter/exit/update; selection, rail and scroll survive; filter-excluded events are inert | Covered | story-1500b111 | AC-2324 |
| 2 | `/api/material` returns `{material, seq}`; SSE feed with a `ready` frame; Last-Event-ID beats `?since`; a non-integer cursor gets 400 | Covered | story-1500b111 | AC-2325 |
| 3 | Event row equals the list row with no second read; body re-read only for the open detail; skipped while the editor is open | Covered | story-1500b111 | AC-2326 |
| 4 | Feed is scoped to the business; a second tenant's writes never arrive | Covered | story-1500b111 | AC-2327 |
| 5 | Business switch closes the feed before the re-read (also when the re-read fails); destroying the panel closes it; reset re-arms it | Covered | story-1500b111 | AC-1715 (modified), AC-2324 |
| 6 | Baseline carries ticket_changes / ticket_change_floor | Covered | story-1500b111 | AC-2328 |
| 7 | account-chrome module: gated by `capabilities.accounts`, all three states in the snapshot, record closed, no site or business branch | Covered | story-179b8c06 | AC-2329 |
| 8 | No-JS POST form; "check your email" at any status; only a network failure reads differently | Covered | story-179b8c06 | AC-2330 |
| 9 | Catalogued beside contact-form, with an L2 preset and the conformance set | Covered | story-179b8c06 | AC-2331 |
| 10 | L1 `a` link control with an allowlisted href | Covered | story-179b8c06 | AC-2332 |
| 11 | Apex served from APEX_SITE_KEY across every non-/site/ path; 404 when unset; APEX_BODY removed | Covered | story-d34eccd8 | AC-2333; AC-913 superseded |
| 12 | Read-only session reader with a host-bound cookie; failure reads as signed out; builder marker only for an operator | Covered | story-d34eccd8 | AC-2334 |
| 13 | Session-dependent responses are private, no-store, vary on cookie, carry no etag and stay out of the shared cache; pages without chrome are unchanged; HEAD length | Covered | story-d34eccd8 | AC-2335, AC-911 |
| 14 | Add creates a Lead and sends nothing; no flag on either route | Covered | story-7b1025b8 | AC-2336 |
| 15 | Selection-gated Invite; From is display-only; template prefill; To-List; Send N; one recipient per message; default template seeded on GET | Covered | story-7b1025b8 | AC-2337 |
| 16 | Edits apply to one send only; a missing `{{cta_url}}` is refused | Covered | story-7b1025b8 | AC-2338 |
| 17 | Primary address only; refusal by name; per-contact outcome lines; selection survives a send in which nothing went out | Covered | story-7b1025b8 | AC-2339 |
| 18 | Invite acts on existing contacts only; owner gating covers add and invite | Covered | story-7b1025b8 | AC-2169, AC-2172 (modified); AC-2175 superseded |
| 19 | Sent and failed sends move the contact to Invited; a refused contact does not move; re-invite keeps the original timestamp | Covered | story-0ea74f39 | AC-2205 |
| 20 | Truthful denial sentence covering the scope refusal; reason logged once in admit, with platformAdminSeed | Covered | story-7b1025b8 | AC-1758, AC-1759 |
| 21 | Invited contact holding nothing is admitted to the terms gate only; withdrawn or lost memberships are still refused | Covered | story-7b1025b8 | AC-2340; AC-2173 superseded |
| 22 | **Accepting the terms provisions the account's own business before the stamp: idempotent on owner_account_id, open-ended grant, named after the contact or a placeholder, no new account row, failure records no acceptance, an operator re-accepting gets nothing** | **Unproven** | story-0cd18650 | AC-2341 is `pending` and no `test_UAT_AC2341_` exists anywhere |
| 23 | **Accepting from /terms goes to the builder root (Site tab)** | **Unproven** | story-0cd18650 | AC-2342 is `pending` and no `test_UAT_AC2342_` exists anywhere |
| 24 | Sign-in issue: known, unknown, inactive, capped and failing addresses are indistinguishable; cap of 5 per hour; resolution scoped to the host's tenant | Covered | story-e0ca0a36 | AC-2343..AC-2346 |
| 25 | GET Continue page uses nothing; POST redeems and sets a domain-scoped cookie; one refusal page for all three cases; cross-site POST refused | Covered | story-e0ca0a36 | AC-2347..AC-2350 |
| 26 | Sign-out; session tried before the Access JWT; a dead cookie falls through to Access | Covered | story-e0ca0a36 | AC-2351, AC-2352 |
| 27 | Invite CTA is a 30-day token link; withdrawal ends sessions; CORS limited to the cookie domain | Covered | story-e0ca0a36 | AC-2353..AC-2355 |
| 28 | Baseline transcribes login_tokens/sessions; conformance suite passes on D1; preflight registration; cookie vars on both halves; ACCESS.md Bypass | Partial | story-e0ca0a36 | Recorded in Technical Context as FC deployment-contract evidence, with no AC (compare AC-2328 for the ticket-change tables). Not failed on its own; see Judgment Calls |
| 29 | Smoke: draft checks removed; published asset, cache, index and 404 checks; --site-key; no check can only skip; each skip names its argument | Covered | story-d5167ced | AC-1336, AC-1338, AC-1339 (modified) |
| 30 | Smoke: published cache pinned to the Worker's value; --control-origin derived only for the 1stcontact apex | Covered | story-d5167ced | AC-2356, AC-2357 |

## Supersession Check (Step 4c): FAIL

| AC | Owning story | Authoring intent | Superseding intent | Retracted claim still pinned |
|----|--------------|------------------|--------------------|------------------------------|
| AC-2154 (`acceptance_criterion` on STORY-162, story-387c9dfe) | story-387c9dfe | bundle-94dbe947 (story intent; later updated by bundle-39edf66d, bundle-5052a63c) | bundle-7988e925 (REQ-203) | "until a business is provisioned, admission for that email is refused with `no_membership`" |

REQ-203 is unambiguous here: "It supersedes REQ-186's refusal ... 'invited and no more is `no_membership`' ... That is the sentence this ticket overturns", and AC-2340 now pins the opposite. AC-2154 is still `active`. Its UAT (`tests/test_reconciliation_business_fulfilment.workers.test.ts:279`, `test_UAT_AC2154_creating_an_account_provisions_its_first_business`) asserts `bare.reason === 'no_membership'` and calls `invitePerson` from `people.ts`, which no longer exports it (it now lives in `invites.ts` with a different signature). AC2154 was not in the batch quality filter, so the contradiction never ran.

Fix: either set AC-2154 to `status: superseded` with `superseded_by_uid: bundle-7988e925`, or (REQ-203's own wording: "What survives ... the invite writes no business, so the admitted set is EMPTY — and it is asserted in that form instead") rewrite it so an invited-only account is admitted with an empty business set and its UAT asserts that.

Non-blocking nit: AC-1760's Verification still carries the stale aside "an invite alone ... is refused `no_membership` (AC-2173)". AC-2173 is superseded; drop the aside.

## Evidence Sufficiency (Step 5b)

Every active AC listed above has a matching `test_UAT_AC{N}_` test. The latest scoped quality report (report-dbd124da, commit 6b3cc6f290, with no product change since) passes 204/204 with lint and build clean. The gaps:

- **AC-2341 and AC-2342 (story-0cd18650, STORY-161) are `pending`, with zero UATs.** The quality filter included `test_UAT_AC2341_` and `test_UAT_AC2342_`, but they matched no test. STORY-161 had no story cycle in this run: its only reports, REPORT-7559..7561, predate it, and it is missing from the stories list this review was given (story-7b1025b8 is listed twice). That leaves REQ-203's central behaviour, provisioning on acceptance, with no proven AC. Fix: generate UATs for AC-2341 and AC-2342 through the terms-accept route (`tests/test_UAT_FC_REQ-203_signup_provisions_business.workers.test.ts` is a usable source of scenarios) and make each AC active once green. Assert at least these: one business named after the contact, with an owner membership and an open-ended grant; no new `accounts` row; a second acceptance after a `TERMS_VERSION` bump provisions nothing; an operator re-accepting gets nothing; a failed provisioning leaves `tos_accepted_at` null; accepting from `/terms` navigates to `/`.
- **Related breakage outside scope:** five other test files still import `invitePerson` from `people.ts`: `test_reconciliation_contacts_tab.workers`, `reconciliation-contact-history-events.workers`, `reconciliation-contact-other-addresses.workers`, `test_reconciliation_customer_portal.workers` and `test_reconciliation_contacts_tab_editing.workers`. Those suites cannot load. They belong to other stories, so they are recorded here for visibility only.

## Mode Override Audit

| Report | Rule / rung | Files touched | Items 1-6 | Verdict |
|--------|-------------|---------------|-----------|---------|
| report-078b06e6 (story-179b8c06, b0) | code_frozen / 1 | schema.ts (`.strict()`) | all pass; REQ-200 asks for a closed record | OK |
| report-96aef569 (story-179b8c06, b0) | code_frozen / 1 | test file only | all pass | OK |
| report-87a5036b / report-bacbbf6e (story-179b8c06, b1) | code_frozen / 2 | module-assets.ts (cli plus generated), build-artifact test | pass; AC-1624 (in-scope regression from account-chrome's client.js) asks for a bundle that parses | OK |
| report-8a166a9b (story-7b1025b8, b0) | code_frozen / 1 | people.js plus tests | pass; REQ-199 says "selection clears only once something was sent" | OK |
| **report-de676490** (story-e0ca0a36, b0) | code_frozen / 2 | 0001_baseline.sql, **0002_session_rotation.sql** | **item 6 FAILS** | **misjudged** |
| report-aea06ed9 (story-e0ca0a36, b0) | code_frozen / 2 | same grant re-issued at 17e01c79; the builder made no further edits | same scope as de676490 | covered by the entry above |
| report-47493afa (aligned_to_tip, AC-2208) | - | tests only (e5d71167e3) | 1: the evidence exists at reconcile-src-BUNDLE-38 (`pipeline_stage ... DEFAULT 'lead'` baseline column; `ensurePlatformOperator`). 2: no in-window intent requires a backfill, and erratum COMMENT-7945 exists. 3: AC-2208 was rewritten and is still active; the post-ruling diff edits tests only | OK |

**Why report-de676490 is misjudged (item 6).** Editing `0001_baseline.sql` to the installed component's nine-column `sessions` table is what the settled REQ-202 tests need (the drift test, the conformance suite, AC2347-AC2354). `0002_session_rotation.sql` adds separate behaviour: it rebuilds a `sessions` table that an already-deployed database created in the old five-column shape. No AC or intent in scope asks for that:

- REQ-202 asks for "a migration [that] applies the component's `SCHEMA_STATEMENTS`".
- The bundle states the database "has been wiped rather than migrated", so no separate migration is needed.
- No test reads `0002` (`git grep` finds no reference outside `db/migrations`).
- The builder's own blocked_by_handoff (REPORT-11143) proposed it only conditionally: "If any deployed D1 already has the old table".

The file is also a verbatim copy of reference commit 59f8754161 (`feat(sessions): adopt rolling credentials ...`, REQ-231, outside this run's window), down to comments citing `[[REQ-231]]` and `purgeExpired`. That breaks rung 2's rule that the reference is read to learn the intent and its code is never copied. The root cause was outside the repo: the shared `auth-passwordless` component moved ahead (REQ-151 upstream). The REQ-910 `external_cause` path was the right one, and its smallest-change rule allows only the `0001` edit.

Fix: drop `db/migrations/0002_session_rotation.sql`, keep the `0001` sessions DDL and its two new indexes, and remove the `0002` cross-reference from the `0001` comment. If a live database really holds the old shape, that convergence belongs to REQ-231's own reconcile.

## Ungrounded Stories

None found. One stale passage: STORY-85's Technical Context still says "Code issue: the capability record is not closed (contradicts REQ-200)", but report-078b06e6 has since fixed that. Update the note to record the resolution (non-blocking).

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Material Library Surface (REQ-201) | story-1500b111 | ✓ (AC-2324..2328 added, AC-1715 modified) |
| 2. Behavior Modules / account-chrome (REQ-200) | story-179b8c06 | ✓ (AC-2329..2332) |
| 3. Site Delivery: Public Serving (REQ-200) | story-d34eccd8 | ✓ (AC-2333..2335; AC-913 superseded) |
| 4. Contacts: Add, Invite & Send (REQ-199) | story-7b1025b8, story-0ea74f39 | ✓ (AC-2336..2339; AC-2169/2172/2205 modified; AC-2175 superseded) |
| 5. Admission & Onboarding (REQ-203, BUG-62) | story-7b1025b8, story-0cd18650 | **PARTIAL**: STORY-146 half done (AC-2340, AC-1758/1759 modified, AC-2173 superseded); STORY-161 half (AC-2341, AC-2342) left `pending` with no UATs |
| 6. Passwordless Sign-In (REQ-202) | story-e0ca0a36 (new STORY-171) | ✓ (AC-2343..2355, completed) |
| 7. Platform Smoke (BUG-57) | story-d5167ced | ✓ (AC-2356/2357 added; AC-1336/1338/1339 modified) |

## Judgment Calls

- Library internals (two filters, one per material type; the 2s tailer) are implementation detail. Their observable effects are pinned by AC-2324, AC-2325 and AC-2327, so leaving them out of the ACs is acceptable.
- REQ-202's deployment-contract items (schema transcription, conformance suite, preflight, cookie vars, ACCESS.md) are covered only by FC tests and a Technical Context note, not by an AC. The story is explicit about this, so it is not failed on its own. For consistency with AC-2328, the fix loop should consider adding a deployment-contract AC (baseline carries login_tokens/sessions as `SCHEMA_STATEMENTS` declares; `assertPasswordlessContract` passes against this D1), or record the choice under `## Reconciliation Decisions`. The schema mismatch the override had to repair is exactly what such an AC would have caught.
- REQ-203 vs STORY-162's "only the operator adds a business": accepted as not contradictory, since provisioning only ever creates an account's first business and there is no self-serve control. AC-2154 is still a real contradiction (above).
- Override 87a5036b/bacbbf6e cites BUG-75 (out of window) but is decided by AC-1624, an in-scope regression that account-chrome's client.js triggered. Not misjudged.

## Verdict

FAIL. Fix list for `fix_reconciliation_review`:

1. **Supersession (Step 4c):** AC-2154 (STORY-162, story-387c9dfe; authored under bundle-94dbe947) still pins "invited-only is refused `no_membership`", which bundle-7988e925 (REQ-203) overturns. Either set `status: superseded`, `superseded_by_uid: bundle-7988e925`, or rewrite it to the empty-admitted-set form REQ-203 prescribes and realign its UAT at `tests/test_reconciliation_business_fulfilment.workers.test.ts:279`.
2. **Evidence:** AC-2341 and AC-2342 (STORY-161, story-0cd18650) are `pending` with no `test_UAT_AC2341_` or `test_UAT_AC2342_`. Generate the UATs, prove them green, and make both ACs active, which completes plan item 5.
3. **Override misjudged:** report-de676490 (code_frozen, batch 0, story-e0ca0a36) failed item 6. `db/migrations/0002_session_rotation.sql` adds live-database convergence behaviour that no in-scope AC or intent demands, copied from an out-of-window REQ-231 commit. Remove it and keep only the `0001` sessions DDL change.
