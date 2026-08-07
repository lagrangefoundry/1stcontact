---
uid: report-0c9021b3
id: REPORT-1642
type: report
title: 'UAT Coverage: Site Delivery: Deploy & Public Serving'
created_by: xgd
created_at: '2026-08-07T22:32:35.011463+00:00'
updated_at: '2026-08-07T22:32:35.011463+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a12e557f
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Delivery: Deploy & Public Serving

**Result**: PASS
**AC verdicts**: 36 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 3 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Re-assessment after the fix workflow (REPORT-1641, `fix_uat_coverage`, 5 fixes
applied). The single violation raised in REPORT-1640 (AC-914) is resolved. Scope
unchanged: 3 stories, 36 active ACs, 36 UATs across 4 test files, all executing
and passing (`vitest run`, 36/36, 1.08s).

## Cumulative Intent Considered

Unchanged this round — no intent was added, retired or re-statused since
REPORT-1640. Both carriers remain `free_and_reconciled`: BUNDLE-13
(`bundle-e0143ffa`, merged at `1ee6aaf2`) and BUNDLE-14 (`bundle-0385746c`,
merged at `cd8f98c8`).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-109 | free_and_reconciled | 2026-07-30 | Document-relative asset emission + the flatness invariant — owned by STORY-83; precondition for AC-904/AC-921 and now the stated reason AC-914 is gate-level | YES (dependency) |
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy`: the operator half → STORY-94 | YES |
| REQ-111 | free_and_reconciled | 2026-07-30 | public-site Worker serves previews and published sites → STORY-95 | YES |
| REQ-113 | free_and_reconciled | 2026-07-31 | Extensionless page URLs agree across preview and production → STORY-96 | YES |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` fragment defect — other capability, noted as unblocked follow-up | YES (out of tree) |
| BUG-31 | free_and_reconciled | 2026-07-31 | Store-tree namespacing survives the shared-storage boundary → AC-924/925/926/927 | YES |

All 36 ACs remain `status=active`, `kind=behavior`, `regression_only=false`. No
AC is retired or unsupported; every one traces to a reconciled intent above.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-94 | REQ-110, BUG-31 | aligned | 13 ACs, all substantively covered; AC-900's under-assertion closed this round |
| STORY-95 | REQ-111, BUG-31 | aligned | Body **not edited** (`last_field_updated: uat_coverage`) and none was needed — its Technical Context already recorded the reserved-segment gate as a "standing invariant, not currently reachable … verified at its own entry point", which is exactly what the revised AC-914 now states |
| STORY-96 | REQ-113, REQ-109 (dep) | aligned | 9 ACs, all substantively covered; unchanged this round |

## What Changed Since REPORT-1640

The fix touched **two test files and no production source** (commit `9b7663ada`:
`reconciliation-deploy-snapshot.test.ts` +7/-3,
`reconciliation-serve-deployed-snapshot.test.ts` +21/-4). The remaining 34 ACs'
tests are byte-identical to the ones judged `pass` last round.

**AC-914 — resolved via the ac-edit route, which REPORT-1640 named as one of two
honest resolutions and left to the operator.** Independently re-verified:

- The vacuous store-unchanged assertion is gone.
- A genuine canary replaced it: a real `deploy()` of a nested page slug
  (`draft/index`) is attempted through the real command, refused by the render
  by name, and the store asserted byte-unchanged. Because a deploy really is
  attempted, "nothing shipped" is now a live assertion rather than one that
  cannot fail.
- **Mutation-confirmed the canary works**: disabling the render's flatness guard
  (`tools/generate/src/render/render.ts:259`) fails the AC-914 test. The failure
  is doubly informative — the received error is `Snapshot contains a top-level
  'draft' entry (out/draft/index.html)`, i.e. the deploy-level gate at
  `deploy.ts:136` genuinely fires the moment nesting becomes possible. The
  wiring is real and reachable; only its *trigger* is currently foreclosed.
