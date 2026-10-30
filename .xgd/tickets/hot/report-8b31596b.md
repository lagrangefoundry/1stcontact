---
uid: report-8b31596b
id: REPORT-5427
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T02:50:42.666620+00:00'
updated_at: '2026-09-29T02:50:42.666620+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Summary

Incoming `61a0becc61` ("feat(identity): the invite provisions the account, login
binds it [FREE-CODED]", REQ-167 / DOC-40, authored 2026-08-31) is a **duplicate of
REQ-167 work already integrated into HEAD** as `5f65959253` — same author, same
author date, same subject, different sha. Two conflicts, both resolved to HEAD.

`5f65959253` carries nine of the incoming commit's twelve files. The three it does
NOT carry are exactly the three this pick still had something to say about:
`package.json`, `tests/reconciliation-builder-workspace-origin.test.ts` (the two
conflicts), and `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` (new,
unconflicted). Of the nine already integrated, eight are byte-identical between
`61a0becc61` and HEAD; the ninth, `access.ts`, auto-merged without conflict.

Both conflicted files resolved byte-identical to HEAD, so the staged diff is only
the one new test file.

## Files resolved

- `package.json` — **UU**, config scalar (2g) + enrichment timestamp rule. Version
  field only: kept HEAD `0.2.40` over incoming `0.2.27`. Enrichment marked ours
  intent-unknown ("Merge branch 'free-BUG-43' into xgd-working") and directs
  "take the more recent commit by timestamp": ours `80c9342ac1` is
  2026-09-01 15:35:56 -0700, incoming is 2026-08-31 18:30:41 -0700 — **ours is
  later, so ours wins**, which also happens to preserve the monotonic release
  counter (taking incoming would move the branch back thirteen patches).
  Flagged for post-merge review per the enrichment rule; this is a deviation from
  2g's bare "incoming wins for config scalars", and the two preceding picks in
  this resync run made the same call for the same field.
- `tests/reconciliation-builder-workspace-origin.test.ts` — **UU**, test code (2c/2f)
  resolved to HEAD under the **BUG-1301 PRECEDENCE** exception. Detail below.

Both resolved blobs are identical to HEAD's:

| path | HEAD blob | index blob |
|---|---|---|
| `package.json` | `e9d83d294d` | `e9d83d294d` |
| `tests/reconciliation-builder-workspace-origin.test.ts` | `de25f361f4` | `de25f361f4` |

**No test function was deleted on either side of this conflict.**

## Incoming changes preserved

`git diff 61a0becc61 HEAD` over the commit's nine non-conflicted paths reports
changes in exactly **one** file, so every other incoming change is present verbatim
in the resolved tree:

- `apps/control-app/src/identity.ts` — identical. `provisionInvite`, `admit`,
  `newId`, `normaliseEmail`, `IdentityNotConfiguredError`, `STARTER_HEADING`,
  `DENIED_MESSAGE`, `IdentityEnv`, `UserRow`, `EntitlementRow`, `DenialReason`,
  `Admission`, `Invite`, `InviteResult` all present.
- `db/migrations/0004_identity.sql` — identical, and registered in
  `tests/support/d1-site-factory.ts`'s explicit `MIGRATIONS` list.
- `apps/control-app/src/index.ts` — identical. Admission still runs where the
  Access gate runs (`index.ts:119-125`): `guardAccess`, then
  `admit(env, gate.email)`, then the one-message `denied()` 403 with the structured
  `admission_denied` warn. No later commit in HEAD touches `identity.ts` or
  `0004_identity.sql` at all.
- `tests/support/local-d1.ts` (incl. `seedIdentity`), `tests/support/d1-site-factory.ts`,
  `tests/req115-builder-shell.test.ts`, `tests/test_UAT_FC_REQ-147_access_gate.test.ts`,
  `tools/generate/src/cli/scaffold.ts` — all identical.
- `apps/control-app/src/access.ts` — auto-merged, no conflict. HEAD is incoming plus
  AC-1380's `JWKS_REFRESH_FLOOR_MS` (a one-minute floor on the cache-bypassing JWKS
  refresh, because the `kid` that triggers it is read before any signature is
  checked). Incoming's own change — `guardAccess` reporting the verified identity
  rather than a yes/no, so the email is not recovered by verifying twice — is
  intact, as are `certsUrl` (line 130) and `resetJwksCache` (line 187).
  Service-token / `common_name` semantics are unchanged between the two sides.

