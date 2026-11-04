---
uid: report-0cfddba5
id: REPORT-10938
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-04T21:34:20.357933+00:00'
updated_at: '2026-11-04T21:34:20.357933+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-5052a63c
  anchor_uid: bundle-5052a63c
  overrides_audited: 1
  trust_boundary_overrides: 0
  gaps:
  - story_uid: story-7d255580
    ac: AC-2276
    ac_uid: acceptance_criterion-96104d2f
    kind: evidence_insufficient
  - story_uid: story-fde7370b
    ac: AC-2240
    ac_uid: acceptance_criterion-4646a3bd
    kind: evidence_insufficient
  - story_uid: story-7b1025b8
    ac: AC-2247
    ac_uid: acceptance_criterion-04740da6
    kind: evidence_insufficient
  - story_uid: story-0034d937
    ac: AC-2179
    ac_uid: acceptance_criterion-5d6bb323
    kind: evidence_insufficient
  - story_uid: story-387c9dfe
    ac: AC-2157
    ac_uid: acceptance_criterion-be56b74c
    kind: evidence_insufficient
  - story_uid: story-7b1025b8
    ac: AC-2257
    ac_uid: acceptance_criterion-02172406
    kind: source_inspection_evidence
  - story_uid: story-a55c2f35
    ac: null
    ac_uid: null
    kind: uncovered_behavior
    detail: Provision a business control offered in any business but findAccount resolves
      only the platform tenant (router.ts:1309, identity.ts:1121, people.js:782)
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none — commits mode)
**Anchor**: bundle-5052a63c (BUNDLE-37: BUG-55, REQ-190, REQ-191, REQ-192, REQ-193, REQ-194, REQ-195, REQ-196, REQ-197, REQ-198)
**Stories Reviewed**: 14. The 8 named in the plan, plus the 6 the upgrade items extend: story-c4f329d3, story-3cf3d57b, story-fde7370b, story-d34eccd8, story-5349d01f, story-7b1025b8, story-0034d937, story-a55c2f35, story-387c9dfe, story-83ff6262, story-4630e921, story-7d255580, story-219b4217, story-5b5be809.

1 override audited, 0 touched a trust boundary.

## Summary

Intent fidelity is strong. No silent divergence absorption was found. Every place where the stories depart from an intent bullet is recorded under `## Reconciliation Decisions`, which all 14 stories have. The plan said the starter site is `home`; the stories correctly follow the intent's later decision (`unnamed` / `Unnamed`). AC-1422 (global slug claim) is correctly `superseded`, with `superseded_by_uid` = bundle-5052a63c. All 8 plan items produced story output.

Every active AC in these stories has a `test_UAT_AC<N>_*` test, and every one was selected in the passing scoped quality run (report-1272558f: 300 passed, 0 failed).

The review FAILS on evidence sufficiency (Step 5b): six active ACs make claims their UATs do not discriminate. It also fails on one material uncovered behaviour, the "Provision a business" lookup scope.

## Behavior Inventory