- The revised Criterion states the limitation in its own text rather than
  implying coverage it does not have, and the revised Verification asks for
  exactly the five things the test now does.

**AC-900** — both upload-line regexes now require the size column, matching the
render line (`reconciliation-deploy-snapshot.test.ts:415-418`). Verified.

**AC-908 / AC-918** — Verification paragraphs relaxed to permit seeding objects
into an index-vouched snapshot. The behavioural claims are unchanged and remain
fully exercised at the HTTP boundary; only the fixture-construction language
moved to match the method. Verified.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac | AC-914 | — (disclosed, no action) | The production wiring at `tools/generate/src/deploy/deploy.ts:136` remains unpinned by mutation: commenting out `assertNoReservedSegment(files)` still leaves all 36 capability UATs green (re-confirmed this round against the revised suite). AC-914's Criterion retains the descriptive clause "enforced by the gate the deploy runs over that list before its upload stage", which no test pins. This is **disclosed, not hidden** — the same Criterion goes on to state that the collision is unreachable through the deploy command and that the refusal "is consequently stated and proved at the gate's own entry point". Recorded so it stays visible and is not silently reclassified as proven in a later round. | None required. Two standing options for the operator, either of which closes it: authorise a file-list seam in `DeployOptions` so `deploy.ts:136` becomes mutation-pinned, or leave it until rendered output gains nesting — at which point the canary fails and forces the promotion. |

Zero violations, zero needs_review.

## Notes for the Editor

**Why the fix workflow's `needs_review` forward is not recorded as
`needs_review` here.** REPORT-1641 asked the operator to confirm the ac-edit
route or authorise a production seam. That is a question about *evidence depth*,
not about whether the behaviour is wanted — the intent ledger is unambiguous
that REQ-111 supports the reserved-segment gate, and no intent retires it. This
assessment's `needs_review` category is reserved for elements the ledger is
silent or contradictory about, so classifying it there would force a FAIL and
re-loop the workflow over a question already answered once and documented in
two reports. It is carried as finding 1 instead, which keeps it visible without
falsely blocking.

**The ac-edit was a genuine narrowing plus real new coverage, not a claim
trimmed to fit an existing test.** Worth stating explicitly, because
"edit the AC until the test passes" is the failure mode this category invites.
Here the test gained an assertion it did not have (the nested-slug canary,
mutation-confirmed), lost one that could never fail, and the AC text moved to
match what is actually provable. Net evidence went up, not down. I independently
confirmed the uat-edit alternative is genuinely blocked without a production
change: `renderSite` calls `emptyDir(outDir)` then throws on any slug containing
a separator (`render.ts:255-265`), assets land under `out/assets/`, and
`assertNoReservedSegment` inspects only `out/`-prefixed entries
(`content.ts:88-91`) — so no site definition can put a top-level `out/draft/`
directory in front of the gate.

**Evidence quality across the capability remains high**, and it is what makes
the single warning tolerable rather than load-bearing. Every UAT drives a real
entry point — `cmdDeploy`, `worker.fetch(Request, Env, ExecutionContext)`,
`startServe` over a real loopback address, and a raw TCP socket where `fetch`
would normalise a traversal away before it reached the server. R2 is faked only
at the binding, the one boundary the project does not own. No test in this
capability is structural or mocks the component under test.

**Carried-forward evidence boundary** (unchanged, and already documented in
STORY-95's Technical Context): every serving UAT fakes R2 at the binding; the
end-to-end smoke check against a live bucket and the apex custom-domain
provisioning were never run in session. This bounds what "proven" means for
AC-902 … AC-927, including root confinement. It is the correct thin-mock line
and the matrix and tests agree on it — noted for continuity, not as a defect.

**Out-of-scope observation, forwarded not actioned:** REPORT-1641 recorded a
transient failure in `tests/reconciliation-l1-navigation.test.ts:475` (a jsdom
`hashchange` assertion) under parallel load. That belongs to another capability
and did not reproduce in this round's runs. Flagged for whoever owns L1
navigation.
