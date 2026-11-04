---
uid: report-ed9f3f94
id: REPORT-10924
type: report
title: 'Reconciliation Review: commits (BUNDLE-37), pass 2'
created_by: xgd
created_at: '2026-11-04T20:09:46.903015+00:00'
updated_at: '2026-11-04T20:09:46.903015+00:00'
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

# Reconciliation Review: Story Coverage (pass 2)

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bundle-5052a63c
**Stories Reviewed**: 14 (STORY-117, 149, 121, 95, 94, 146, 163, 164, 162, 166, 167, 168, 169, 170)

This pass re-checks the previous review (report-cc3cda68, gaps G1-G8) against the fix pass (report-81e52435). It also re-reads the intent sections the earlier review left as judgment calls.

## Behavior Inventory

About 75 behaviours across BUG-55 and REQ-190..REQ-198. They are unchanged from report-cc3cda68: no production code changed since then except the granted mail.ts override.

Scoped quality report-2b18eae9 (commit 4b23c79) passed: 298 tests, 0 failed. It includes every test_UAT_AC2235..AC2322 filter, plus the earlier-story evidence set.

## Prior gaps: closure check

| Gap | Status | Evidence |
|---|---|---|
| G1: BUG-55 'indexed, not primed' bullet | Closed | STORY-117 Reconciliation Decision (2026-11-04) retires it with rationale: the map is exempt by design (AC-2101), and the stale map is fixed by AC-2235 |
| G2: AC-2115 entitlement subject | Closed | STORY-146 CODE-ISSUE records the unenforced write side as a REQ-194 intent gap. AC-2115 is restated to the read side only, with an explicit 'Not claimed' paragraph |
| G3: AC-2182 display name | Closed | Restated: primary address, no name field; the name lives in Their name (AC-2252) |
| G4: AC-2249..2252, 2255, 2256 pending | Closed | All active, with UATs passing in report-2b18eae9 |
| G5: AC-2238 'seeds no people' | Closed | test_UAT_AC2238_the_baseline_seeds_no_people applies the baseline and counts rows |
| G6: AC-2239 prefix / minter | Closed | Prefix scenario is now behavioural. 'One minter' is recorded as a structural decision |
| G7: AC-2274 stylesheet | Closed | CSSOM matching with the stylesheet injected |
| G8: STORY-168 stale text | Closed | Resolved entry cites report-132efb58; the test asserts no text field |

## Coverage Map (changes from pass 1)

| # | Behaviour | Coverage | Story / AC | Notes |
|---|---|---|---|---|
| 1 | Search then read on both hosts | **Absorbed divergence** | STORY-149, AC-2237 | See N1 |
| 2 | Contact events written by delivery handling | **Ungrounded claim** | STORY-167 | See N2 |
| 3 | Starter site slug `unnamed` / name `Unnamed` | Covered | AC-2246, AC-1742 | Plan item 2 said `home`. The intent (REQ-190, 'The starter site is called `unnamed`') and the code say `unnamed`, and the stories follow the intent. Correct |
| (all other rows) | as report-cc3cda68 | Covered | | |

## Gaps (fix loop work items)

**N1. STORY-149 (story-3cf3d57b) / AC-2237 (acceptance_criterion-3e2afff1) absorb an unmet BUG-55 clause.**
- What the intent asks. BUG-55's acceptance says "the co-ranked surface searches both knowledge bases on both hosts: the Worker through `session-knowledge.ts`, the Node CLI through `openKnowledgeRuntime`".
- What the code does. `openKnowledgeRuntime` (tools/generate/src/cli/kb.ts:1075-1090) opens the system KB only, keyed `shipped`. The Node host (tools/generate/src/cli/ai/host.ts:121-160) grants only `[SYSTEM_KB]`. The Node CLI has no project KB and no co-ranked surface.
- What the matrix says. AC-2237 claims that on both hosts a hit from either knowledge base can be read back. STORY-149's Description says "from either body, on either host". Its Reconciliation Decision says "No code-issue: the Worker and Node runtimes ... pass source-keyed maps as the intent asks".
- Why the evidence falls short. The Node UAT (tests/test_UAT_FC_BUG-55_index_seam.test.ts:158) asserts only system-KB keys and read-back. No assertion covers the project-KB-on-Node claim, and none could, because the behaviour does not exist. A broken implementation passes.
- Remediation:
  1. Restate AC-2237: on the Worker, a hit from either KB is read back (system under `shipped`, project under DEFAULT_SOURCE). On the Node CLI, a hit from the system KB is read back.
  2. Correct STORY-149's 'either body, on either host' bullet to match.
  3. Replace the 'No code-issue' sentence with a Reconciliation Decision on BUG-55's 'both knowledge bases on both hosts' clause. Either record a CODE-ISSUE (the Node CLI does not search the project KB) or record that the clause rested on a wrong premise (the Node CLI never hosted a project KB) and retire it with rationale. Decide which from the code history of `host.ts` and `openKnowledgeRuntime`.
  4. Do not change code.

