---
uid: bug-3ade1af4
id: BUG-40
type: bug
title: 'Test suite: 23 failures — a half-finished install, a stale asset build, and
  ten UATs superseded by later work'
created_by: xgd
created_at: '2026-09-01T19:01:30.821719+00:00'
updated_at: '2026-09-01T19:28:24.364606+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-94979ef7
  severity: medium
  story_points: 5
  commits:
  - working_sha: e5d762332d1ae0c00f387b0822f19f41b8c934d1
    reconcile_sha: null
    main_sha: null
  version: 0.2.33
---

## Symptom

`pnpm test` (vitest, node + workers projects) fails. As found:

```
Test Files  30 failed | 220 passed | 4 skipped (254)
     Tests  27 failed | 1788 passed | 63 skipped (1878)
    Errors  30 errors
```

Three independent causes, two of them environmental and one a real backlog of
UATs that later intents superseded without updating.

## Cause 1 — a half-finished `pnpm install` (environment, no code change)

`node_modules/.pnpm/whatwg-encoding@3.1.1/node_modules/iconv-lite` pointed at
`iconv-lite@0.6.3/node_modules/iconv-lite`, which did not exist: an earlier
`pnpm install` aborted part-way through extracting it. jsdom loads
`whatwg-encoding`, so **17 test files failed at import** with
`Cannot find module 'iconv-lite'` and contributed 30 collection errors.

The same aborted install left `node_modules/.pnpm/lock.yaml` carrying an
`overrides: { iconv-lite: file:.local-vendor/iconv-lite }` entry that
`pnpm-lock.yaml` does not have. REQ-44's install preflight compares those two
files byte-for-byte, so every browser/imaging-gated `1c` verb (`values-diff`,
`gate`, `diff`, `capture`, `shot`, `crop`, `adopt-gaps`, `aligned-crops`)
refused with `ENVIRONMENT`, failing a further ~11 tests across
`reconciliation-size-aware-diff`, `reconciliation-cross-gate-reconciliation`,
`reconciliation-l1-fold`, `reconciliation-l1-navigation`,
`reconciliation-l1-interaction-and-motion`, `reconciliation-l1-pointer-accent`,
`reconciliation-colour-retrofit-shade-model` and
`reconciliation-platform-build-deploy-smoke`.

`pnpm install` cannot complete inside this session's sandbox: the published
`iconv-lite@0.6.3` tarball carries a `.idea/codeStyles/` directory, and creating
any `.idea` directory under the project is denied (`EPERM`). Repaired by hand —
the real 0.6.3 payload restored at its canonical path, and the installed-lockfile
snapshot brought back into agreement with `pnpm-lock.yaml`. **The operator should
still run `pnpm install` outside the sandbox** to leave the tree pnpm-managed.

## Cause 2 — a stale `1c assets` build (environment, plus one real defect)

`apps/control-app/dist-assets/` held only `builder/`; `webui/` and `framework/`
were absent, so the builder origin answered 404 for every
`/webui/<component>/…` and `/framework/*.js` route. That failed AC-961, AC-963,
AC-964, AC-977, `REQ-115` and both `REQ-117` criteria. Rebuilding with
`1c assets` fixed the isolated runs — but not the full one, which uncovered the
defect below.

**`1c assets` emptied the directory it was about to fill.** It `rm -rf`'d
`dist-assets/` and then spent the next several seconds copying into it, so
anything reading that directory meanwhile — a `wrangler dev` on the checkout, or
another suite in the same vitest run — got a 404 for every component; and a run
that failed part-way left the hole permanently. `reconciliation-platform-build-deploy-smoke`
drives `bin/build` (and therefore `1c assets`) against the real tree, so it and
`reconciliation-builder-workspace-origin` raced whenever they overlapped. The
build now assembles the new tree in `dist-assets.staging/` and swaps it into
place once it is whole: a reader sees the previous build or the new one and
never half of either, and a failed build leaves the working one standing.

## Cause 3 — eleven UATs left behind by later intents

Each is a criterion whose evidence stopped matching the system when a subsequent
ticket deliberately changed it. In every case the *implementation* is current and
the *test* is stale, so the test moves.