About 95 material behaviours were identified across the 10 source tickets. Version-bump and merge commits carry no capability.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | BUG-55 read seam: `search`/`searchChunks`/`open` take `indexes` keyed by source (`shipped`, project = DEFAULT_SOURCE); a hit can be read back on both hosts | Covered | story-c4f329d3, story-3cf3d57b | AC-2235/2237. The Node co-ranked clause is retired as a wrong premise and recorded (host.ts:126 opens the system KB only) |
| 2 | BUG-55 shared-store compatibility preflight on its own line | Covered | story-c4f329d3 | AC-2236 |
| 3 | BUG-55 "`1c assets` reports map indexed, not primed" | Recorded divergence | story-c4f329d3 | Retired in Reconciliation Decisions because it conflicts with AC-2101. Reasoned, but it reverses an explicit intent bullet, so the operator should confirm |
| 4 | REQ-190 opaque CSPRNG keys from one minter (ids.ts; identity.ts re-exports) | Covered | story-fde7370b | AC-2239 |
| 5 | REQ-190 single baseline, seeds no people, TENANT_ID literal agrees in [vars] and [env.production.vars] | Covered | story-fde7370b | AC-2238 |
| 6 | REQ-190 child rows carry site_id only; R2 draft/<siteId>/, sites/<siteId>/rev/; rename/slug change/move is one UPDATE | Covered (evidence partial) | story-fde7370b | AC-2240: see gap 2 |
| 7 | REQ-190 slug unique per business, enforced by the DB | Covered | story-fde7370b | AC-2241 |
| 8 | REQ-190 siteKeys() enumeration; forget removes rows and objects | Covered | story-fde7370b | AC-2242: non-blocking evidence note |
| 9 | REQ-190 ordinals stay integer | Covered | story-fde7370b | AC-2243 |
| 10 | REQ-190 /site/<siteId>/; /preview/<slug>/published resolves through the store | Covered | story-d34eccd8 | AC-2244, AC-903 |
| 11 | REQ-190 two businesses publish the same slug; no claim table; starter `unnamed`/`Unnamed` | Covered | story-5349d01f | AC-2245/2246 |
| 12 | REQ-190 R2 buckets emptied at rebaseline | Recorded as a deployment act | story-fde7370b | Not product behaviour; the operator should confirm it was done |
| 13 | REQ-191 user_emails (casefolded, at most one primary, unique per business), admit/invite through any address | Covered (evidence partial) | story-7b1025b8 | AC-2247/2248/1744. "Shows the primary" is not discriminated from "oldest": gap 3 |
| 14 | REQ-191 Other addresses pane; list row shows the primary | Covered (evidence partial) | story-0034d937 | AC-2250 OK; AC-2179: gap 3 |
| 15 | REQ-191 correcting the address rewrites the primary row | Covered | story-a55c2f35 | AC-2249 |
| 16 | REQ-193 user_names: optional parts, superseded, one current, only `changed` former names reach the client; name pane; greeting fallback | Covered | story-a55c2f35, story-7b1025b8 | AC-2251/2252/2171 |
| 17 | REQ-194 accounts table, users.account_id NOT NULL, tenants.owner_account_id, platform owned by nobody, biz_/acct_ | Covered | story-7b1025b8, story-387c9dfe | AC-2253/2254/2255/1741/1742 |
| 18 | REQ-194 provisioning refuses a missing or empty account; findAccount returns an account | Covered | story-387c9dfe | AC-2256 |
| 19 | REQ-194 /api/businesses reports `person` (current name and primary address) | Covered (evidence partial) | story-387c9dfe | AC-2157: gap 4 |
| 20 | REQ-194 no permission check reads role | Covered (evidence is a source scan) | story-7b1025b8 | AC-2257: gap 5 |
| 21 | REQ-194 entitlement subject is an account key; the capacity grant keeps a NULL subject | Covered | story-7b1025b8 | AC-2115. Missing write-side enforcement is recorded as a CODE-ISSUE |
| 22 | Contacts "Provision a business" is offered in any business, but `findAccount` resolves only within the platform tenant | **Uncovered** | — | Material: gap 6 |
| 23 | REQ-195 contact_events append-only (BEFORE UPDATE trigger, DELETE for erasure), occurred/recorded, derived business_id, provenance, cap 100, emitters, History pane | Covered | story-4630e921 | AC-2258–2274 all OK |
| 24 | REQ-196 sendEmail port, credential is the only switch, local_ ids, MAIL_FROM required, errors, redaction, deploy hook, MAIL.md | Covered (evidence partial) | story-7d255580 | AC-2276: gap 1 |
| 25 | REQ-197 body sent as HTML in one part (supersedes REQ-196 text) | Covered | story-7d255580 | AC-2281; nothing active still pins plain text |
| 26 | REQ-197 template type, newest wins, default seeded once, refusing render, three neutral seeds | Covered | story-7d255580 | AC-2282–2286 |
| 27 | REQ-198 email record queued-before-send, sent/failed, rendered body plus template key and version, injected sender | Covered | story-219b4217 | AC-2287–2292 |
| 28 | REQ-198 signed delivery webhook (raw bytes, 5-minute replay window, fails closed, 400/404/200), mounted ahead of Access, POST only | Covered | story-219b4217 | AC-2293–2300 |
| 29 | REQ-198 Messages pane, bounced marker, cross-business isolation | Covered | story-219b4217 | AC-2301–2304 |
| 30 | messages.ts:179-201: a store failure after the provider accepts is recorded as `failed` with no provider_id | Uncovered | — | Moderate; non-blocking, see recommendations |
| 31 | messages.ts:307-312: a late `delivered` overwrites `bounced` | Uncovered | — | Low–moderate; non-blocking |
| 32 | REQ-192 bin/seed (idempotent, local unless --remote, no operator, cast, guidance), migrate never applies the fixture | Covered | story-5b5be809 | AC-2305–2316, run against the real commands |
| 33 | REQ-192 bin/access-sim (--print-env, RS256 accepted by real verifyAccessJwt, wrong aud refused, /login lists every address), ACCESS.md | Covered | story-5b5be809 | AC-2317–2322 |
| 34 | /api/publish returns `url: publicSiteUrl(siteKey)` | Partial | story-5349d01f | Asserted by the tests but stated in no AC; non-blocking |

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-7d255580 | Technical Context: "Plan item 7 (REQ-198) composes this story's render output with this story's send operation" | REQ-198 (intent ~2229-2236) says it adds no call site; composition belongs to the later invite modal (REQ-199). Minor; correct the sentence |
| story-fde7370b | AC-2239 "every other identity-bearing table" gets its key from the single minter | `tickets.uid` is minted by the shared ticket-store component outside this repo. Scope the wording to "keys this repository mints". Minor |
| story-387c9dfe / story-7b1025b8 | AC-2153 "no part exists without the others" / "writes, together …" | The tenant row (identity.ts:699) and the starter site (:742) are written outside the atomic batch. Minor overstatement; soften it or record it as a decision |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Knowledge read seam (upgrade) | story-c4f329d3, story-3cf3d57b | ✓ (AC-2235, AC-2236, AC-2237) |
| 2. Site storage keys & published address (upgrade) | story-fde7370b, story-d34eccd8, story-5349d01f | ✓ (AC-2238–2246; AC-1422 superseded) |
| 3. Person identity: addresses & names (upgrade) | story-7b1025b8, story-0034d937, story-a55c2f35 | ✓ (AC-2247–2252; AC-2171/2179/2188/2192/1744 modified) |
| 4. Accounts (upgrade) | story-7b1025b8, story-387c9dfe, story-83ff6262 | ✓ (AC-2253–2257; AC-1741/2115/2157/1742 modified; AC-2219/2222 updated) |
| 5. Contact history (feature) | story-4630e921 (STORY-167) | ✓ |
| 6. Message composition & sending (feature) | story-7d255580 (STORY-168) | ✓ |
| 7. Email record & delivery webhook (feature) | story-219b4217 (STORY-169) | ✓ |
| 8. Local dev fixture (feature) | story-5b5be809 (STORY-170) | ✓ |

