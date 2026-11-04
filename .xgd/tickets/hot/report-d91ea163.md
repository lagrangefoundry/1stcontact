---
uid: report-d91ea163
id: REPORT-10935
type: report
title: 'Reconciliation Review: commits (BUNDLE-37)'
created_by: xgd
created_at: '2026-11-04T21:08:19.235881+00:00'
updated_at: '2026-11-04T21:08:19.235881+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-5052a63c
  anchor_uid: bundle-5052a63c
  overrides_audited: 1
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bundle-5052a63c
**Stories Reviewed**: 14 (story-c4f329d3, story-3cf3d57b, story-fde7370b, story-d34eccd8, story-5349d01f, story-7b1025b8, story-0034d937, story-a55c2f35, story-387c9dfe, story-83ff6262, story-4630e921, story-7d255580, story-219b4217, story-5b5be809)

Intent source: the bundle body (BUG-55, REQ-190..REQ-198). There are no operator comments; all 23 comments on the bundle are xgd resolve_conflicts / batch_fix responses. Test status is taken from report-4e06dbd6 (scoped, 298 passed, 0 failed).

## Overall

Intent fidelity is good across all 8 plan items. No intent-contradicting behaviour was silently absorbed: the REQ-196 to REQ-197 plain-text to HTML change, the REQ-194 entitlement write-side CODE-ISSUE, and the dropped Node co-ranking premise of BUG-55 are each recorded under Reconciliation Decisions. Every plan item produced its stories and ACs. AC-1422 is correctly superseded.

The review FAILS on Step 5b (evidence sufficiency) for items 1 and 3, and on two ungrounded claims (items 2 and 3) that describe an erasure path that does not exist in the code.

## Gap list (FAIL-worthy; fix loop must address)

1. **evidence, AC-2236 (acceptance_criterion-2f55349d, story-c4f329d3, STORY-117), shared-store compatibility preflight.** The UAT in tests/reconciliation-system-knowledge-base-read-seam.test.ts:253-301 runs the real probe (tools/generate/src/cli/shared-store.ts:162-185) only against the installed, compatible store. The incompatible case replaces the whole probe with a stub that throws. The real detection branches ('exports no indexFor', 'indexFor did not return the index under the key') never run, so a no-op probe would pass. 'Probe runs only after presence passes' and 'no network/embedder' are also unasserted. REMEDIATION: inject the knowledge module or its indexFor, not the probe. Assert ok:false when indexFor is missing, ignores the map, or returns the wrong index. Add a `1c preflight` run with a missing component and assert no 'Index seam:' line and the presence error.

2. **evidence, AC-2235 (acceptance_criterion-8e6a7366, story-c4f329d3).** The AC claims `1c kb build` exits zero and the release command proceeds to packing; plan item 1(a) said 'full release pipeline completes'. The UAT (same file, lines 200-247) calls buildKb() directly, so neither the CLI exit code nor the release path is exercised. REMEDIATION: drive cli(['kb','build']) and assert exit code 0, and run the release form with the stubbed embedder; or narrow the AC text to the stage-completion claim actually proven.

3. **evidence, AC-2237 (acceptance_criterion-3e2afff1, story-3cf3d57b, STORY-149).** The AC claims the combined passage (chunk) search also passes each KB's indexes under its own key. The Worker UAT (tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts:544-626) only calls toolbox.search and get. Reverting the chunk_search override at apps/control-app/src/session-knowledge.ts:242 (`indexes: runtime.chunkIndexes`) to `source:` would still pass. REMEDIATION: add a chunk_search call per KB to the UAT and assert hits from each.

4. **evidence, AC-2250 (acceptance_criterion-4fc9e350, story-0034d937, STORY-163), other addresses in the detail pane.** The UAT at tests/test_reconciliation_contacts_tab.test.ts:441 mounts the real panel but takes `emails` from a hand-built transport double. A personDetail that dropped or misordered non-primary addresses would pass. The server half is asserted only in tests/test_UAT_FC_REQ-191_user_emails.workers.test.ts:246, which is not an AC-named UAT and was not in the scoped run. REMEDIATION: add a test_UAT_AC2250_ workers test that GETs the person detail route for a person with two addresses and asserts `emails` lists them primary first.

5. **ungrounded, AC-2242 (acceptance_criterion-7967e301, story-fde7370b, STORY-121).** The AC states 'An erasure for that business uses this enumeration' in the present tense. REQ-190 says erasure 'is not implemented today' and only settles the layout it will use; the code has siteKeys() and forget but no erasure. A developer would be surprised to find no erasure path. REMEDIATION: reword to 'the enumeration erasure will use' and add a Reconciliation Decision stating that erasure itself is not built. Optionally strengthen the 'nothing stranded' check (tests/test_reconciliation_opaque_site_keys.workers.test.ts:476-527) to snapshot the whole bucket before and after, so objects under an un-enumerated prefix are caught; the 'Bystander' set at :515-521 currently does nothing.