1. **AC-960** (`bug32-webui-scope-rebrand`) — the guard forbids the component
   scope literal in any tracked file but its single declaration. Three files
   added since now write it in prose about *non-webui* components in the same
   org scope: `apps/control-app/src/knowledge.ts` (an error message naming the
   describer's entry point) and the REQ-158 / REQ-159 workers-test headers. The
   guard is right — a rebrand would leave all three stale — so the prose is
   reworded to name the component without restating the scope.

2. **AC-1055** and **REQ-127's unissued-id criterion** — both assert that a
   *derivable* session id for an existing site is refused 404 because it was
   never issued. BUG-38 deliberately replaced the per-isolate issued-id registry
   with a store read (`slugForSession` → `hasDraft`), because in workerd
   `/api/ai/session` and `/api/ai/prompt` are not promised the same isolate and
   every turn was being told its conversation had closed. Under that design an id
   resolves exactly when it names a site this tenant holds — a stronger property
   than the one it replaced, since a per-process map could not check tenancy at
   all. Both criteria are re-pinned to that rule: an id naming no such site, an
   empty slug, a traversal string and a traversal that would reach a real site if
   it were ever joined onto a path are all refused identically and before
   anything is streamed; an id held over a restart now works, which is BUG-38's
   fix rather than a hole. Both tests are renamed to state the claim they make.

3. **AC-1123** (`reconciliation-copy-edit-parameter-sheet`) — asserts the run's
   non-string descriptors are exactly `{integer, enum, boolean}`, and separately
   that a painted panel renders no parameter sheet. The palette work added a
   `color` descriptor, which breaks both. The test's own comment says a hardcoded
   list "would strand the next field the derivation grows", which is what
   happened: the type assertion becomes containment over the shapes the criterion
   enumerates, and the panel assertion becomes "each form is rendered exactly
   when it has fields to put in it", read off the descriptors rather than off a
   remembered shape.

4. **AC-1331** (`bin/build`) — the `--skip-preflight` leg hides `webui-shell` and
   expects the build to complete. REQ-145 added the `1c assets` stage to
   `bin/build`, and that stage needs every component the preflight checks, so
   hiding one now fails the build after the skipped check rather than before it.
   The leg is split into the two claims that are actually true: with a component
   hidden the flag skips the *check* and the run reaches the assets stage before
   stopping there, bundling nothing; with a complete store the flag skips the
   check and the build completes. The incomplete leg runs first, deliberately, so
   the complete one leaves the shared asset tree whole.

5. **AC-1336 / AC-1337 / AC-1338** — pinned to a hardcoded nine-check list.
   REQ-147 added `control_app_challenges_unauthenticated` and
   `control_app_workers_dev_closed` to `tools/generate/bin/smoke.mjs`. The
   criteria are re-pinned to the checks the run actually reports: the site checks
   stay an ordered list because the skip clauses are ranges of it, the two Access
   checks are their own list because they skip for their own reason, and AC-1336
   supplies both control-app origins so "nothing skipped" remains a claim about a
   complete run. The suite's fetch double now keys on origin as well as path, so
   one `/` can answer differently for the public site and the control app.

6. **AC-1341** — asserts every named environment repeats every top-level var,
   with no exception. `ACCESS_DEV_OPEN`'s *absence* from `[env.production]` is a
   deliberate security control (REQ-145/REQ-147) that
   `test_UAT_FC_REQ-145_build_artifacts` separately pins, and REQ-144's own copy
   of this guard already carries the exception. It is added here with the same
   rationale. The criterion also asserts `BUILDER_ORIGIN` is present top-level
   and in production; REQ-145 replaced that proxy var with the `ASSETS` binding
   and the var is gone, so those two assertions are dropped — the synthetic
   fixture below them keeps the name, which is the shape the guard must keep
   catching.

7. **AC-1342** — reads `would push ANTHROPIC_API_KEY to $DEPLOY_WORKER_NAME` and
   its past-tense partner out of `bin/deploy.d/secrets/README.md`. REQ-149
   genericised the README to `NAME` and moved the two messages into the hook that
   emits them, `bin/deploy.d/secrets/10-anthropic-api-key`. The criterion reads
   them from the hook instead — stronger evidence, since that is the file that
   actually produces them — and the hook joins the list of files scanned for
   committed credential shapes.

8. **AC-964** — ends by requiring `GET /preview/alpha/draft/` to answer 200 for
   an admitted caller. The Worker reads its own D1, which the fixture gives a
   schema and no sites, so that only passed on a checkout where an earlier run
   had left a site behind in the local miniflare state; it failed on a clean one.
   Two lines earlier the same URL is already allowed to be 200 *or* 404. What the
   criterion is about is stated in its own comment — that it is the gate, not
   routing, standing between the caller and the route — so the pair becomes
   "admitted: not 401, and non-cacheable" against "unauthenticated: 401", which
   is the claim, and holds whatever the store happens to contain.

## Test plan

No new behaviour is introduced, so no new UAT: the deliverable is the existing
suite passing. The one production change — staging the asset build and swapping
it in — is covered by AC-1331's incomplete-store leg, which now asserts that a
build stopping in the assets stage bundles nothing, and by AC-961/963/964/977
passing in the same run as the smoke suite that rebuilds those assets, which is
the race the staging removes.

Regression scope is a full `vitest run` (node + workers projects).