---
uid: report-477be314
id: REPORT-3660
type: report
title: 'Capability-Intent Alignment: Operator Access Gate: Who May Reach The Builder
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T04:23:22.401419+00:00'
updated_at: '2026-09-10T04:23:22.401419+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-3606e35b
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Operator Access Gate: Who May Reach The Builder
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

The capability holds one story (STORY-120, `story_kind=upgrade`, so ACs are
expected) carrying 14 active acceptance criteria. Every behavioural clause in
the story body maps to a criterion, no criterion asserts behaviour the story
body does not support, and no two criteria assert the same thing in the same
way. One criterion (AC-1378) states an absolute that a later, operator-restated
intent (REQ-145) made narrowly untrue; it is recorded as a warning because the
claim holds for every deployed configuration and for every case its own
verification drives.

## Cumulative Intent Considered

STORY-120 carries `intent_uid: bundle-b3b7c399` (BUNDLE-20) and
`updated_by: bundle-78f4e2fe` (BUNDLE-21). The ledger below names the source
tickets inside those bundles that actually touch this capability, rather than
the bundles themselves.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-147 (`request-23fd6e61`, in BUNDLE-20) | free_and_reconciled | 2026-08-15 | The originating intent: Access as the operator gate; `workers_dev = true` named as the hole; in-Worker JWT verification *and* the hostname control ("Given DOC-2 is the security policy, both"); 6 ACs — unauthenticated challenged, off-policy refused (Cloudflare-side), workers.dev shut, Worker refuses a request with no valid JWT, an admitted identity reaches the Worker and gets whatever it answers, configuration recorded in the repository. Implementation record adds: JWKS-pinned algorithm, `aud` checked, fail-closed with 503-vs-401 split, `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` on both sides of the inheritance line, `ACCESS.md` as the policy record. | YES |
| REQ-145 (in BUNDLE-20) | free_and_reconciled | 2026-08-15 | Among much else, added `ACCESS_DEV_OPEN` — an opening for the loopback dev server that "applies only when Access is unconfigured, is absent from `[env.production.vars]` (which inherits nothing), and a UAT [asserts that absence]". Supersedes REQ-147's "no local-development bypass" statement. | YES |
| BUG-36 (`bug-db356ff8`, in BUNDLE-21) | free_and_reconciled | 2026-08-23 | Approved scope addition: the automation caller's side of admission — `push` sends the `CF-Access-Client-Id`/`CF-Access-Client-Secret` pair instead of the `cf-access-jwt-assertion` header the edge ignores; `redirect: 'manual'` so a bounce is not read as success; `--token`/`CF_ACCESS_TOKEN` deleted per the no-legacy-modes rule; `bin/access-token` provisions the service token against the management API and prints the secret once; ACCESS.md records the granted service identity. Landed and confirmed against the real Access gate. | YES |
| BUG-37, BUG-38 (BUNDLE-21) | free_and_reconciled | 2026-08-24 | Preview render cache (1102) and chat conversation lifetime — neither touches the gate. | YES (no bearing) |
| REQ-144 (dependency of REQ-147) | — | — | Context only: control-app 503s everywhere, which is why REQ-147 records the exposure as latent. | context |

