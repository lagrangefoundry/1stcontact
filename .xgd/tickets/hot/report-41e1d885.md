---
uid: report-41e1d885
id: REPORT-10946
type: report
title: 'Reconciliation Review: commits (BUNDLE-37), pass 3'
created_by: xgd
created_at: '2026-11-04T22:14:46.040731+00:00'
updated_at: '2026-11-04T22:14:46.040731+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-5052a63c
  anchor_uid: bundle-5052a63c
  overrides_audited: 1
  trust_boundary_overrides: 0
  prior_review_uid: report-0cfddba5
  quality_report_uid: report-08756cca
  gaps: []
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (none; commits mode)
**Anchor**: bundle-5052a63c (BUNDLE-37: BUG-55, REQ-190 to REQ-198)
**Stories Reviewed**: 14. The 8 named in the plan, plus the 6 the upgrade items extend: story-c4f329d3, story-3cf3d57b, story-fde7370b, story-d34eccd8, story-5349d01f, story-7b1025b8, story-0034d937, story-a55c2f35, story-387c9dfe, story-83ff6262, story-4630e921, story-7d255580, story-219b4217, story-5b5be809.

1 override audited, 0 touched a trust boundary.

## Scope of this pass

This review follows report-0cfddba5, which **failed** on six evidence gaps and one uncovered behaviour. It found no intent-fidelity problems: no divergence was silently absorbed, every plan item produced output, and supersession passed.

This pass re-verified:
- every one of those gaps against the fix_reconciliation_review output (report-0af23f8d; commit 60a403fb21);
- the later test-fix iteration (report-ba25a95c; commit 665df9fc40), which fixed the incomplete fixture in the new AC-2257 runtime UAT and changed no production code;
- the final scoped quality run (report-08756cca at commit 3f33067723: 303 passed, 0 failed, 0 skipped). That run is later than every test and ticket edit since the prior review. Every commit after it touches only `.xgd`.

Since the prior review, no production file changed. The only non-ticket files touched are four test files.

## Behavior Inventory

About 95 material behaviours across the 10 source tickets, unchanged from report-0cfddba5. Version-bump and merge commits carry no capability.

## Coverage Map (delta from report-0cfddba5)