## Supersession Check (Step 4c)

PASS.
- REQ-190's retraction of the global slug claim is applied: AC-1422 is superseded by bundle-5052a63c. No active AC pins published_sites, SlugClaimedError/409, /site/<slug>/, or a starter slug equal to the business id or `home`.
- REQ-191/193/194 retract users.email, display_name, the person-as-account payload and acct_ business ids. No active AC still pins any of them; the affected ACs were modified in place, as the plan states.
- REQ-196's "body is plain text" is superseded by REQ-197. No active AC pins it.
- REQ-192's superseded clauses (two-phase seed, HTTP bootstrap, operator address) were never matrix ACs.
- REQ-195's "never deleted" is narrowed by its own later section, and that narrowing is recorded.

## Mode Override Audit

1 override audited, 0 touched a trust boundary.

report-132efb58 (code_frozen, story-7d255580, batch 0, rung 1) — **PASS** on all items:
1. `unnamed_files_touched` is empty. The only production file touched is the named `apps/control-app/src/mail.ts`; the test edit is outside code_frozen's scope.
2. The later scoped quality run (report-1272558f, commit 7fc0e24e) passed 300/0. It included every mail.ts consumer test (AC2275–2286).
3. Consistent with intent: REQ-197 "Decisions taken while implementing" says "The body is HTML, and it is one part". REQ-196 "What landed" anticipated exactly this one-line adapter change. It serves AC-2281.
4. Within the stated scope: `text:` became `html:`, the Message.body doc comment was corrected, and one test field expectation changed. No multipart and no textFrom.
5. `trust_boundary_touched` = false and `trust_boundary_mismatch` = false.
6. A rung 1 code_frozen grant with the diff confined to the named file, adding only behaviour that AC-2281 and REQ-197 demand.