**N2. STORY-167 (story-4630e921), line 47, claims REQ-198 delivery events write contact events. The intent says the opposite.**
- The story says "REQ-198's delivery events (plan item 7) will write through this story's write path."
- REQ-198's 'Implementation decisions' has a section 'Contact events are deliberately not written here'. It defers the writer to REQ-199's call site.
- The code agrees with REQ-198: `recordEvent` (apps/control-app/src/events.ts:207) has no caller in the control app, and the webhook writes no contact_events.
- STORY-169 already defers email.* events to REQ-199, so the two stories contradict each other. A developer reading STORY-167 would expect bounce and delivery history to appear in the History pane, and it does not.
- Remediation: change the sentence to say that later `email.*` kinds will write through `recordEvent`, and that REQ-198 deliberately writes none; the writer arrives with REQ-199's invite call site. Story text only, no AC change.

## Supersession Check (Step 4c)

PASS.
- AC-1422 (acceptance_criterion-51835b53) is `superseded` with superseded_by_uid bundle-5052a63c.
- AC-2182 was restated rather than superseded. Its behaviour (the Who they are section) persists in a new shape, so restating it is correct.
- No active AC pins the global slug claim, a plain-text body, users.email or users.display_name.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|---|---|---|
| 1. Knowledge read seam | story-c4f329d3, story-3cf3d57b | ✓ (N1 open on STORY-149) |
| 2. Site keys & published address | story-fde7370b, story-d34eccd8, story-5349d01f | ✓ |
| 3. Addresses & names | story-7b1025b8, story-0034d937, story-a55c2f35 | ✓ |
| 4. Accounts | story-7b1025b8, story-387c9dfe, story-83ff6262 | ✓ |
| 5. Contact history | story-4630e921 | ✓ (N2 open) |
| 6. Mail port + templates | story-7d255580 | ✓ |
| 7. Email record & webhook | story-219b4217 | ✓ |
| 8. Dev fixture | story-5b5be809 | ✓ |

## Mode Override Audit

1 overrides audited, 0 touched a trust boundary.

report-132efb58 (code_frozen, batch 0, rung 1, apps/control-app/src/mail.ts):
1. `unnamed_files_touched` is empty. The test edit is outside code_frozen scope. PASS.
2. Earlier stories' tests pass. report-2b18eae9 shows 298/298, including AC2275-2278, AC2281, AC2286 and the whole earlier-AC evidence filter. PASS.
3. Consistent with intent. REQ-197 says "The body is HTML, and it is one part" (bundle body line 1868), which is later than REQ-196's plain-text decision (line 2025). This serves AC-2281. PASS.
4. Within the stated scope. The branch's mail.ts carries `html: message.body` and the corrected doc comment only, with no derived text part or multipart. PASS.
5. trust_boundary_touched is false. PASS.
6. Only the named file was edited, and no behaviour was added beyond AC-2281. PASS.

Not misjudged.

## Judgment Calls

- **Plan vs intent on the starter slug.** Plan item 2 says 'home'. REQ-190's later 'What landed' section says `unnamed`. The stories follow the intent, which is correct per the chain of authority and is not a finding.
- **Not raised as gaps (wording notes, carried from pass 1):**
  - The AC-2293 'registered' vs AC-2298 'active' wording.
  - The mislabelled test_UAT_AC2241_there_is_no_global_slug_claim_table (it evidences AC-2245).
  - Stale comments at 0001_baseline.sql:787 and d1r2-store.ts:63.
  - AC-1746 and AC-1448 stale wording.
  These do not mislead about behaviour.
- **Documentation ACs.** AC-2280's runbook clause and AC-2322 are still evidenced by text match; accepted as documentation deliverables.
- **AC-2257** (no permission check reads role) is still a source scan; accepted as a negative structural claim.
- **Operator note, not a story finding.** The bundle's `reconcile_error` records that the router treated the vitest.node.config.mts globalSetup edit as production code changed without an override. Test configuration is outside this review's scope.
- **Test execution.** No suites were re-run in this session. Evidence was judged from the test source plus scoped quality report-2b18eae9, which ran after the last test change.

## Verdict

FAIL. Two fidelity gaps remain; G1-G8 from pass 1 are all closed.
- **N1:** STORY-149 and AC-2237 claim project-KB search-then-read on the Node CLI. The code has no such path, the Node UAT cannot evidence it, and the story says 'no code-issue' against BUG-55's 'both knowledge bases on both hosts'.
- **N2:** STORY-167 says REQ-198 delivery events write contact events, but REQ-198 explicitly decided they do not, and the code agrees.

Both fixes are matrix text only (an AC restatement and story decisions); no code or tests need to change.
