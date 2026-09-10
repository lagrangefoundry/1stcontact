---
uid: report-48ffe284
id: REPORT-3659
type: report
title: 'Capability-Intent Alignment: Operator Access Gate: Who May Reach The Builder
  (level=story)'
created_by: xgd
created_at: '2026-09-10T04:18:10.245285+00:00'
updated_at: '2026-09-10T04:18:10.245285+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-3606e35b
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Operator Access Gate: Who May Reach The Builder
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

The capability holds exactly one story — STORY-120 (`story-182e8cb9`,
`story_kind: upgrade`, `intent_uid: bundle-b3b7c399`, `updated_by:
bundle-78f4e2fe`) — carrying 14 active ACs (AC-1375 … AC-1384, AC-1450 …
AC-1453). Every behaviour the reconciled intent ledger asks of this capability is
expressed in that story body, nothing in the body is unsupported by the ledger,
and no second story competes for the same intent.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Bundle membership
is given because both of the story's intent fields point at bundles, not at the
source tickets: BUNDLE-20 (`bundle-b3b7c399`, `free_and_reconciled`, merged at
`eef7a8b4`) and BUNDLE-21 (`bundle-78f4e2fe`, `free_and_reconciled`, merged at
`96a76934`).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-147 (`request-23fd6e61`) | free_and_reconciled | 2026-08-15, merged in BUNDLE-20 2026-08-24 | **Originating intent.** Access is the operator gate; `workers_dev = true` is a hole a hostname policy cannot cover; close it by *both* removing the default hostname and verifying the JWT in the Worker; fail closed; record which identities are granted and why in the repository. Its own AC1–AC6. | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15, BUNDLE-20 | Added `ACCESS_DEV_OPEN` — a loopback opening that applies **only** when the gate is entirely unconfigured, declared where a named environment cannot inherit it. Operator's own review note names it as a bypass. Supersedes REQ-147's unqualified "no exception path". | YES (modifies) |
| REQ-144 (`request-7bef34e0`) | free_and_reconciled | 2026-08-15 | Sequencing and the `[vars]`-inheritance rule the gate's configuration declaration rides on ("this ticket → REQ-147's Access policy and `workers_dev` decision → DNS → deploy"). Adds no gate behaviour of its own. | YES (supporting) |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15, BUNDLE-20 | Carries REQ-147 §3's one deferred confirmation — that the SSE turn `/api/ai/prompt` survives Access — **by REQ-147's own assignment**, not this capability's. | YES (assigned away) |
| BUG-36 (`bug-db356ff8`) | free_and_reconciled | 2026-08-23, merged in BUNDLE-21 2026-08-26 | Approved scope addition: the **caller's** side of admission — `push` sends `CF-Access-Client-Id`/`CF-Access-Client-Secret` instead of the forwarded `cf-access-jwt-assertion` header; `--token`/`CF_ACCESS_TOKEN` deleted (no-legacy-modes); `redirect: 'manual'` so a 302 to the login page stops reading as success; new `bin/access-token` provisioning driven by the management API token; ACCESS.md § Automation row. | YES |
| REQ-154 (`request-b88b79fe`) | bundled (BUNDLE-22, `free_and_reconciled`) | 2026-08-31 | Explicitly **considered and rejected** giving the cloud renderer a service token, choosing self-origin fulfilment instead (STORY-125, `capability-aa030c83`). Adds no ask to this gate; its story defers gate behaviour here by name. | YES (no ask) |
| BUG-37, BUG-38, BUG-39, REQ-162 | free_and_reconciled | 2026-08-24 … 08-31 | Touch the gate only as *callers* (BUG-37's repro `curl` carries a service token). No gate behaviour asked or changed. | YES (no ask) |
| REQ-158, REQ-159, REQ-160, REQ-161, REQ-163–166 | draft | 2026-08-28 … 08-31 | Not yet active. | NO |

Confirmed by `git log` over `apps/control-app/src/access.ts`,
`apps/control-app/src/index.ts` and `bin/access-token`: the only change after
BUNDLE-21 is `89570426c1` (`xgd-intent: bundle-78f4e2fe`), the reconciliation fix
that added the management-API base-URL seam the story records under
Reconciliation Decisions. No unledgered intent has moved this capability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-120 (`story-182e8cb9`) — "The builder is private: only granted identities reach it, on every address it answers on" | REQ-147, REQ-145, BUG-36 (+ REQ-144 supporting) | **aligned** — every reconciled ask is expressed; no unsupported text; delegations verified against their named targets (see below) |

**Ask-by-ask coverage, REQ-147:**

| REQ-147 ask | Expressed as | Verified |
|---|---|---|
| AC1 — unauthenticated caller to the hostname is challenged | Delegated to CAP-102 in Technical Context | AC-1425 on `story-d5167ced` (STORY-119) exists and says exactly this |
| AC2 — an off-policy identity is refused after authenticating | Declared not assertable; recorded in the policy record instead | AC-1384 states the exclusion, so the story cycle cannot author an impossible UAT |
| AC3 — the `workers.dev` URL does not serve | AC-1382 (+ CAP-102's live half in AC-1425) | `apps/control-app/wrangler.toml:16,188` — `workers_dev = false` top level and restated under `[env.production]` |
| AC4 — the Worker rejects a request carrying no valid JWT | AC-1377, with AC-1378 (unconfigured → distinct status) and AC-1379 (unfetchable keys deny) | story body's fail-closed paragraph |
| AC5 — an admitted identity reaches the Worker and receives its response, **without requiring a working builder** | AC-1375, and the story's Out of scope holds the same line | story body reproduces REQ-147's own circularity argument verbatim in intent |
| AC6 — configuration recorded in the repository | AC-1384 | — |
| §2 "both" controls, given the security policy | Both controls stated as independent in the Description | — |
| §3 draft snapshots stay link-private, not authenticated | Named in Out of scope, unrevisited | matches REQ-147 |
| §3 automation needs a service token | AC-1376 (admits it) + AC-1450/1451/1452/1453 (produces it) | — |

**Ask-by-ask coverage, BUG-36 (approved scope addition):** service-token pair
not the forwarded assertion header → AC-1450; partial credential refused
pre-flight → AC-1451; `redirect: 'manual'`, bounce never reads as success →
AC-1452; `bin/access-token`, separate Service Auth policy, secret printed once
and persisted nowhere → AC-1453; ACCESS.md § Automation row → AC-1384.

**Ask coverage, REQ-145:** the story asserts a **configured** gate has no
exception path — true, durable, and it survives the exception being removed —
and assigns the containment of `ACCESS_DEV_OPEN` itself to the items that own the
files it lives in. Verified: AC-1341 on STORY-119 carries "exactly **one** stated
exception … identified by name and one variable only", and
`tests/test_UAT_FC_REQ-145_build_artifacts.test.ts:105-106` pins both halves
(present at top level, absent from `[env.production.vars]`). The story is right
not to assert "no bypass exists" — REQ-145 is the later intent and the operator
restated it.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-120 | — | REQ-147 §3's "the SSE turn `/api/ai/prompt` must be confirmed to survive Access" is assigned by REQ-147 itself to REQ-146 ("it is recorded here because this is where the risk originates"). It is therefore not an ask of this capability and its absence here is not a gap. Recorded so a later check does not re-derive it as one. | none |
| 2 | info | consistency | STORY-120 | — | Three reconciliation-formalized behaviours — AC-1376 (cookie fallback, header first), AC-1380 (key rotation without restart), AC-1381 (refusals neither cached nor indexed) — are supported in the body's **Reconciliation Decisions** section rather than in the Description narrative, each with its gap-in-REQ-147 rationale stated. The ac-level cycle should read Reconciliation Decisions as part of the working reference, not only the Description. | none |
| 3 | info | consistency | STORY-120 | — | The body's claim that AC-1453 moved from source-pattern-matching to stub-driven request assertions via an overridable management-API base URL is accurate on the tree: `bin/access-token:38,53,62,68` (`CLOUDFLARE_API_BASE`), landed by `89570426c1` under `xgd-intent: bundle-78f4e2fe`. | none |
| 4 | info | exclusivity | STORY-120 vs STORY-125 (`story-7fa314f5`, `capability-aa030c83`) | — | STORY-125 ("Self-origin fulfilment") is the nearest neighbour and reads as gate-adjacent, but it defers by name: "The behaviour of the sign-in gate itself — whom it admits and whom it refuses … belongs to the access-gate story." REQ-154 reached the same split by rejecting a renderer service token. No overlap. | none |
| 5 | info | consistency | STORY-120 | — | The body's note that ACCESS.md's "both settings ship empty" line is stale prose, deliberately not formalized, is still the right call and the drift has since closed on its own: `wrangler.toml:211-212` carries the real production values while `:105-106` keeps the top-level pair empty (which is what makes `ACCESS_DEV_OPEN` reachable), and ACCESS.md:44-48 now documents that arrangement rather than the transient one. | none |

## Notes for the Editor

**Nothing to repair at this level.** The story is unusually well-instrumented
against exactly the drift this check looks for: it carries a Reconciliation
Decisions section that names, for each behaviour the original intent was silent
on, which intent it fills a gap in and why — and every one of those claims
checked out against the tree.

Two things worth knowing for the downstream `ac` and `uat` cycles:

- **The story deliberately delegates three assertions outward**, and all three
  targets were verified to exist and to say what the story claims: the
  live-origin half to CAP-102 (AC-1425), the `ACCESS_DEV_OPEN` containment to
  CAP-102 (AC-1341), and the "admitted caller" qualification of the pre-gate
  origin criteria to the Builder Workspace Origin item (AC-964 / AC-965 on
  `story-e674c60a`, both now worded "for an **admitted** caller"). An ac-level
  check should not read these as gaps.

- **REQ-147 AC2 is intentionally unrepresented and must stay that way.** "An
  identity not on the policy is refused after authenticating" is enforced by the
  identity gateway before the request reaches the application, so no test in this
  repository can exist for it. AC-1384 states the exclusion explicitly. A
  uat-level cycle that tries to author coverage for it will be authoring a
  fiction.
