---
uid: bug-3ade1af4
id: BUG-40
type: bug
title: 'Test suite: 23 failures — a half-finished install, a stale asset build, and
  ten UATs superseded by later work'
created_by: xgd
created_at: '2026-09-01T19:01:30.821719+00:00'
updated_at: '2026-09-01T19:15:17.338682+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-94979ef7
  severity: medium
  story_points: 5
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

## Cause 2 — a stale `1c assets` build (environment, no code change)

`apps/control-app/dist-assets/` held only `builder/`; `webui/` and `framework/`
were absent, so the builder origin answered 404 for every
`/webui/<component>/…` and `/framework/*.js` route. That failed AC-961, AC-963,
AC-964, AC-977, `REQ-115` and both `REQ-117` criteria. Repaired by running
`./bin/1c assets`. No source change.

Note for later: nothing in the suite builds these assets, so the failure recurs
on any fresh checkout. Out of scope here; worth a ticket of its own.

## Cause 3 — ten UATs left behind by later intents (the code change)

Each of these is a criterion whose evidence stopped matching the system when a
subsequent ticket deliberately changed it. In every case the *implementation* is
current and the *test* is stale, so the test moves.

1. **AC-960** (`bug32-webui-scope-rebrand`) — the guard forbids the component
   scope literal in any tracked file but its single declaration. Three files
   added since now write it in prose about *non-webui* components in the same
   org scope: `apps/control-app/src/knowledge.ts` (an error message naming the
   describer's entry point) and the REQ-158 / REQ-159 workers-test headers. The
   guard is right — a rebrand would leave all three stale — so the prose is
   reworded to name the component without restating the scope.

2. **AC-1055** and **`test_UAT_FC_REQ-127_an_unissued_session_id_is_refused_rather_than_opened`**
   — both assert that a *derivable* session id for an existing site is refused
   404 because it was never issued. BUG-38 deliberately replaced the per-isolate
   issued-id registry with a store read (`slugForSession` → `hasDraft`), because
   in workerd `/api/ai/session` and `/api/ai/prompt` are not promised the same
   isolate and every turn was being told its conversation was closed. Under that
   design an id resolves exactly when it names a site this tenant holds. The two
   criteria are updated to that rule: a derivable id for a site the tenant holds
   opens the conversation; an id naming no such site, an empty slug, and a
   traversal string are all refused identically.

3. **AC-1123** (`reconciliation-copy-edit-parameter-sheet`) — asserts the run's
   non-string descriptors are exactly `{integer, enum, boolean}`. The shade /
   palette work added a `color` descriptor. The test's own comment says a
   hardcoded list "would strand the next field the derivation grows", which is
   what happened; the assertion becomes a containment check over the shapes the
   criterion enumerates, so a newly derived shape no longer strands it.

4. **AC-1331** (`bin/build`) — the `--skip-preflight` leg hides
   `webui-shell` and expects the build to complete. REQ-145 added the
   `1c assets` stage to `bin/build`, and that stage needs every component the
   preflight checks, so hiding one now fails the build after the skipped check
   rather than before it. The leg is split into the two claims that are actually
   true: with a complete store the flag skips the check and the build still
   completes; with a component hidden the flag skips the *check* and the run
   reaches the assets stage before failing there.

5. **AC-1336 / AC-1337 / AC-1338** — pinned to a hardcoded nine-check list.
   REQ-147 added `control_app_challenges_unauthenticated` and
   `control_app_workers_dev_closed` to `tools/generate/bin/smoke.mjs`. The
   criteria are re-pinned to the checks the run actually reports, with the two
   Access checks given their inputs so "nothing skipped" stays a real claim.

6. **AC-1341** — asserts every named environment repeats every top-level var,
   with no exception. `ACCESS_DEV_OPEN`'s *absence* from `[env.production]` is a
   deliberate security control (REQ-145/REQ-147) that
   `test_UAT_FC_REQ-145_build_artifacts` separately pins, and REQ-144's own copy
   of this guard already carries the exception. It is added here with the same
   rationale. The criterion also asserts `BUILDER_ORIGIN` is present top-level
   and in production; REQ-145 replaced that proxy var with the `ASSETS` binding
   and the var is gone, so those two assertions are dropped (the synthetic
   fixture below them keeps using the name, which is fine — it is a string
   literal, not the live file).

7. **AC-1342** — reads `would push ANTHROPIC_API_KEY to $DEPLOY_WORKER_NAME` and
   its past-tense partner out of `bin/deploy.d/secrets/README.md`. REQ-149
   genericised the README to `NAME` and moved the two messages into the hook that
   emits them, `bin/deploy.d/secrets/10-anthropic-api-key`. The criterion reads
   them from the hook instead — which is stronger evidence, since that is the
   file that actually produces them — and the hook joins the list of files
   scanned for committed credential shapes.

## Test plan

No new behaviour, so no new UAT: the deliverable is the existing suite passing.
Regression scope is a full `vitest run` (node + workers projects), plus targeted
re-runs of every file named above.