No intent created after the 2026-08-31 reconciliation touches this capability:
the requests filed since (REQ-154..REQ-166) are browser rendering, capture,
imaging, and the knowledge-base/ticket-store line; the only later bug (BUG-39)
is the Node chat-host model double. So the cumulative picture is REQ-147 as
amended by REQ-145 (the dev opening) and extended by BUG-36 (the automation
caller and its provisioning).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1375 — a granted identity is admitted and receives the surface's response | REQ-147 (AC5) | aligned; correctly declines to require a working builder, matching the story's out-of-scope boundary |
| AC-1376 — identity accepted from header, cookie, or service identity | REQ-147 §3 (cookie inheritance, service token), reconciliation 2026-08-31 (header wins) | aligned; the header-first precedence and the cookie source are the reconciliation decisions the story body records |
| AC-1377 — an unverifiable caller is refused, told which check failed, reaching nothing behind the gate | REQ-147 (AC4 + implementation record's 8 cases) | aligned; asserts "no configuration of a **configured** gate" admits, which is exactly the line the story body draws around REQ-145's opening |
| AC-1378 — an incompletely configured gate refuses everything with a distinct status | REQ-147 (fail-closed, 503-vs-401) | **warning**: unqualified "refuses **every** request … neither degrades to admitting traffic" is untrue for the both-empty state REQ-145's `ACCESS_DEV_OPEN` opens (finding 1) |
| AC-1379 — unobtainable signing keys deny | REQ-147 (implementation record: unfetchable JWKS → 401) | aligned |
| AC-1380 — a newly published signing key is honoured without a restart | reconciliation 2026-08-31 (gap-filling; REQ-147 silent on rotation) | aligned; the story body records this as a reconciliation decision and labels it as such |
| AC-1381 — refusals neither stored nor indexed | reconciliation 2026-08-31 (REQ-147 silent beyond status) | aligned; likewise recorded as a reconciliation decision |
| AC-1382 — the deployment answers on no address the gate does not front | REQ-147 §2 + AC3 | aligned; matches `apps/control-app/wrangler.toml:16` (top level) and `:188` (`[env.production]`), with the operator route still declared at `:189-191` |
| AC-1383 — the gate's configuration is declared for every environment | REQ-147 implementation record ("vars declared on both sides of the inheritance line") | aligned; matches `wrangler.toml:102-106` and `:209-212` |
| AC-1384 — granted identities, both controls and how to verify them recorded, with no credential | REQ-147 (AC6), and AC2 explicitly excluded as unassertable | aligned; the AC's own "Out of scope for this criterion" section carries REQ-147 AC2's exclusion, which is what the story's Technical Context asks it to do |
| AC-1450 — the automation caller presents the pair, never the assertion header | BUG-36 (approved scope addition) | aligned |
| AC-1451 — half a token is refused before any request and before the first site moves | BUG-36 (pre-flight refusal; `--token`/`CF_ACCESS_TOKEN` deleted, not deprecated) | aligned; the deletion clause is verifiable and holds — `CF_ACCESS_TOKEN` survives in the tree only inside two assertions of its own absence (`tests/test_UAT_FC_BUG-36_publish_credential.test.ts:150`, `tests/reconciliation-builder-private-access-automation.test.ts:338`) |
| AC-1452 — a bounce reads as an authentication refusal, never as success | BUG-36 (`redirect: 'manual'`, the `<!DOCTYPE html>` parse error) + reconciliation 2026-08-31 (opaque response) | aligned; the opaque-response extension is declared in the AC's own reconciliation note |
| AC-1453 — the automation identity is provisioned by a documented command that persists no secret | BUG-36 (`bin/access-token`) + reconciliation 2026-08-31 (management-API base-URL seam) | aligned; the base-URL override and the stated non-guarantee (live admission is CAP-102's) are both recorded in the AC |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1378 | ac-edit | AC-1378 states without qualification that a gate with incomplete configuration "refuses **every** request, including one carrying an otherwise-valid identity" and that neither setting "degrades to admitting traffic". REQ-145 (free_and_reconciled, 2026-08-15) added `ACCESS_DEV_OPEN`, and the landed code skips the gate entirely when **both** settings are empty and that var is `1` — `apps/control-app/src/index.ts:53-60` (`isUnconfiguredLocalDev`) and `:76-79` (the `if (!isUnconfiguredLocalDev(env))` guard), with the var shipped at `apps/control-app/wrangler.toml:104`. The both-empty state AC-1378 names is precisely the state the opening applies to. STORY-120's own reconciliation decision draws the line at a *configured* gate ("the criteria below assert that a **configured** gate has no exception path"), and AC-1377 honours it — but AC-1378 is the one criterion about the *unconfigured* gate, so the story's qualifier never lands on it. | Qualify the absolute: state that an incompletely configured gate refuses every request **absent the loopback development opening REQ-145 declares** — which applies only when both settings are empty and is declared where a named environment cannot inherit it — so the criterion cannot be read as forbidding intent the operator has restated. The verification (three cases, no `ACCESS_DEV_OPEN`) needs no change; only the claim's scope does. |
| 2 | info | exclusivity | AC-1384 + AC-1453 | — | Both criteria assert properties of the same policy record: AC-1384 requires it says "how automation authenticates … and that its secret belongs in a secret store rather than in the repository"; AC-1453's closing clause requires it "says the secret belongs in a secret store, and contains no secret value". The overlap is real but partial — AC-1453 additionally requires the service identity be a **granted row with a reason** (which AC-1384's identity-table clause does not reach, since it speaks of granted identities generally), and it is the record-side observation of the command AC-1453 is about. STORY-120's reconciliation decision filed AC-1450–1453 here knowing AC-1384 already required the record. No action. | none |
| 3 | info | consistency | AC-1383 | — | The two settings are declared at top level with **empty** values (`wrangler.toml:105-106`) and filled in only under `[env.production.vars]` (`:211-212`). That satisfies AC-1383 as written ("appears both in the top-level value block and in the production environment's value block") and is deliberate — the empty top-level pair is what keeps `ACCESS_DEV_OPEN` reachable for `wrangler dev`. Recorded so a future reading of AC-1383 does not mistake the empty top-level values for drift. | none |

## Notes for the Editor

- **Nothing at this level is blocking.** Coverage is complete: every behavioural
  clause in STORY-120's Description, its In-scope list, and each of its nine
  Reconciliation Decisions either has a criterion or is explicitly recorded as
  deliberately not formalized (the stale "both settings ship empty" note in
  ACCESS.md; the proxy opt-in; live-gate admission, which is CAP-102's).
- **Finding 1 is a phrasing scope, not a behaviour change.** Do not resolve it
  by adding a criterion that forbids the bypass — STORY-120 explicitly warns
  against that ("No criterion here asserts 'no bypass exists', because that
  would set regression against intent the operator has since restated"), and the
  containment of `ACCESS_DEV_OPEN` (its absence from `[env.production.vars]`)
  is owned by the Builder Workspace Origin and Platform Build items that own
  those configuration files.
- **Two out-of-repository exclusions are correctly carried in AC text rather
  than lost.** REQ-147 AC2 (an identity that authenticates but is off the
  policy) is excluded inside AC-1384's own "Out of scope for this criterion"
  section; live admission of the minted pair is excluded in AC-1453's
  reconciliation note. Both are the right shape — an exclusion stated in the
  criterion beats an absent criterion, which reads as a coverage gap on the next
  pass.
- **Implementation spot-checks made while assessing** (read-only, no changes):
  `wrangler.toml` matches AC-1382 and AC-1383; the deleted single-value
  credential name appears nowhere in the publish path, only in two tests
  asserting its absence, matching AC-1451.
