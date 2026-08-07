---
uid: report-388cfc49
id: REPORT-1640
type: report
title: 'UAT Coverage: Site Delivery: Deploy & Public Serving'
created_by: xgd
created_at: '2026-08-07T22:19:50.103183+00:00'
updated_at: '2026-08-07T22:19:50.103183+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a12e557f
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Delivery: Deploy & Public Serving

**Result**: FAIL
**AC verdicts**: 35 pass, 1 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 1 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Scope: 3 stories, 36 active ACs, 36 UATs across 4 test files. All 36 execute and
pass (`vitest run`, 36/36, 1.18s). The single violation is a coverage gap
confirmed by mutation, not by inspection alone.

## Cumulative Intent Considered

Both carriers are reconciled: BUNDLE-13 (`bundle-e0143ffa`, merged at
`1ee6aaf2`) and BUNDLE-14 (`bundle-0385746c`, merged at `cd8f98c8`), each
`free_and_reconciled`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-109 | free_and_reconciled | 2026-07-30 | Document-relative asset emission — owned by STORY-83, precondition for AC-904/AC-921 | YES (dependency) |
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy`: the operator half → STORY-94 | YES |
| REQ-111 | free_and_reconciled | 2026-07-30 | public-site Worker serves previews and published sites → STORY-95 | YES |
| REQ-113 | free_and_reconciled | 2026-07-31 | Extensionless page URLs agree across preview and production → STORY-96 | YES |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` fragment defect — other capability, noted as unblocked follow-up | YES (out of tree) |
| BUG-31 | free_and_reconciled | 2026-07-31 | Store-tree namespacing survives the shared-storage boundary → AC-924/925/926/927 | YES |

No intent in the ledger is `abandoned`, `deprecated` or `wont_fix`, so no AC in
this capability should be retired — and none is. All 36 ACs are `status=active`,
`kind=behavior`, `regression_only=false`. No AC was judged retired or
unsupported; every one traces to a reconciled intent above.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-94 | REQ-110, BUG-31 | aligned | Every body claim maps to an AC; all 13 substantively covered |
| STORY-95 | REQ-111, BUG-31 | aligned | Body aligned, but one behavioural promise is not proven — finding 1 |
| STORY-96 | REQ-113, REQ-109 (dep) | aligned | All 9 ACs substantively covered in both environments |

Evidence quality across the capability is high and worth recording, because it
bounds how much weight the single violation carries. Every UAT drives a real
entry point — `cmdDeploy`, `worker.fetch(Request, Env, ExecutionContext)`,
`startServe` over a real loopback address, and a raw TCP socket where `fetch`
would normalise a traversal away before it reached the server. R2 is faked only
at the binding, which is the one boundary the project does not own; the route
grammar, deploy index, header policy and edge-cache logic above it are all real.
No test in this capability is structural (source-text matching) or mocks the
component under test.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-914 | uat-edit | AC-914's second half — "refused **before any bytes are shipped**" — is not covered. `test_UAT_AC914_*` proves the refusal by calling the pure gate `assertNoReservedSegment` directly (`tests/reconciliation-serve-deployed-snapshot.test.ts:863-878`), never through `cmdDeploy`, then asserts the store is byte-unchanged at lines 880-881 — an assertion that cannot fail, because no deploy was attempted and the gate never writes. **Mutation-confirmed**: commenting out the production wiring at `tools/generate/src/deploy/deploy.ts:136` leaves all 36 capability UATs green, and the entire repository suite green (173 files, 1186 tests passed / 112 skipped). The AC's own Verification section asks for a *deploy* attempt and "nothing was written to the store"; neither is what the test does. | Replace the vacuous store-unchanged assertion with one that pins the wiring — e.g. drive `cmdDeploy` with an injected colliding file list, or instrument the R2 client and assert the gate ran before the first `put`. See "Notes for the Editor": this may instead be an `ac-edit`, and that call belongs to the operator. |
| 2 | warning | uat | AC-900 | uat-edit | AC-900 asks for "file count **and total size** for the file-moving stages". The test pins count+size on the `render` line (`tests/reconciliation-deploy-snapshot.test.ts:414`) but only count on the two `upload` lines (416-417). Behaviour is present and uniform — all three lines come from the same `fileCount()` helper (`deploy.ts:312-315`), which always emits both — so this is an under-assertion, not a gap. | Extend the two upload regexes to require the size column, matching the render line's pattern. |
| 3 | warning | uat | AC-908, AC-918 | uat-edit | Both ACs' Verification sections say to *deploy* a snapshot containing the files under test; both tests instead seed objects directly into `client.objects` under a snapshot the index already vouches for (`reconciliation-serve-deployed-snapshot.test.ts:647-651`, `reconciliation-clean-page-urls.test.ts:459-462`). The behavioural claim in each case is a rule about the **served path**, and it is fully exercised at the HTTP boundary, so coverage is genuine — but the AC text and the test method disagree about how the fixture is built. | Either relax the two Verification paragraphs to say the snapshot may be seeded, or build the fixtures through a deploy. Cosmetic either way. |