6. **ungrounded, story-a55c2f35 (STORY-164) Technical Context: 'Erasure redacts name text and keeps the rows.'** redactNames (apps/control-app/src/names.ts:364) has no caller in product code; only an FC test uses it. REMEDIATION: reword to say a redaction helper exists but no erasure path calls it yet, recorded as a Reconciliation Decision.

7. **missing-intent (unrecorded), story-0034d937 (STORY-163).** REQ-193 states 'Sort on COALESCE(family_name, display_name)'. The people list is still ordered by created_at (apps/control-app/src/people.ts:338), and neither an AC nor a Reconciliation Decision mentions it. REMEDIATION: record a Reconciliation Decision that name sort is not built (an intent-vs-code gap) or add a flagged AC.

## Lower-severity items (fix while in the loop; not individually blocking)

- story-83ff6262 Reconciliation Decisions says 'no criterion is reworded', but AC-2222 (acceptance_criterion-c0a874e0) was reworded from account to person. Correct the text.
- story-4630e921 Reconciliation Decisions says AC-2260 has no UAT yet; test_UAT_AC2260_ now exists (tests/reconciliation-contact-history-events.workers.test.ts:108). Update it.
- story-4630e921: the placement of the History section under Businesses (people.js:1102/1155) has no AC or decision. Add a clause to AC-2270 or record a decision.
- AC-2269: the UAT calls personDetail directly, and the route answers 404 where the AC says null. Reword the AC or add a route-level assertion.
- story-5b5be809: REQ-192's 2026-09-05 'Added acceptance' clause (the xgd site is present and byte-identical after a wipe) is absent from 'Acceptance, final' and has no recorded decision. Record why it was dropped.
- AC-2320 Verification says 'six seeded addresses'; the cast and the test have five. Correct the text.
- story-7d255580 Reconciliation Decisions and AC-2281 cite commit 1e6ff1897c, which is not on any branch; the landed commit is c967412886.
- Stale UAT names: test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses (it asserts person), and test_UAT_AC2188_only_email_and_name_are_editable... Rename both.
- AC-2239: the single-minter scan only looks for crypto.getRandomValues; add randomUUID. AC-2257: the 'owner' literal-count scan is brittle source inspection backed by a single behavioural case.
- AC-1448 (acceptance_criterion-89fefdc5, BUG-37) still says the retained draft is identified 'by account and slug together'; the code keys it by site id. REQ-190 does not explicitly retract this, so it is not a Step 4c failure; rewording is advised.

## Coverage Map (summary)

| # | Behaviour | Coverage | Story | Notes |
|---|---|---|---|---|
| 1 | search/searchChunks/open take source-keyed indexes; project KB keyed DEFAULT_SOURCE | Covered | story-c4f329d3, story-3cf3d57b | chunk path not evidenced (gap 3) |
| 2 | kb build completes; release proceeds | Partial | story-c4f329d3 | exit and release not evidenced (gap 2) |
| 3 | Preflight compatibility on its own line | Partial | story-c4f329d3 | real detection untested (gap 1) |
| 4 | Single baseline, no seeded people, TENANT_ID literal agrees with wrangler.toml | Covered | story-fde7370b | |
| 5 | Opaque ids from one minter; site_id-only children; R2 by siteId; one-column moves | Covered | story-fde7370b | |
| 6 | Slug unique per business; /site/<siteId>/; no published_sites/409 | Covered | story-fde7370b, story-d34eccd8, story-5349d01f | AC-1422 superseded correctly |
| 7 | Erasure by siteKeys() | Ungrounded as built | story-fde7370b | gap 5 |
| 8 | user_emails: casefolded, one primary, resolve/admit/invite, re-primary | Covered | story-7b1025b8, story-a55c2f35 | |
| 9 | Other addresses in the detail pane | Partial | story-0034d937 | gap 4 |
| 10 | user_names supersession, resolver, name pane, greeting | Covered | story-a55c2f35, story-7b1025b8 | erasure claim ungrounded (gap 6) |
| 11 | Name-based list sort (REQ-193) | Uncovered (not built) | — | gap 7 |
| 12 | accounts table, owner_account_id, biz_ ids, provisioning refusals, /api/businesses person | Covered | story-7b1025b8, story-387c9dfe, story-83ff6262 | entitlement write side recorded as CODE-ISSUE |
| 13 | contact_events append-only, emitters, History pane | Covered | story-4630e921 | |
| 14 | sendEmail port, Resend/local adapters, MAIL_FROM, redaction, MAIL.md | Covered | story-7d255580 | |
| 15 | Template type, templateFor, renderTemplate refusals, seeds | Covered | story-7d255580 | |
| 16 | Email record queued-then-sent, signed webhook ahead of Access, messages pane, bounced flag | Covered | story-219b4217 | |
| 17 | bin/seed idempotent local-only, cast, bin/access-sim with real verifier | Covered | story-5b5be809 | |