Rows 1-34 of the prior map stand, except as follows.

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 6 | REQ-190: rename, slug change or move is one UPDATE, and the site is then read, edited and published under the new slug | Covered | story-fde7370b | The AC-2240 slug-change UAT now writes and publishes under `shop`. It asserts a second revision, the same key, `/site/<key>/` serving the new copy, and that `sites/<key>/rev/0002/` exists |
| 8 | REQ-190: forget removes one site; other sites are untouched | Covered | story-fde7370b | AC-2242 now proves a same-business sibling and a same-slug site in another business keep their rows and objects and are still served |
| 13/14 | REQ-191: every one-address surface shows the primary, not the oldest | Covered | story-7b1025b8, story-0034d937 | The AC-2247 UAT moves the primary to the newer address and checks `peopleOf`, `personDetail().person.email`, `emails[0]` and `admit` through both addresses. A new AC-2179 UAT checks the newer primary through the real `GET /b/<biz>/api/people` route |
| 19 | REQ-194: `/api/businesses` reports `person` with the current name and primary address | Covered | story-387c9dfe | The AC-2157 UAT asserts `name` is null when unnamed, equals the current name after `writeName`, and follows a `changed` supersession |
| 20 | REQ-194: no permission check reads role beyond the ownership question | Covered | story-7b1025b8 | AC-2257 now has runtime evidence. A `staff` member is admitted and selectable, gets the same non-empty `/api/people` list as the owner with `canInvite` false, gets 403 at invite, record and status (target re-read unchanged), and 404 at add-a-business. The owner passes. The source scan is now only a supplementary guard |
| 22 | Provision a business is offered in any scoped business, but `findAccount` resolves only 1st Contact people | Covered (as a recorded CODE-ISSUE) | story-387c9dfe, story-a55c2f35 | New AC-2323 pins the current behaviour (404 for a local-only address; an unrelated platform person's account for a shared address). AC-2202 is reworded to the real offering rule. Both stories record a CODE-ISSUE decision deferring the correction to a follow-up upgrade intent. Flagged, not silently absorbed |
| 24 | REQ-196: the local adapter records each message in send order | Covered | story-7d255580 | AC-2276 is reworded: the `sent` list belongs to `capturingMailer`, and `mailerFor` exposes only the console line (mail.ts:288 discards the adapter). The UAT now asserts `capturingMailer().sent` equals [first, second, third] with no network. The decision is recorded |
| 30/31 | messages.ts: a store failure after the provider accepts is recorded as `failed`; a late `delivered` overwrites `bounced` | Recorded CODE-ISSUE | story-219b4217 | No criterion endorses either; both are left for a follow-up fix |

## Ungrounded Stories

None remaining. The three minor items from report-0cfddba5 are corrected:
- story-7d255580's Technical Context now says REQ-198 adds no render+send call site (REQ-199 owns it).
- AC-2239 is scoped to keys this repository mints; `tickets.uid` is external.
- AC-2153 now states the real atomicity: membership and grant are batched; the tenant row and starter site are separate steps.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Knowledge read seam (upgrade) | story-c4f329d3, story-3cf3d57b | ✓ (AC-2235, AC-2236, AC-2237) |
| 2. Site storage keys & published address (upgrade) | story-fde7370b, story-d34eccd8, story-5349d01f | ✓ (AC-2238 to AC-2246; AC-1422 superseded) |
| 3. Person identity: addresses & names (upgrade) | story-7b1025b8, story-0034d937, story-a55c2f35 | ✓ |
| 4. Accounts (upgrade) | story-7b1025b8, story-387c9dfe, story-83ff6262 | ✓ (plus AC-2323) |
| 5. Contact history (feature) | story-4630e921 | ✓ |
| 6. Message composition & sending (feature) | story-7d255580 | ✓ |
| 7. Email record & delivery webhook (feature) | story-219b4217 | ✓ |
| 8. Local dev fixture (feature) | story-5b5be809 | ✓ |

## Supersession Check (Step 4c)

PASS.
- AC-1422 (acceptance_criterion-51835b53, story-5349d01f) is `status: superseded` with `superseded_by_uid: bundle-5052a63c`.
- No new supersession arose in the fix pass. AC-2202, AC-2179, AC-2276, AC-2257, AC-2153 and AC-2239 were reworded to match the code and intent. None of them retracts a sibling contract.

## Evidence Sufficiency (Step 5b)

All six previously insufficient ACs now have discriminating runtime UATs that pass in report-08756cca:
- **AC-2276**: the capture list is asserted directly.
- **AC-2240**: the edit and publish happen under the new slug.
- **AC-2247 and AC-2179**: the primary is not the oldest address, at the store, admission and the route.
- **AC-2157**: the name is null, then set, then superseded.
- **AC-2257**: a non-owner role is exercised against real routes.
- **AC-2323**: the new criterion is evidenced through the real admin route, with DB ownership checks.

None of these mocks repository code. The only stubs are JWKS and fetch at external boundaries.

## Mode Override Audit

1 override audited, 0 touched a trust boundary.

report-132efb58 (code_frozen, story-7d255580, batch 0, rung 1): **PASS**.
1. Named files: `unnamed_files_touched` is empty. The only production file touched is the named `apps/control-app/src/mail.ts`; the other touched file is a test.
2. Quality: every mail.ts consumer UAT (AC-2275, 2276, 2277, 2278, 2281, 2286) passes in report-08756cca.
3. Intent: REQ-197 decides the body is HTML in one part, and REQ-196 anticipated this one-line adapter change. It serves AC-2281.
4. Scope: the change is `text:` to `html:` plus the corrected doc comment and one test field expectation. There is no multipart and no textFrom.
5. Trust boundary: `trust_boundary_touched` and `trust_boundary_mismatch` are both false, and conformance passed.

No `blocked_by_handoff` or `aligned_to_tip` reports are in scope. The iteration-3 fix plan (report-ba25a95c) was decided at rung 3 with no override.

Process note: the OVERRIDE-AUDIT.md system doc could not be opened in this session (read permission denied). The five items above follow the checklist as applied in report-0cfddba5, against the override's recorded fields and diff.

## Judgment Calls

- **Gap 6 is resolved by pinning and flagging, not by fixing.** AC-2323 asserts current behaviour that the stories explicitly label a CODE-ISSUE. Reconcile mode forbids the runtime change, and this was one of the two remediations report-0cfddba5 accepted. The divergence is recorded in both stories, so it is not silent absorption. The follow-up upgrade intent must supersede AC-2323 when it corrects the lookup.
- **Non-blocking items carried forward** from report-0cfddba5 and not addressed in this fix pass. None is material to a developer's mental model:
  - story-5b5be809: no Reconciliation Decision records AC-2310's four name shapes as decided from dev-seed.sql.
  - story-5349d01f: no AC states the `/api/publish` `url` = `/site/<siteKey>/` response, though tests assert it.
  - story-7b1025b8: the oldest-address fallback when none is primary has no AC.
  - AC-2102: its evidence is a text scan, and it is out of this bundle's scope.
- **Operator confirmations still outstanding.** These are recorded divergences, not failures:
  - the retirement of BUG-55's "`1c assets` reports indexed, not primed" bullet;
  - the REQ-190 R2 bucket wipe, recorded as a deployment act.
- **Observation:** the bundle's `reconcile_error` names `vitest.node.config.mts`, a test-harness `globalSetup` edit with no story impact. Routing it is the outer workflow's concern.

## Verdict

PASS. The stories accurately and completely document the behaviour surface of BUNDLE-37 and represent the operator's intent faithfully. Divergences are flagged as Reconciliation Decisions or CODE-ISSUEs, not silently absorbed. Every plan item produced output. Every active AC has passing runtime UATs that a broken implementation would fail. A developer reading these stories would have a correct mental model of what this code does and of where it knowingly falls short of intent.