## Notes for the Editor

**Finding 1 is the only thing blocking a pass, and it has two honest
resolutions. Pick one deliberately rather than reflexively editing the test.**

The reserved-segment collision is *currently untriggerable through the real
command*, and this is by design, not by oversight. `renderSite` calls
`emptyDir(outDir)` (`tools/generate/src/render/render.ts:217`) and emits
rendered pages flat, so a page slugged `draft` renders to `out/draft.html`, never
`out/draft/`; assets land under `out/assets/`. There is no site definition today
that produces a top-level `out/draft` entry, and a stray planted in `dist/` does
not survive the deploy's own render. STORY-95's Technical Context already records
this explicitly: the gate "is verified at its own entry point and starts earning
its keep the day rendered output gains nesting."

So the two resolutions are:

- **uat-edit** — keep AC-914 as written and make the test pin the *wiring*
  rather than the gate. The production ordering is genuinely correct
  (`deploy.ts:136` runs the gate after `collectSnapshotFiles` and before the
  first upload); it just is not pinned by anything. This needs a seam — an
  injected file list, or an instrumented client asserting the gate preceded the
  first `put`.
- **ac-edit** — accept that this invariant is provable only at its own entry
  point until rendered output gains nesting, and amend AC-914's Criterion and
  Verification to say so, dropping the "before any bytes are shipped" /
  "nothing was written to the store" clauses that no test can honestly satisfy
  today.

Either way, **delete the store-unchanged assertion at lines 880-881**. It is the
one assertion in this capability that reads as evidence and is not, and it
should not survive whichever route is taken.

**The story-level fail is not a second defect.** STORY-95's body claim —
"shipping one is refused at deploy time rather than silently producing an
unreachable page" — is the same promise AC-914 carries. STORY-95 returns to
`pass` the moment finding 1 is resolved; no story-body edit is needed, and its
body is aligned with REQ-111 and BUG-31 in every other respect.

**Nothing else in this capability needs repair.** STORY-94 (13 ACs) and STORY-96
(9 ACs) are fully and substantively covered. Spot-checks worth recording, all of
which held: AC-901 injects a genuine lost-update race through a wrapping R2
client rather than asserting the guard exists; AC-907 and AC-923 assert
`readKeys === []` so a rejected URL provably reaches no storage at all; AC-922
uses a raw socket because `fetch` collapses `..` client-side, which is the only
way the real attack shape reaches the confinement guard; AC-927 confirms the
sandbox bytes are genuinely present and readable at their key before asserting
the 404, so the confinement result is not a vacuous pass over a broken fixture.

**Evidence boundary, restated for the record** (unchanged from REPORT-1639, and
already documented in STORY-95's Technical Context): every serving UAT fakes R2
at the binding and nothing above it. The end-to-end smoke check against a live
bucket and the apex custom-domain provisioning were never run in session. This
bounds what "proven" means for AC-902 … AC-927 — including root confinement —
but it is the correct thin-mock line, and the matrix and the tests agree on it.