### BUG-1301 precedence — one dropped hunk, and why the absence is expected

File: `tests/reconciliation-builder-workspace-origin.test.ts`.
HEAD-side commit that already removed the target: **`7a17bd8cd9`** ("Workflow
fix_uat_validation completed: done", `xgd-kind: structural_validation`, authored and
committed 2026-09-10, an ancestor of HEAD — and an ancestor of `a6d1b6b7bd`, the
last commit to touch this file in HEAD).

Both conflict hunks land inside `describe('story-e674c60a control-app front')`.
Incoming wanted, in its `beforeAll`: `applyLocalD1Schema(REPO)`,
`seedIdentity(REPO, 'uat@westhead.me')`, and
`worker = await unstable_dev('apps/control-app/src/index.ts', { … })`, plus
`seedIdentity` added to the `./support/local-d1` import.

`7a17bd8cd9` **deleted that entire block** — including the `local-d1` import and the
`let cwd`, `let builder: BuilderHandle` and `let worker: UnstableDevWorker`
declarations — and replaced the `unstable_dev` child process with the Worker's own
`fetch` driven in-process against an env whose store bindings are `Proxy` objects
that throw on first touch. Its own diff states the reason: `unstable_dev` "spawns a
`wrangler dev` child, which makes the gate assertions hostage to a subprocess that
cannot start in a sandboxed checkout." The same commit added
`tests/reconciliation-workspace-admission.workers.test.ts` to carry the store-backed
half of AC-964's sweep.

Why this is a legitimate refactor and not a resolution shortcut:

- It is an explicit, self-documenting `structural_validation` commit that moved
  coverage rather than dropping it — the replacement file was added in the same
  commit, and AC-964 is still asserted, in two places.
- It predates and is an ancestor of HEAD's latest touch of this file, so the
  decision was already integrated, not made by me here.
- Taking incoming is not merely worse, it is **not compilable**: incoming's
  `worker = …` and `builder.url` reference three identifiers `7a17bd8cd9` removed
  from that scope. There is nothing left in this describe for a local D1 to serve.

The enrichment's timestamp rule agrees once the right clock is used. On this
rewritten branch **author** dates are non-monotonic — incoming's author date is 37
minutes *later* than `a6d1b6b7bd`'s (18:30:41 vs 17:53:13 on 2026-08-31), which
would mislead — but committer dates give the topological reality: `a6d1b6b7bd` was
committed 2026-09-11 03:00:07, incoming 2026-08-31 18:30:41. **Ours is later.**
Flagged for post-merge review per the enrichment rule.

Collateral checks: `unstable_dev` is still imported and still live in HEAD
(line 919, AC-965's unconfigured-Worker case), so resolving to HEAD leaves no unused
import; and `seedIdentity` keeps a live consumer in HEAD
(`tests/req115-builder-shell.test.ts`), so dropping this import site does not orphan
the helper.

## What this pick delivers

`tests/test_UAT_FC_REQ-167_identity.workers.test.ts` — 539 lines, new, applied
clean, staged unmodified. HEAD has no copy and never had one: its own REQ-167 UAT,
`tests/reconciliation-identity-invite-and-admission.workers.test.ts`, was generated
independently by `9539491cd2` and is not a rename of this file.

Checked statically against HEAD, since it cannot be executed here (below):

- Every import resolves: `worker` + `type Env` from `index`; `certsUrl`,
  `resetJwksCache` from `access`; `admit`, `DENIED_MESSAGE`,
  `IdentityNotConfiguredError`, `newId`, `provisionInvite`, `STARTER_HEADING`,
  `type IdentityEnv` from `identity`; `applySchema` from `./support/d1-site-factory`;
  `../db/migrations/0004_identity.sql?raw`.
- **Arity matches.** The file calls `await applySchema()` with no arguments, which is
  HEAD's signature (`d1-site-factory.ts:54`, `applySchema(): Promise<void>`, reading
  `storeEnv()` itself), and that helper's `MIGRATIONS` list already includes
  `0004_identity.sql`.
