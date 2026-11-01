---
uid: report-35e3cf17
id: REPORT-7272
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-01T04:39:01.410100+00:00'
updated_at: '2026-11-01T04:39:01.410100+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-fd009b93
  anchor_uid: bundle-fd009b93
  overrides_audited: 3
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: 
**Anchor**: bundle-fd009b93
**Stories Reviewed**: 8 (STORY-106, STORY-146, STORY-159, STORY-144, STORY-103, STORY-104, STORY-141, and STORY-140 as plan item 7's second target)

## Behavior Inventory

27 behaviors identified across the five bundled intents (REQ-175, REQ-178, REQ-166, BUG-46, REQ-173), consistent with the plan's inventory (report-0872dab5).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Document keys derived from l1DocumentSchema; get_page_style reads verbatim (refs unresolved) | Covered | STORY-106 | AC-2068 |
| 2 | set_page_style merges top-level, replaces whole, null removes, validates, tree untouched; in AuthorPages | Covered | STORY-106 | AC-2069, AC-1092 modified |
| 3 | describe_page carries document keys | Covered | STORY-106 | AC-2070 (REQ-175 D2) |
| 4 | Dangling font-stack refusal (generic fallback anywhere accepted) | Covered | STORY-106 | AC-2071; refinement of D5 recorded under Reconciliation Decisions |
| 5 | Dangling asset refusal, query/fragment stripped, absolute URLs left to allowlist | Covered | STORY-106 | AC-2072 |
| 6 | Only introduced refs refused, compared by value | Covered | STORY-106 | AC-2073, recorded decision |
| 7 | Corpus parity round-trip (nodes + document keys) | Covered | STORY-106 | AC-2074; schema-derived key enumeration in AC-2068 |
| 8 | Admission returns set of businesses with name + own grant; no singular accountId | Covered | STORY-146 | AC-2075, AC-1748 |
| 9 | Lapsed/future/revoked grant -> unselectable but listed | Covered | STORY-146 | AC-2076, AC-1750..1752 |
| 10 | Revoked/expired membership excluded; unknown tenant dropped | Covered | STORY-146 | AC-2077, AC-1753 |
| 11 | provisionBusiness shared with invite; user first, membership+grant batched; empty owner/name refused | Covered | STORY-146 | AC-2078, AC-1740 |
| 12 | Person with no business refused no_membership; re-invite repairs | Covered | STORY-146 | AC-2079 |
| 13 | Every-business-lapsed refused no_entitlement (pre-amendment) | Covered, flagged | STORY-146 | Matches bundled code (identity.ts:476-477); DOC-42 amendment explicitly flagged in Reconciliation Decisions as landing in later, un-bundled commits |
| 14 | capture_site adopts bundle as one reference ticket, one record per member with meta.member | Covered | STORY-159 | AC-2080 (deployed Worker composition, wired under override report-4a2f1de4) |
| 15 | Title = page <title>, host fallback; body opens with link + measured facts; degrades in stages | Covered | STORY-159 | AC-2081 |
| 16 | Rights from provenance (own domain/subdomain vs other) | Covered | STORY-159 | AC-2082; production never supplies client domain -> flagged as Known gap 9 |
| 17 | Recapture keyed by bundle name; sha256 dedupe; superseded/vanished members detached; description rewritten | Covered | STORY-159 | AC-2083 |
| 18 | No ticket store -> captures as before and says so; failed adoption reported, bundle kept; no capture.json refused by name | Covered | STORY-159 | AC-2084, AC-2044 |
| 19 | Library: screenshot preview as one member; member count replaces File field; download = screenshot; links open outside builder; ordinary material unchanged | Covered | STORY-144 | AC-2085..2087, AC-1723 modified |
| 20 | Session open folds junction, returns cursor + live; works keyless | Covered | STORY-103 | AC-2088, AC-1052 modified (live fixed under override report-2b2e5e10) |
| 21 | streamTurn waitUntil; aborted turn archived with status aborted | Covered | STORY-103 | AC-2089 |
| 22 | /api/ai/reattach requires cursor, tails from cursor, same frames, no gap/dup | Covered | STORY-103 | AC-2090 |
| 23 | Narrowed catch: non-'no conversation' read failure surfaces | Covered | STORY-103 | AC-2091 |
| 24 | Pane rejoins live turn as one growing bubble; not awaited; site_changed honoured; guards | Covered | STORY-104 | AC-2092..2094, AC-1063 modified |
| 25 | Digest body for every branch; full text returned and written once as material_text comment (bounded, marked); text_comment on envelope | Covered | STORY-141 / STORY-140 | AC-1688/1689/1699 modified, AC-2095 |
| 26 | Chunk index reads full text via reading view, hits carry material uid; doc index reads digest | Covered | STORY-140 | AC-2096 |
| 27 | Describer is a lightweight session (no tools, digest instruction only, NullArchive, closed per doc incl. failure); no key -> /api/status, banner + inert builder, ingestion 503 | Covered | STORY-141 / STORY-140 | AC-2097 (system prompt exactness fixed under override report-8ad43fd3), AC-2098 |

## Ungrounded Stories

None found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Page authoring (REQ-175) | STORY-106 | ✓ (AC-2068..2074 added; AC-1090, AC-1092 modified) |
| 2. Accounts & entitlement (REQ-178) | STORY-146 | ✓ (AC-2075..2079 added; AC-1740, 1748, 1750..1753 modified) |
| 3. Capture -> material (REQ-166) | STORY-159 | ✓ (AC-2080..2084 added; AC-2044 modified) |
| 4. Library (REQ-166) | STORY-144 | ✓ (AC-2085..2087 added; AC-1723 modified) |
| 5. Conversations (BUG-46) | STORY-103 | ✓ (AC-2088..2091 added; AC-1052 modified) |
| 6. Assistant pane (BUG-46) | STORY-104 | ✓ (AC-2092..2094 added; AC-1063 modified) |
| 7. Material description (REQ-173) | STORY-141, STORY-140 | ✓ (AC-2095..2098 added; AC-1688/1689/1699 modified; AC-1692 superseded) |

## Supersession Check (Step 4c)

- AC-1692 (STORY-141, no-describer image stored as undescribed) is unambiguously retracted by REQ-173 and is `status: superseded`, `superseded_by_uid: bundle-fd009b93`. PASS.
- AC-1750 (STORY-146) still states the account-level `no_entitlement` refusal that REQ-178's DOC-42 amendment later retracts. Not treated as a 4c failure: the amendment itself says it lands as a delta in later commits that are not in BUNDLE-34, the bundled code still refuses (identity.ts:476-477; no resolveScope/NoBusinessError exists in this tree), and STORY-146 records this explicitly under Reconciliation Decisions with the upgrade to perform when those commits reconcile. Supersession is not unambiguous for this bundle's code, so it is recorded, not failed.

## Evidence Sufficiency (Step 5b)

- Quality report report-47ca2217 (commit 011ec5f73a; no non-.xgd changes since): 226 scoped UATs, 0 failed, 0 skipped; every AC above (including all of AC-2068..2098) has at least one passing `test_UAT_AC{N}_*`.
- New-AC test files contain no `vi.mock`/`vi.spyOn` of repository code; the only external stand-ins are the scripted model client (external AI provider) and real workerd D1/R2 bindings. `readFileSync` use in reconciliation-page-composition-document.test.ts reads the stored corpus pages as fixture data, not source text.
- Spot-checks: AC-2097 asserts tools empty, system text exactly DOCUMENT_DIGEST_SYSTEM, per-document isolation, zero chat tickets, and recovery after a failed session; AC-2088 asserts live false before, true mid-turn with an advancing cursor, false after the turn and on a cold keyless isolate; AC-2089 asserts the aborted status on the done frame. These would fail on the pre-override defects.

## Mode Override Audit

3 overrides audited, 0 touched a trust boundary.

| Report | Rule | Files | Items 1-6 |
|--------|------|-------|-----------|
| report-8ad43fd3 (STORY-141) | code_frozen, rung 2 | apps/control-app/src/ai.ts | Pass: unnamed_files_touched empty (the second touched file is a test, outside code_frozen's scope); evidence tests pass; matches REQ-173's 'system prompt is DOCUMENT_DIGEST_SYSTEM and nothing else'; diff limited to replacing ignored Role keys with one priming Entry + doc comment, REQ-207 consolidation not ported; no trust boundary. |
| report-2b2e5e10 (STORY-103) | code_frozen, rung 2 | tools/generate/src/cli/ai/host-core.ts | Pass: only named file; tests pass; restores BUG-46's stated semantics (live exactly when a turn is open) which the intent's suggested `closedPrefix(...).length` formula broke since closedPrefix returns a count; diff only takes live from transcript() and drops the second read; no trust boundary. |
| report-4a2f1de4 (STORY-159) | code_frozen, rung 2 | apps/control-app/src/router.ts | Pass: only named file; tests pass; implements REQ-166's 'capture_site yields both a bundle and a reference ticket' on the Worker using the /api/material seams; no clientDomain added (REQ-474 out of scope, kept as Known gap 9); no trust boundary. |

## Judgment Calls

- REQ-178 DOC-42 amendment (no_entitlement admits): flagged in STORY-146 rather than silently absorbed; out of this bundle's commit window. Acceptable, but the follow-up reconcile of the amendment commits must upgrade AC-1750 and invert its UAT.
- REQ-166 'client's declared domain' never reaches adoption in production and the domain-mismatch question is not asked: both contradict intent and are explicitly flagged as code-issues (STORY-159 Known gaps 9, 10), not absorbed. Acceptable as recorded divergences.
- STORY-106's font rule (generic family anywhere in the stack) refines D5's 'first family' wording; recorded as a decision grounded in D5's own requirement that the corpus stack keep validating.
- BUG-46 residual risk (isolate eviction mid-turn) is named in STORY-103 and not claimed as a capability. Acceptable.
- Observation, not a failure: the superseded AC-1692 still has a passing test_UAT_AC1692_* in the scoped run; the test should be retired or re-targeted in later housekeeping.

## Verdict

PASS: Stories accurately and completely document the behavior surface. A developer reading these stories would have a correct mental model of what this code does, and every place the code departs from the intent is flagged rather than absorbed.
