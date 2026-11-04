---
uid: report-cc3cda68
id: REPORT-10917
type: report
title: 'Reconciliation Review: commits (BUNDLE-37)'
created_by: xgd
created_at: '2026-11-04T19:32:44.886768+00:00'
updated_at: '2026-11-04T19:32:44.886768+00:00'
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
**Stories Reviewed**: 14 (STORY-117, 149, 121, 95, 94, 146, 163, 164, 162, 166, 167, 168, 169, 170)

## Behavior Inventory

About 75 behaviours identified across BUG-55, REQ-190..REQ-198. The code was read against each intent section. Schema: db/migrations/0001_baseline.sql. Store: tools/generate/src/store/*. Control app: identity, people, names, events, mail, templates, messages, email-webhook, router. CLI: kb.ts, shared-store.ts, assets.ts. Dev tools: bin/seed, bin/access-sim. The code matches the intent nearly everywhere; the gaps below are in story and AC fidelity and evidence.

## Coverage Map (summary)

| # | Behaviour | Coverage | Story / AC | Notes |
|---|---|---|---|---|
| 1 | kb build search keyed by source; preflight compatibility line | Covered | STORY-117 AC-2235, AC-2236 | |
| 2 | Search then read on both hosts, project KB DEFAULT_SOURCE | Covered | STORY-149 AC-2237 | AC overclaims project KB on Node (Node opens only the system KB) |
| 3 | `1c assets` reports awareness map as indexed, not primed (BUG-55 acceptance) | Absorbed divergence | STORY-117, AC-2101 | See gap G1 |
| 4 | Single baseline, no people, TENANT_ID literal | Covered, weak evidence | STORY-121 AC-2238 | G5 |
| 5 | Opaque keys, single minter, prefix only a reading aid | Covered, weak evidence | STORY-121 AC-2239 | G6 |
| 6 | site_id-only children, R2 by siteId, slug unique per business, siteKeys erasure, integer ordinals | Covered | STORY-121 AC-2240..2243 | |
| 7 | /site/<siteId>/ address; no global claim; starter `home`/Unnamed | Covered | STORY-95 AC-2244; STORY-94 AC-2245, 2246; AC-1422 superseded | |
| 8 | user_emails: casefolded, one primary, admit/invite via any address | Covered | STORY-146 AC-2247, 2248, AC-1744 | |
| 9 | Correcting the address rewrites the primary row; other-addresses pane; name rows; name pane | Covered by pending ACs only | AC-2249, 2250, 2251, 2252 | G4 |
| 10 | Accounts: invite mints acct_, several people per account | Covered | AC-2253, 2254 | |
| 11 | Business owned by account; platform owned by nobody; provisioning refusals; findAccount | Covered by pending ACs only | AC-2255, 2256 | G4 |
| 12 | Entitlement subject names a real account | Absorbed divergence | STORY-146 AC-2115 | G2 |
| 13 | No permission check reads role | Covered | AC-2257 | Source scan; acceptable for a negative structural claim |
| 14 | contact_events append-only, trigger, derived business, emitters, History pane | Covered | STORY-167 AC-2258..2274 | AC-2274 weak evidence (G7) |
| 15 | sendEmail port, Resend/local adapters, MAIL_FROM, secret hook, redaction | Covered | STORY-168 AC-2275..2280 | |
| 16 | Body is HTML in one part | Covered, story text stale | STORY-168 AC-2281 | G8 |
| 17 | Template type, templateFor, renderTemplate refusals, seeds | Covered | STORY-168 AC-2282..2286 | |
| 18 | Email record queued-before-send, webhook ahead of Access, messages pane, bounced flag | Covered | STORY-169 AC-2287..2304 | |
| 19 | bin/seed (idempotent, --remote, no operator, cast), bin/access-sim | Covered | STORY-170 AC-2305..2322 | |
| 20 | delivered-after-bounced overwrites status; send-ok-but-update-fails marked failed | Uncovered | none | Intent silent; minor |

## Gaps (fix loop work items)

**G1. BUG-55 acceptance bullet absorbed (STORY-117, story-c4f329d3).**
- BUG-55's acceptance list says "`1c assets` reports the awareness map as indexed, not primed".
- Code still prints `<id> primed not indexed` (tools/generate/src/cli/assets.ts:693), and active AC-2101 (acceptance_criterion-84506ae8) pins that wording.
- STORY-117's Reconciliation Decisions do not mention the bullet.
- Remediation: add a `## Reconciliation Decisions` entry to STORY-117. Either record a CODE-ISSUE (intent unmet), or record that the map is exempt by design (AC-1304/AC-2101) and the bullet is retired, with the rationale.

**G2. AC-2115 (acceptance_criterion-d384dcb1, STORY-146 story-7b1025b8) claims an invariant the code does not enforce.**
- REQ-194: "`entitlements.account_id` names a real account".
- Nothing enforces it:
  - The column has no FK (0001_baseline.sql:740).
  - `openGrant` writes `spec.accountId` unchecked (apps/control-app/src/people.ts:1022).
  - `POST /api/grants` forwards any string (router.ts:1617).
- The UAT (tests/reconciliation-identity-accounts.workers.test.ts:345) writes a grant whose subject is a person id, and the write succeeds. The test asserts only that the grant is not listed.
- A broken implementation passes, and the story presents the code's behaviour as the intent.
- Remediation: flag it as a CODE-ISSUE divergence in the story's Reconciliation Decisions. Restate AC-2115 to what the code proves (grants are read by account key; the capacity grant keeps a NULL subject). Record unvalidated subject writes as an intent gap against REQ-194.

**G3. AC-2182 (acceptance_criterion-db93ad50, STORY-163 story-0034d937) still active and contradicts REQ-193 and the restated AC-2188.**
- It says Who they are shows "the address and the display name".
- REQ-193 removed users.display_name, and AC-2188 now says no name field appears in that section.
- Its UAT (tests/test_reconciliation_contacts_tab.test.ts:415) checks only the email.
- Remediation: restate AC-2182 (primary address; the name lives in Their name, AC-2252), or set it `superseded` with `superseded_by_uid: bundle-5052a63c` (REQ-193).

**G4. Planned ACs for items 3 and 4 are `pending` with no UAT.**

| AC | uid | Story |
|---|---|---|
| AC-2249 | acceptance_criterion-c16be885 | STORY-164 |
| AC-2250 | acceptance_criterion-4fc9e350 | STORY-163 |
| AC-2251 | acceptance_criterion-0bc82a94 | STORY-164 |
| AC-2252 | acceptance_criterion-a7e49359 | STORY-164 |
| AC-2255 | acceptance_criterion-295b600f | STORY-162 |
| AC-2256 | acceptance_criterion-211aa877 | STORY-162 |

- `grep -rlE "test_UAT_AC(2249|2250|2251|2252|2255|2256)_" tests/` returns nothing.
- These carry declared REQ-191/193/194 behaviour: primary-row correction, other addresses, name supersession, name pane, business ownership, provisioning refusals.
- FC suites exercise the behaviour, but the matrix has no evidence-bearing AC for it.
- Remediation: add test_UAT_AC22xx_* UATs (the FC suites show the scenarios) and activate the ACs.

**G5. AC-2238 (acceptance_criterion-bae5941a, STORY-121) "seeds no people" is proven by regexing SQL text.**
- The source-text check is at tests/test_reconciliation_baseline_schema.test.ts:114-125.
- The AC's own verification asks to apply the baseline and count rows.
- Remediation: apply 0001_baseline.sql to a fresh D1/sqlite. Assert 1 tenants row and 0 rows in users, user_emails, memberships and entitlements.

**G6. AC-2239 (acceptance_criterion-0035140e, STORY-121): two clauses lack real evidence.**
- "Exactly one minter" is a grep for crypto.getRandomValues (test_reconciliation_baseline_schema.test.ts:140-151).
- "Nothing branches on the prefix" is untested. The UAT test_UAT_AC2239_the_id_prefix_is_a_reading_aid_and_nothing_branches_on_it exercises only the test helper isOpaqueId.
- Remediation: move those clauses to a recorded Reconciliation Decision (structural, not behavioural), or add a behavioural scenario (e.g. same behaviour for ids differing only in prefix).

**G7. AC-2274 (acceptance_criterion-bf747dfb, STORY-167 story-4630e921): the "every class has a style rule" half regex-matches builder.css source.**
- The UAT is at tests/reconciliation-contact-history-pane.test.ts:254.
- Remediation: drop the stylesheet clause from the AC, or prove it via computed styles with the stylesheet injected.

**G8. STORY-168 (story-7d255580) / AC-2281 (acceptance_criterion-a9a7dbf2): the story text is stale after the granted override.**
- The AC verification note still says the adapter submits plain text.
- The "CODE-ISSUE: body format contradiction" decision still says the fix never landed.
- Commit 1e6ff1897c (report-132efb58) landed `html: message.body`.
- Remediation: update both to record the fix. Optionally assert `payload.text` is undefined in test_UAT_AC2281 (tests/test_reconciliation_outgoing_messages.workers.test.ts:216).

## Supersession Check (Step 4c)

- AC-1422 (acceptance_criterion-51835b53, STORY-94) is `superseded` with superseded_by_uid = bundle-5052a63c (REQ-190 deletes the global slug claim). PASS.
- No other active AC under the REQ-190 stories pins the claim table, SlugClaimedError/409, tenant_id on child rows, or slug-prefixed storage.
- AC-2182 is listed as G3 (contradicted by REQ-193 and AC-2188).
- AC-1746 wording ("grants against an account"; UAT mints business with newId('acct')) and AC-1448 ("identified by account and slug") are stale wording. Their behaviour still holds; recommended restatement, not failures.
- No active AC pins a plain-text body or the two-phase seed.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|---|---|---|
| 1. Knowledge read seam (upgrade) | story-c4f329d3 STORY-117, story-3cf3d57b STORY-149 | ✓ updated_by bundle (G1 open) |
| 2. Site keys & published address (upgrade) | story-fde7370b, story-d34eccd8, story-5349d01f | ✓ |
| 3. Addresses & names (upgrade) | story-7b1025b8, story-0034d937, story-a55c2f35 | ✓ stories updated; ACs pending (G4) |
| 4. Accounts (upgrade) | story-7b1025b8, story-387c9dfe, story-83ff6262 | ✓ stories updated; ACs pending (G4) |
| 5. Contact history (feature) | story-4630e921 STORY-167 | ✓ |
| 6. Mail port + templates (feature) | story-7d255580 STORY-168 | ✓ |
| 7. Email record & webhook (feature) | story-219b4217 STORY-169 | ✓ |
| 8. Dev fixture (feature) | story-5b5be809 STORY-170 | ✓ |

## Mode Override Audit

1 overrides audited, 0 touched a trust boundary.

report-132efb58 (code_frozen, batch 0, rung 1, apps/control-app/src/mail.ts):
1. unnamed_files_touched is empty; the test edit is outside code_frozen scope. PASS.
2. Scoped quality report-850840f0 passed 287/287, including AC2275-2278, AC2281 and AC2286. Node mail suites were also re-run here: 19/19 pass. PASS.
3. Consistent with REQ-197 "The body is HTML, and it is one part", which supersedes REQ-196's plain-text decision. PASS.
4. Diff confined to `text:` -> `html:` plus the doc comment, as the planner stated; no multipart or derived text was added. PASS.
5. trust_boundary_touched false. PASS.
6. Only the named file changed; no behaviour beyond AC-2281. PASS.

Not misjudged. Follow-up is the stale story text (G8).

## Judgment Calls

- **Documentation-deliverable ACs accepted.** AC-2280's runbook clause (MAIL.md mentions SPF/DKIM/DMARC) and AC-2322 (the ACCESS.md pointer) are checked by text match. These are documentation deliverables with no runtime behaviour, so they are not treated as failures. Recommend labelling them explicitly as documentation ACs.
- **AC-2257 source scan accepted.** "Nothing reads role" is a negative structural claim with no runtime equivalent. Accepted, but brittle (it counts exactly 3 `owner` occurrences).
- **Minor intent-silent behaviours left as notes.** Delivered-after-bounced overwrites the status; send accepted but update failed leaves the record failed with no provider_id. The intent is silent on both, so these are notes, not gaps.
- **Minor wording and evidence notes:**
  - The AC-2293 "registered" vs AC-2298 "active" wording should be reconciled.
  - STORY-167 says REQ-198 delivery events write through recordEvent, whereas STORY-169 defers email.* events to REQ-199; correct the sentence.
  - AC-2237 overclaims the project KB on the Node host.
  - Mislabelled test: test_UAT_AC2241_there_is_no_global_slug_claim_table evidences AC-2245.
  - Stale comments: 0001_baseline.sql:787, d1r2-store.ts:63.
- **Workers suites not executed in this session.** They could not run in this review's sandbox (local port binding EPERM), so their evidence was judged by reading the tests plus scoped quality report-850840f0 (287 pass, 0 fail, commit 7cbd86f). Node and jsdom suites were run here: all pass (12 + 37 + 19 + 24 + 39 tests).
- **Workflow edit outside an override.** vitest.node.config.mts gained a globalSetup (tests/global-setup-generated.ts) in fix_quality_batch commit 67eaf1651c. It is test configuration, not product code, but the bundle's reconcile_error shows the router treated it as production code edited without an override. Not a story-coverage finding; flagged for the operator.

## Verdict

FAIL.
- Two intent divergences are absorbed without a flag: G1 (BUG-55's indexed-not-primed bullet) and G2 (AC-2115's entitlement subject is not enforced as a real account).
- One active AC contradicts the restated intent: G3 (AC-2182).
- Six planned ACs are pending with no UAT: G4.
- Source-inspection-only evidence remains for parts of AC-2238, AC-2239 and AC-2274 (G5-G7).
- STORY-168 text is stale after the override: G8.

The code itself is largely faithful to the intent; the fix loop work is in story decisions, AC wording and status, and UATs.