## Judgment Calls

- **Gap 1 — AC-2276 (story-7d255580, acceptance_criterion-96104d2f). Insufficient evidence; material.**
  - Claim: "the message is recorded (in send order) among the messages captured locally". The AC's own Verification step says "the captured list contains the messages in order".
  - `test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids` (tests/test_reconciliation_outgoing_messages.workers.test.ts:99-140) asserts only console lines.
  - Through `mailerFor` (apps/control-app/src/mail.ts:288) the capturing mailer's `sent` array is discarded and cannot be reached, so an adapter that never pushes to `sent` passes.
  - Remediation, either:
    - assert `capturingMailer().sent` equals the sent messages in order (keeping the `mailerFor` no-network assertions); or
    - reword AC-2276 so it states what the selected path does (one console line per message, no network, `local_` id), with the in-memory capture stated only for `capturingMailer` used directly, and record that as a Reconciliation Decision.
- **Gap 2 — AC-2240 (story-fde7370b, acceptance_criterion-4646a3bd). Insufficient evidence; material.**
  - Claim: after a slug change "the site is then read, edited and published under the new slug".
  - `test_UAT_AC2240_a_sites_slug_changes_with_no_key_rewritten` (tests/test_reconciliation_opaque_site_keys.workers.test.ts:354-383) only reads under `shop` and serves by key. It never writes or publishes under the new slug.
  - Remediation: after `UPDATE sites SET slug='shop'`, call `after.write('shop', …)` and `publishSite(after, 'shop')`. Assert a second revision appears in `after.revisions('shop')`, and that `/site/<sameKey>/` serves the new content.
- **Gap 3 — AC-2247 (story-7b1025b8, acceptance_criterion-04740da6) and AC-2179 (story-0034d937, acceptance_criterion-5d6bb323). Insufficient evidence; material.**
  - Claim: "every surface that shows one address for a person shows the primary" / the list row shows the primary address.
  - In tests/reconciliation-identity-person-addresses-names.workers.test.ts (~274-276) the primary is always the oldest address, so an implementation ordering by created_at and ignoring is_primary passes.
  - The AC-2179 panel test (tests/test_reconciliation_contacts_tab.test.ts:338-369) feeds one address per person, which contradicts its own Verification step ("seed … two addresses (one primary)").
  - Remediation:
    - In the AC-2247 UAT, add a second address and then move the primary flag to it (clear the first, set the second). Assert `peopleOf(...)` email, `personDetail().person.email`, `emails[0]` and `admit(second-address or first).user.email` all equal the new primary.
    - In AC-2179, add a server-half assertion through `/api/people` where the primary is not the oldest address.
- **Gap 4 — AC-2157 (story-387c9dfe, acceptance_criterion-be56b74c). Insufficient evidence; material.**
  - Claim: `person` carries the signed-in human's current name and primary address.
  - `test_UAT_AC2157_businesses_payload_carries_exactly_person_and_businesses` (tests/test_reconciliation_business_fulfilment.workers.test.ts:337-357) asserts only `person.email`. An implementation returning `name: null`, or one not reading user_names, passes.
  - Remediation: give the customer a current name, then assert `person.name` equals it. Supersede the name, then assert `person.name` follows.