- Matched by `vitest.workers.config.mts`'s `include: ['tests/**/*.workers.test.ts']`.
- It mints a single `kid` (`req167-key`) and stubs the JWKS that publishes it, so
  HEAD's new `JWKS_REFRESH_FLOOR_MS` is never exercised.

## Verification

- `git ls-files -u` **empty**; no UU/AA/DU/UD lines remain; no conflict markers
  anywhere under `apps/`, `tools/`, `tests/`, `db/` or in `package.json`.
- Both resolved files **byte-identical to HEAD** — `git diff --cached HEAD --` over
  the two paths is empty and the blob ids match (table above).
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` **could NOT be executed**:
  `vitest run --project=workers` dies before any test runs with
  `Error: listen EPERM: operation not permitted 127.0.0.1` (plus an earlier EPERM
  writing wrangler's debug log); this sandbox denies both. No tsconfig in the repo
  covers `tests/` — the six are `tsconfig.base.json`, `tools/generate`,
  `packages/site-schema`, `packages/framework`, `apps/public-site`,
  `apps/control-app`, all `src`-scoped — so this file is verified by neither
  execution nor typecheck, only by the static checks above.
- Not run, deliberately: the node-pool suite for the resolved test file. The
  resolved blob *is* HEAD's blob, so a run would be evidence about HEAD rather than
  about this resolution; the one attempt was also SIGKILLed, since the file's
  `startBuilder` legs spawn `wrangler dev` — the same subprocess `7a17bd8cd9` moved
  AC-964 off for exactly this reason.
- No source file changed, so a `tsc -p apps/control-app/tsconfig.json --noEmit` run
  would be testing HEAD unchanged; skipped for the same reason.

## Observation for the orchestrator — pre-existing, out of this pick's remit

HEAD's `test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token` looks
latently broken on any machine where the webui components are installed, and it is
worth recording because REQ-167 is what made it so.

Its `workerEnv()` sets `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` and `ACCESS_DEV_OPEN: ''`,
so `isUnconfiguredLocalDev` (`index.ts:64-68`) is false and `admit(env, gate.email)`
runs — against `DB: new Proxy({}, { get: throws })`. The throw is caught by
`index.ts`'s outer handler and returned as **503**, where the test expects 200. It is
invisible here only because `WEBUI_INSTALLED` is false on this machine and the test
returns early via `unverified(...)`.

Two things follow, and neither changes the resolution:

1. Taking incoming's hunk would **not** have fixed this. Incoming seeded a local D1
   for an `unstable_dev` child; HEAD drives `controlWorker.fetch` in-process with a
   deliberately unreachable `DB`, and `seedIdentity(REPO, …)` writes to miniflare's
   on-disk database, which the in-process env never consults.
2. The fix belongs in HEAD's own `workerEnv()` (an admitted identity, or a `DB` that
   answers the one `admit` query rather than throwing) — a change beyond this
   conflict. Not made.

## Staging

Three paths staged; `CHERRY_PICK_HEAD` (`61a0becc6122ee619483…`) left intact.
`git status --porcelain` is a single line:
`A  tests/test_UAT_FC_REQ-167_identity.workers.test.ts`.

Both conflicted files resolved to byte-identical-to-HEAD, so the staged diff is the
one new test file (+539) — finalize should expect a small commit rather than an empty
one. No `git cherry-pick --continue` / `--skip` / `--quit` / `--abort` was run.
