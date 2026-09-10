---
uid: report-ebd04b23
id: REPORT-3716
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (uat) — attempt 4 (continuation):
  findings 2 and 5 closed'
created_by: xgd
created_at: '2026-09-10T10:48:41.204159+00:00'
updated_at: '2026-09-10T10:48:41.204159+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (uat)

**Attempt**: 4 (continuation — the loop re-invoked after the previous call's
`needs_more_work: true`; that call's work is committed as `7b4bb0f470`)
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

Findings 2 and 5 — the last two open violations, and the pair the validation
report flagged as one cross-wiring pattern — are now closed. Findings 1, 3, 4 and
warning 6 were closed in the previous call. **Every finding in `report-718c7ce2`
has been addressed, and every assertion written across both calls has been run.**

## The blocker from last call, and what dissolved it

Last call I deferred findings 2 and 5 because both landed in
`test_UAT_AC964_…`, which is driven by `unstable_dev` — a `wrangler dev` child
process that does not start in this sandbox. Writing them there would have
shipped unrun assertions, which is what this cycle exists to remove.

That premise turned out to be too narrow. `test_UAT_AC1400_…` already drives the
deployed Worker's **own `fetch` in-process** — `import worker from
'apps/control-app/src/index'`, a hand-built `Env`, and a real Cloudflare Access
team on loopback minting real RS256 tokens — with no subprocess at all, and it
runs here. `unstable_dev` was never required to reach the entry point; it was
only ever required to reach a *store*. So both findings became not just
authorable but verifiable, and AC-964's test is now runnable where it was not.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1401 / `tests/support/transport-contract.ts` (new) | Authored the shared declaration both front doors are held to: per route, the status, content type, freshness directive and a door-independent body descriptor, spanning the classes the AC names — document, read, write, render |
| 2 | uat-edit | AC-1401 / `tests/reconciliation-workspace-transport.test.ts` | Replaced the four hand-written route drives with a sweep of the whole contract against the **local front door**, each route asserted `toEqual` the declared answer. Kept the byte-for-byte `chromeHtml()` check (only this door shares a process with the composer) and the freshness check on a route that misses |
| 3 | uat-add | AC-1401 / `tests/reconciliation-workspace-transport.workers.test.ts` (new) | Authored the **deployed-runtime leg**: the Worker's own `fetch` over real D1 and R2 inside workerd, seeded through `/api/import`, sweeping the *same* contract in the *same* order |
| 4 | uat-add | AC-964 / `tests/reconciliation-workspace-admission.workers.test.ts` (new) | Authored the full **four-class admitted/unadmitted sweep** over a real store — document, build artifact, operation, rendered channel — each refused and each refusal asserted to carry none of the admitted bytes. Plus a second UAT pinning the refusal's legibility |
| 5 | uat-edit | AC-964 / `tests/reconciliation-builder-workspace-origin.test.ts` | Rebuilt the test around the admitted/unadmitted split at **real-token fidelity**, deleted the worker-vs-builder byte comparison (now AC-1401's), and ported the whole leg off `unstable_dev` onto the Worker's own in-process `fetch` |
| 6 | uat-edit | same file | Header corrected to describe the two entry points now in use; the `UnstableDevWorker` and `applyLocalD1Schema` imports left dead by (5) removed |

## Finding 5 — how the two doors are actually compared

The AC asks that a representative set of routes be driven through the local front
door **and through the deployed runtime**, with the same request producing the
same status, content type and shape of answer from both.

**The two doors cannot share a process.** `vitest.config.mts` routes
`*.workers.test.ts` into workerd and everything else into node. A workerd test
has no `node:http` and cannot stand up `startBuilder`; the node pool has no D1 or
R2 binding and cannot give the deployed Worker a store. I confirmed the latter
directly — `worker.fetch(request, env)` takes no deps parameter
(`apps/control-app/src/index.ts:78`), so the store is built from `env.DB` /
`env.SITES` and cannot be injected.

**So they share a statement instead of a process.** `TRANSPORT_CONTRACT` is the
only place the expectation exists; each leg asserts its own door against it. The
bodies are reduced to door-independent descriptors, because the two doors read
different stores by construction — that difference is the ticket's subject, and
the *shape* is what must not differ.

**Proven to bind both doors, not just to pass.** I perturbed one declared content
type in the shared module (`application/json` → `application/xml`) and re-ran:

```
AssertionError: the local front door on a route that READS the store: expected … to deeply equal …
AssertionError: the deployed runtime on a route that READS the store: expected … to deeply equal …
 Test Files  2 failed (2)
```

Both legs failed on the single edit — which is the property that makes this a
comparison rather than two independent tests that happen to agree. Reverted, and
both pass again.

Each leg also asserts the contract still spans all four classes, so a sweep
quietly reduced to one class fails twice rather than passing twice.

## Finding 2 — how AC-964's sweep is built, and why it is in two files

The AC needs a real store (three of its four classes are store-backed) **and** a
real Access gate. No single pool has both, so the evidence is split the way the
alignment ledger already accepts for AC-965 — two shapes, one documented reason,
neither restating the other:

| Leg | Pool | Has | Covers |
|---|---|---|---|
| `reconciliation-workspace-admission.workers.test.ts` | workerd | real D1 + R2 | **all four classes** admitted vs unadmitted, over real data, with refusal-body comparison |
| `reconciliation-builder-workspace-origin.test.ts` | node | real Access team, real RS256 tokens | the two store-free classes at **token fidelity**, plus the same-origin claims |

Breadth in one, token fidelity in the other. The AC's demand that the build
artifact be included **explicitly** is honoured in both.

**The refusal is pinned to the gate, not merely to failure.** `access.ts` fails
closed down two paths: an *unconfigured* gate answers 503 naming the empty
variable, and a *configured* gate presented with no usable token answers 401.
Only the second is "a caller this host did not admit" — the first is a deployment
that cannot check anyone, and a sweep landing on it would look exactly as green
while proving nothing. So both legs assert **401 specifically**, and the workers
leg additionally asserts the body does not match `/is not configured|are empty/`.
I verified empirically that the configured-with-no-token path is the one taken.

**Non-vacuity built in.** The sweep asserts the four admitted bodies are mutually
distinct, so "the refusal carries none of those bytes" cannot hold merely because
every route returns the same uninformative body. It also asserts the seeded
slug — which both the listing and the rendered channel contain — never appears in
a refusal, so a refusal that had already read the store would be caught.

**The former side-by-side comparison is deleted, not moved twice.** AC-964's test
used to compare the Worker's bytes with the local transport's for the same route.
That is AC-1401's claim, it now lives there, and AC-964's own Verification says it
"must not be restated as a route compared with itself". This is the overlap the
validation report's *Notes for the Editor* warned would recur if the three
findings were fixed independently; following its prescribed ordering
(AC-966 → AC-1401 → AC-964, across the two calls) avoided it.

## Verification — what was actually run

| Suite | Result |
|---|---|
| `reconciliation-workspace-transport.test.ts` | ✓ AC-1401 local leg |
| `reconciliation-workspace-transport.workers.test.ts` | ✓ AC-1401 deployed leg (new) |
| `reconciliation-workspace-admission.workers.test.ts` | ✓ 2 UATs (new) |
| `reconciliation-builder-workspace-origin.test.ts` | 8 passed — **AC-964 now runs in 8ms** where it previously timed out at 60s |
| `naming`, `bug32-webui-scope-rebrand`, `ci-workflow`, request-time-render, mounted, chrome, toolbar-lifetime, build-artifacts, boot-guard | **9 files, 29 tests, all passed** |
| edge-origin, tenant-bootstrap, transport ×2, admission, component-resolution-anchor | **6 files, 13 tests, all passed** |

### One pre-existing failure remains, untouched

`test_UAT_AC965_…` still times out at 180s. It stands up `unstable_dev`
deliberately — its subject is a Worker that *could not be configured*, which has
to be stood up as one — so it cannot be ported the way AC-964 was. I confirmed
last call that it fails identically on unmodified `HEAD`. AC-965 is on the
validation report's **aligned** list and is not one of its findings; this is an
environment limitation of this sandbox, not a coverage or consistency gap.

## Code Edits (if any)

None. The only production-source change was a deliberately temporary
non-vacuity probe in the *previous* call, reverted and verified clean there.
This call touched tests and test support only:

```
 M tests/reconciliation-builder-workspace-origin.test.ts
 M tests/reconciliation-workspace-transport.test.ts
?? tests/reconciliation-workspace-admission.workers.test.ts
?? tests/reconciliation-workspace-transport.workers.test.ts
?? tests/support/transport-contract.ts
```

## needs_review Items Forwarded

None. The provenance caveat the validation report has now recorded six times
(no `intent_uid` on CAP-85 or any of its 36 ACs; `updated_by` on STORY-99 is a
scalar holding only `bundle-78f4e2fe`) remains an operator decision and is not a
uat-level fix.

## Field-ownership note

`uat_coverage` was **not** written on any AC in either call, including AC-964,
AC-966, AC-1033 and AC-1401 whose tests changed shape. That field belongs to
check/fix_uat_coverage, and `report-718c7ce2` says explicitly that nothing in
this cycle should set it.

## Note for the assessor — new test files

Three files were added, and the AC they serve is named in each file's header
rather than only in its test names:

- `tests/support/transport-contract.ts` — not a suite; the shared declaration
  imported by both AC-1401 legs.
- `tests/reconciliation-workspace-transport.workers.test.ts` — AC-1401, deployed leg.
- `tests/reconciliation-workspace-admission.workers.test.ts` — AC-964, full sweep.

AC-964 and AC-1401 now each resolve to **two** `test_UAT_AC<n>_*` functions in
two files with different runtime shapes and a documented reason, which is the
same arrangement the ledger already records as aligned for AC-965 and AC-970.
