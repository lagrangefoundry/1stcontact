---
uid: report-cb8d3f66
id: REPORT-3018
type: report
title: 'Reconciliation Review: commits (BUNDLE-21)'
created_by: xgd
created_at: '2026-08-31T17:50:45.182581+00:00'
updated_at: '2026-08-31T17:50:45.182581+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-78f4e2fe
  anchor_uid: bundle-78f4e2fe
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-78f4e2fe (BUNDLE-21 = BUG-36 + BUG-37 + BUG-38)
**Stories Reviewed**: 5

Intent fidelity and story-level behavioural coverage both PASS. The failure is
Step 5b, evidence sufficiency: two active criteria the bundle *modified* are not
proven by their UATs, and one of them is proven **backwards** — its only UAT
asserts the behaviour BUG-38 deliberately reversed, and would fail against the
landed code. That is precisely the outcome the reconciliation plan warned about
("Left alone, regression would hold the matrix against the fix and pin both
bugs"). The plan corrected the criterion; the test was not brought with it.

## Behavior Inventory

7 behaviours identified across the five free-coded commits (ea48502d, 2058a164,
0fe586d1, 999579b3, 63df97c9), read from
`apps/control-app/src/store.ts`, `apps/control-app/src/router.ts`,
`apps/control-app/wrangler.toml`, `tools/generate/src/store/d1r2-store.ts`,
`tools/generate/src/cli/push.ts`, `.../cli/index.ts`, `.../cli/builder.ts`,
`.../cli/ai/host-core.ts`, `bin/publish`, `bin/access-token`, `ACCESS.md`.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `storeFor` registers the configured tenant on the cold path; `storeForImport` and `deps.importStore` deleted | Covered | story-e674c60a | AC-1449, AC-1402. UAT drives the real Worker `fetch` against real D1 and reads the accounts back; SQL recorded through a `Proxy` over the live binding to prove the warm path writes nothing. |
| 2 | `UnknownTenantError` carries `reason: 'unknown' \| 'inactive'` | Covered (story) / **Evidence FAIL** | story-fde7370b | AC-1387 states the discriminant correctly. Its UAT asserts only that the two *messages* differ. See Evidence Gaps #2. |
| 3 | Assembled-draft memo in `loadDraft`, keyed (tenantId, slug), invalidated by a live version read | Covered | story-fde7370b | AC-1447/AC-1448. UATs assert by object **identity** in workerd against real D1/R2, including a second independently obtained handle, an asset write, `forget`, rows vanishing underneath, and two accounts sharing a slug. Strong. |
| 4 | `[observability]` unsampled, declared top-level and under `[env.production]`, placed after `routes` | Covered | story-d5167ced | AC-1454/AC-1455, asserted on the parse with a negative control that proves the hoisted form really does swallow the route. |
| 5 | Push presents `CF-Access-Client-Id`/`-Secret`; assertion header deleted; `redirect: 'manual'`; half-credential and bounce refusals | Covered | story-182e8cb9 | AC-1450/1451/1452 driven through `pushSite`, the real `1c` entry point and `bin/publish` as a spawned process, with a recording `fetch` as the only stub. |
| 6 | `bin/access-token` provisions/rotates the service token and persists no secret | Partial | story-182e8cb9 | AC-1453. Runtime evidence exists but most claims are regexes over the script's source. See Evidence Gaps #4. |
| 7 | `minted` map deleted; session id resolved via `SiteStore.hasDraft` | Covered (story) / **Evidence FAIL** | story-a58a0974 | AC-1456 is excellently evidenced in workerd. AC-1055's own UAT still pins the deleted behaviour. See Evidence Gaps #1. |
| — | `package.json` 0.2.12 → 0.2.13 | N/A | — | No behaviour; no plan item, correctly. |

## Intent Fidelity

No absorbed divergences. Both explicit supersessions are stated in the criteria
themselves rather than silently applied:

- **AC-965** names the case it retired and why ("A third case used to be asserted
  here and is deliberately no longer … refusing it was the outage rather than the
  diagnosis of one").
- **AC-1055** restates the authority test from "this process issued it" to "it
  names a site this account holds", and says why refusing the derivable form
  would refuse every turn.

Intent-silent behaviour formalized into criteria is recorded under
`## Reconciliation Decisions` in all five stories, dated 2026-08-31, with the
one genuinely new inference (AC-1452's opaque-response case) carrying its own
`## Reconciliation note` on the criterion. BUG-37's confirmed root cause (the
free-plan CPU ceiling) correctly generates no criterion, and STORY-121 records
that decision explicitly. The two declared non-changes — the dead `PREVIEWS`
WeakMap and `NODE_USE_ENV_PROXY` — are honoured: no story claims either.

## Ungrounded Stories

None. Every story claim traces to the ticket bodies or to code I read.

## Evidence Gaps (Step 5b) — these are the failure

### 1. AC-1055 — the only covering UAT asserts the opposite of the criterion (BLOCKING)

`tests/reconciliation-assistant-conversation.test.ts:344`
`test_UAT_AC1055_an_identifier_the_origin_never_issued_is_refused_before_anything_is_streamed`

The UAT asserts:

- `POST /api/ai/prompt` with `` `site-${SLUG}` `` — where `SLUG` is a site the
  store holds — returns **404** ("Exactly what the origin derives for an existing
  site: being derivable is not the same as having been issued").
- A held-over id after `resetAiHost()` returns **404**, with an inline comment
  citing "the in-memory `minted` map (`host.ts:389`), cleared by the restart, and
  there is no fallback".

Both are now false by construction. `minted` is deleted;
`tools/generate/src/cli/ai/host-core.ts:293-296` resolves via
`(await deps.store.hasDraft(slug)) ? slug : null`, and
`tools/generate/src/store/fs-store.ts:81` returns true whenever the site
directory exists — which `cmdNew(SLUG, { cwd })` in the file's `beforeAll`
creates. So both cases resolve, the turn is answered 200 as an event stream, and
`expect(res.status).toBe(404)` plus `expect(client.seen).toHaveLength(0)` fail.

AC-1055 as restated requires the opposite: "An identifier of the form the origin
derives for a site the account holds **resolves, and its turn is answered.** It
is the only thing a client carries between opening a conversation and speaking in
it, so refusing it would refuse every turn."

Also uncovered by any UAT, though AC-1055's Verification enumerates them:
- a fabricated identifier distinct from the traversal case;
- an identifier with no derivable site name (unprefixed, and the bare prefix with
  nothing after it);
- **the account-scoped refusal** — "submit the first identifier against an
  account that does not hold that site: it is refused there, so the resolution is
  scoped to the account and not merely to the name." This is the property the
  criterion says the change *strengthened*, and nothing asserts it.

Remediation: rewrite this UAT against the restated AC-1055 — the derivable id for
a held site resolves and is answered; the four refusal shapes are refused as a
plain non-streaming answer that creates no transcript and writes no site; and the
same id is refused for an account that does not hold the site.

I could not execute this file to demonstrate the failure: `startBuilder` binds a
socket and this environment denies it (`listen EPERM 0.0.0.0`), so the run
aborted in `beforeAll` with 11 tests skipped. The finding is established from the
code paths above, which are unambiguous.

### 2. AC-1387 — the modified claim (a reason a caller can branch on) has no assertion (BLOCKING)

`tests/reconciliation-cloudflare-site-store.workers.test.ts:209`
`test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for`

Item 1 sharpened AC-1387 specifically so the discriminant is machine-readable:
"the refusal carries the two cases as a discriminant a caller can branch on …
A caller may not be asked to read the message text to tell them apart", and its
Verification requires "each carries a reason value that a caller can compare
without parsing the message — the two reason values differ, and the one for a
never-registered account is the one that licenses registration."

The UAT asserts only:

```
expect((inactive as Error).message).not.toBe((unknown as Error).message)
// The two reasons are distinguishable from the message alone.
```

`UnknownTenantError.reason` (`tools/generate/src/store/d1r2-store.ts:104`) is
never read — by this UAT or any other in `tests/`. Delete the `reason` field and
this UAT stays green while the criterion is violated and item 2's bootstrap loses
the safety argument it was added for (`storeFor` branches on
`err.reason !== 'unknown'` to avoid reopening a deactivated account).

Remediation: assert `reason === 'unknown'` for the never-registered account and
`reason === 'inactive'` for the deactivated one, as typed values.

### 3. AC-965 — the deactivated-account case is not asserted under an AC-965 UAT

`tests/reconciliation-builder-workspace-origin.test.ts:768`
`test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration`
covers only `TENANT_ID: ''`. AC-965's second required case — a named account that
exists and is deactivated, reported distinguishably and still deactivated
afterwards — is asserted only inside `test_UAT_AC1449`. Nothing asserts AC-965's
own load-bearing comparison, that the two responses are distinguishable *from
each other* without reading a log.

This is the weaker of the four (the behaviour is covered somewhere), but AC-965
is one of the two criteria this bundle rewrote, and it is the one whose remaining
half is now its entire subject. `story-e674c60a` already carries
`uat_coverage: fail`.

Remediation: extend the AC-965 UAT with the deactivated case and an explicit
assertion that the two bodies differ.

### 4. AC-1453 — proven substantially by source inspection

`tests/reconciliation-builder-private-access-automation.test.ts:432`, lines
448–505. Genuine runtime evidence exists (the executable bit via `statSync`, and
the script spawned without `CLOUDFLARE_API_TOKEN` refusing and naming its
permissions), and reading `ACCESS.md` is legitimate — the policy record *is* the
artifact. But most of the criterion's distinct claims are regexes over the
script's own text:

- `/len\(accounts\) == 1/` (account disambiguation)
- `/app\.get\("domain"\)[\s\S]{0,40}== domain/` (locating by domain)
- `/"decision": "non_identity"/` and the `include` literal (Service Auth policy)
- `/if not payload\.get\("success"\)/` (refusal inside a 200 envelope)
- `not.toMatch(/write_text|writeFileSync|\.write\(/)` (persists no secret)

Each proves a string is present, not that the path executes. A rewrite using an
equivalent expression fails; a script containing the string on a dead branch
passes. The criterion itself licenses this ("Read its source and the policy
record"), and provisioning against the live API from a test would mint a real
credential — but that is not the only alternative: the script could take an API
base-URL override and be driven against a local stub, making the policy shape,
the account disambiguation and the success-envelope handling observations of
requests actually made.

Remediation (lower priority than #1 and #2): either drive `bin/access-token`
against a stub management API, or narrow AC-1453 to the claims that are
behaviourally observable and record the remainder as an explicitly stated
non-guarantee.

## Why this survived to here

`report-d029d7ac` (REPORT-3017, the quality report the last fix cycle passed on)
reads `Scoped quality: pass (0 tests, 0 failed)` with `suites: {}` and
`build.stdout: "No tsconfig.json — type-check skipped (JS-only project)"`. No
test executed in that run, so a UAT asserting the inverse of its own criterion
could not have been caught. The fix loop should not treat a green quality report
from this worktree as evidence that #1 has been resolved — the rewritten UAT
needs to be seen actually running.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Cloud Site Store (D1 + R2 adapter) | story-fde7370b | ✓ AC-1447, AC-1448 added; AC-1387 modified |
| 2. Builder Workspace Origin — deployment bootstrap | story-e674c60a | ✓ AC-1449 added; AC-965, AC-1402 modified |
| 3. Operator Access Gate — automation credential | story-182e8cb9 | ✓ AC-1450, AC-1451, AC-1452, AC-1453 added; AC-1376 modified |
| 4. Platform Deploy Configuration — invocation logs | story-d5167ced | ✓ AC-1454, AC-1455 added; AC-1341 modified |
| 5. AI Site Assistant — session resolution | story-a58a0974 | ✓ AC-1456 added; AC-1055 modified |

No plan item was dropped. All five produced criteria on the story the plan named.

## Judgment Calls

- **AC-1454/AC-1455 assert against a parsed TOML file, and that is not source
  inspection.** The configuration *is* the deliverable; there is no runtime
  behind it to observe short of a real deploy. AC-1454's negative control — the
  hoisted form parsed and shown to have really lost its route — is what makes the
  positive assertion non-vacuous. Accepted.
- **AC-1451's scan for a residual `CF_ACCESS_TOKEN` / `--token` is accepted.**
  "The name is gone rather than deprecated" is itself a source-level claim, and it
  sits on top of substantial runtime evidence (the CLI refusals, the spawned
  `bin/publish` refusals, and a tripwire `fetch` proving no request was sent).
  Supplementary, not load-bearing. Not a gap.
- **AC-1341's modified clause is accepted as covered.** Its added scope (the
  inheritable repeats must not join the counted binding set) is asserted by
  `test_UAT_AC1455`, and AC-1341's own text delegates it — "is pinned by the
  criterion that owns it". Deliberate delegation, not a hole.
- **AC-1376's modification is accepted as covered.** Its Verification explicitly
  defers the automation half to "the criterion covering what an automation caller
  sends", which is AC-1450, and AC-1450's UAT asserts the pair goes out and the
  assertion header never does, under any casing.
- **AC-1447/AC-1448 asserting object identity rather than timing is right, not a
  shortcut.** `assembleSite` builds a fresh object per call, so identity is the
  only observation at the store boundary that distinguishes a reuse from a
  re-validation; a timing assertion would be flaky by construction. The AC says
  so in as many words.
- **The version bump generating no story is correct.** A story there would
  document bookkeeping.

## Verdict

FAIL. The stories themselves are accurate and complete: a developer reading them
would have a correct picture of what the operator intended to build, including
both deliberate reversals and the two properties the operator explicitly declined
to change. Intent fidelity, behavioural coverage and plan-item accounting all
pass.

The evidence does not hold. Two active criteria this bundle modified are not
proven by their UATs:

1. **AC-1055** — `tests/reconciliation-assistant-conversation.test.ts:344` still
   asserts the pre-BUG-38 behaviour (`site-<held slug>` → 404, and a held-over id
   after a restart → 404, citing the deleted `minted` map). It contradicts the
   restated criterion, would fail against the landed code, and leaves the
   account-scoped refusal — the property the change strengthened — unasserted.
2. **AC-1387** — `tests/reconciliation-cloudflare-site-store.workers.test.ts:209`
   asserts only that the two refusal *messages* differ. `UnknownTenantError.reason`
   is asserted nowhere in `tests/`; deleting it leaves the UAT green.

Secondary: **AC-965**'s deactivated-account case has no assertion under an AC-965
UAT (it lives in `test_UAT_AC1449`), and **AC-1453** proves most of its claims by
regex over `bin/access-token`'s source rather than by observing it run.