- **Gap 5 — AC-2257 (story-7b1025b8, acceptance_criterion-02172406). Source-inspection evidence; material under Step 5b.**
  - Claim: "no other check … reads the role".
  - `test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value` (tests/reconciliation-identity-accounts.workers.test.ts:191-206) proves this by regex over product source text plus exact literal counts (`'owner'` ×3, `role === 'owner'` ×1). A role check written through a constant passes, and an equivalent harmless refactor fails.
  - The runtime half only shows two memberships are `owner`.
  - Remediation: add runtime evidence. Write a membership with a non-owner role (e.g. `staff`) for a person, then assert:
    - they are admitted and the business is selectable;
    - business-scoped routes behave as for an owner;
    - they are refused only at the ownership-gated routes (invite, contact record edit, add-a-business).
  - Keep the source scan only as a supplementary guard, or drop it.
- **Gap 6 — uncovered behaviour, story-a55c2f35 / story-387c9dfe. Material.**
  - The contact detail's "Provision a business" control is offered whenever `canFulfil` is true (router.ts:1371), in any scoped business, and submits the contact's own address (apps/control-app/src/builder/people.js:782).
  - But `/api/businesses` add-a-business resolves it through `findAccount` (router.ts:1309 → identity.ts:1121-1127), which searches only the platform (1st Contact) tenant.
  - Per REQ-191, the same address in two businesses is two unrelated people. An operator scoped to a customer business either gets a 404, or provisions for an unrelated 1st Contact person who happens to hold that address.
  - No story or AC states this.
  - Remediation, either:
    - add an AC plus a CODE-ISSUE / Reconciliation Decision on story-a55c2f35 (AC-2202) and story-387c9dfe, stating that the add-a-business lookup resolves only accounts of the 1st Contact business and how the control behaves outside that scope; or
    - flag it as a code defect for an upgrade story. Do not silently leave AC-2202 implying it works in every business.

Non-blocking (recommended in the same fix pass, not failure grounds):
- **AC-2242** (acceptance_criterion-7967e301): the Verification step says "the other sites are untouched", but the test's business holds only one site. Add a sibling site in the same business, and one in another business, then assert their rows and `draft/`/`sites/` objects survive `forget`.
- **story-219b4217:** record decisions, or add ACs, for:
  - messages.ts:179-201 — a store failure after the provider accepts marks the record `failed` with no provider_id, so later webhooks 404 and a re-press duplicates the send;
  - messages.ts:307-312 — a late `delivered` overwrites `bounced`, contradicting the module comment "Nothing moves backwards".
- **story-5b5be809:** AC-2310's four name shapes come from db/dev-seed.sql with no intent asking for them. Add a one-line Reconciliation Decision.
- **story-5349d01f:** state the `/api/publish` `url` = `/site/<siteKey>/` response in an AC (already asserted by the AC-2245/2246 tests).
- **story-7b1025b8:** the REQ-191 "fall back to the oldest address when none is flagged primary" rule (identity.ts:442) and "entitlements.email is gone" have no AC. Low.
- **story-c4f329d3 AC-2102** (from BUNDLE-35, not touched by this bundle): its evidence is a text scan of bin/kb-release. Follow up separately; out of scope here.
- **Operator confirmations** (recorded divergences, not failures):
  - the retirement of BUG-55's "`1c assets` reports indexed, not primed" bullet;
  - the REQ-190 R2 bucket wipe, recorded as a deployment act.
- **Observation:** the bundle's earlier `reconcile_error` names `vitest.node.config.mts` as edited without a code_frozen grant. The edit adds a test `globalSetup` (tests/global-setup-generated.ts), which is test-harness configuration and not story-level product behaviour. No story impact.

## Verdict

FAIL. The intent is represented faithfully, with no silently absorbed divergence, and every plan item produced output. However, six active ACs (AC-2276, AC-2240, AC-2247, AC-2179, AC-2157, AC-2257) have UATs that a broken implementation could pass. One material code behaviour is undocumented: the "Provision a business" lookup is scoped to the platform tenant while the control is offered in every business. The fix loop should address gaps 1–6 above.