## Ungrounded Stories

| Story | Claim | Issue |
|---|---|---|
| story-fde7370b (AC-2242) | Erasure for a business uses the siteKeys enumeration | No erasure exists; REQ-190 says it is not implemented |
| story-a55c2f35 | Erasure redacts name text and keeps rows | redactNames has no product caller |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|---|---|---|
| 1. Knowledge read seam (upgrade) | story-c4f329d3, story-3cf3d57b (AC-2235..2237) | ✓ |
| 2. Site storage keys & published address (upgrade) | story-fde7370b, story-d34eccd8, story-5349d01f (AC-2238..2246; AC-903/905 modified; AC-1422 superseded) | ✓ |
| 3. Person identity (upgrade) | story-7b1025b8, story-0034d937, story-a55c2f35 (AC-2247..2252; AC-2171/2179/2188/2192/1744 modified) | ✓ |
| 4. Accounts (upgrade) | story-7b1025b8, story-387c9dfe, story-83ff6262 (AC-2253..2257; AC-1741/2115/2157/1742/2222 modified) | ✓ |
| 5. Contact history (feature) | story-4630e921 (AC-2258..2274) | ✓ |
| 6. Message composition & sending (feature) | story-7d255580 (AC-2275..2286) | ✓ |
| 7. Email record & webhook (feature) | story-219b4217 (AC-2287..2304) | ✓ |
| 8. Local dev fixture (feature) | story-5b5be809 (AC-2305..2322) | ✓ |

## Supersession Check (Step 4c)

PASS. AC-1422 (acceptance_criterion-51835b53) has status superseded and superseded_by_uid bundle-5052a63c. No other active sibling AC on the affected stories pins behaviour that REQ-190/191/193/194 unambiguously retract. AC-1448's wording is noted above as advisory.

## Mode Override Audit

1 override audited, 0 touched a trust boundary.

report-132efb58 (code_frozen, story-7d255580, batch 0, rung 1, apps/control-app/src/mail.ts) passes all checklist items:

1. Only mail.ts was touched in production (commit c967412886).
2. AC2275-2278, AC2281 and AC2286 passed in report-4e06dbd6. The FC_REQ-196 suite was outside the scoped run; its only body-field expectation is the edited html line.
3. The change is consistent with REQ-197 ('The body is HTML, and it is one part') and AC-2281.
4. It stayed in scope: no text part and no textFrom.
5. trust_boundary_touched false, mismatch false.
6. No behaviour was added beyond AC-2281.

Observation, not an override failure: renderTemplate (apps/control-app/src/templates.ts:200-204) substitutes values unescaped into what is now an HTML body, and no AC or test pins escaping. This becomes reachable when an invite call site supplies user-derived values (REQ-199). Recommend an AC requiring values to be HTML-escaped (and safe in href), or an explicit trusted-values decision, before that lands.

## Other Observations

- The bundle's reconcile_error (story-c4f329d3 batch 0 edited vitest.node.config.mts without a code_frozen override) comes from reconcile commit c18c6dbb57. It added globalSetup ./tests/global-setup-generated.ts, which generates the gitignored control-app shims before tests run. This is test configuration, not shipped runtime code; the guard tripped because the file sits at the repo root. It needs an operator or planner ruling (a named override or a path classification); reverting it would break fresh-checkout test imports.
- Flagged decisions for operator confirmation: story-3cf3d57b drops BUG-55's 'both KBs on both hosts' Node premise (the Node host opens only the system KB), and story-c4f329d3 drops '1c assets reports the map as indexed'. Both are recorded openly.

## Judgment Calls

- Items 5-8 (contact history, mail, email records, dev fixture) are judged PASS: every active AC has a passing UAT through real D1/R2, real bin/seed and access-sim, or the real router, mocking only external boundaries.
- The text checks on committed files (AC-2280 secret scan, MAIL.md, wrangler.toml literal, ACCESS.md, baseline file listing) are accepted because those ACs make claims about the files themselves.
- Gaps 1-4 are material because each covering UAT would pass against a broken implementation of the AC's own core claim.
- Gaps 5-6 are material: a developer reading the stories would believe erasure exists.
- Gap 7 is material because the intent names the sort explicitly and nothing records that it was not built.

## Verdict

FAIL. Intent is faithfully represented and all plan items produced output, but four ACs lack sufficient evidence (AC-2236, AC-2235, AC-2237, AC-2250), two story claims are ungrounded (AC-2242 erasure; story-a55c2f35 name redaction on erasure), and one intent behaviour (REQ-193 name sort) is neither covered nor recorded as a decision. The fix loop should address gaps 1-7, plus the lower-severity text corrections where convenient.
