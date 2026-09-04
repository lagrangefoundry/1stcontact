---
uid: report-2e9e415e
id: REPORT-3520
type: report
title: 'Code Review: bundle-203b1dc2'
created_by: xgd
created_at: '2026-09-04T06:41:07.895672+00:00'
updated_at: '2026-09-04T06:41:07.895672+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-203b1dc2
  anchor_uid: bundle-203b1dc2
---

# Code Review

**Result**: FAIL

## Summary

The bundle (REQ-158/159/161/163/164/165/167 — system + project knowledge bases, the material pipeline, the Library surface, the projected reference, and the identity gate) is well structured, consistently wired, and integrated at every entry point I checked: new routes are in `router.ts`, new bindings are in both halves of `wrangler.toml`, the new CLI behaviour is in the `1c kb` dispatch, the migration is registered, and the builder panels are mounted in `app.js`. Two defects block it.

The first is a security control that does not hold: the new SSRF guard's IPv4-mapped-IPv6 branch is written against a host string the production entry point can never produce, so `https://[::ffff:169.254.169.254]/` passes the guard — and the UAT that claims to cover it asserts the unreachable form, so it stays green. The second is a newly added UAT that throws before its first assertion because it calls the shared knowledge library with a stale option name. Both are small, local fixes.

## Quality Gates

| Gate | Recorded | Verified here |
|------|----------|---------------|
| Lint | success, 0 errors, 0 warnings | not re-run |
| Build | success | "No tsconfig.json — type-check skipped (JS-only project)" — the gate is vacuous; only `tsconfig.base.json` exists at the root |
| Tests | pass | **the recorded report ran 0 tests** (`suites: {}`, lint in 0.0001s) — see below |
| Coverage | not reported | not reported |

The most recent quality report (`report-cb0ca28e`, commit `0ffc4cc33e`) is `Scoped quality: pass (0 tests, 0 failed)` with an empty `suites` map. The regression anchor it names as subject (`report-3d9ba0b3`) carries only `{"status": "pending"}`. **No recorded quality report in this reconcile actually executed the bundle's tests**, so the passing gate is not evidence. I ran the changed test set myself:

- **node project, 24 changed files** — 118 passed, 15 skipped, and failures as detailed below.
- **workers project, 15 changed files** — **could not be executed**: the sandbox denies `listen` on 127.0.0.1, so miniflare/workerd cannot boot (`Error: listen EPERM`). Every `*.workers.test.ts` in this bundle is therefore **unverified by this review**, including the whole of REQ-158's Worker-side bundle, REQ-159's project KB, REQ-161's material surface and REQ-163's ingestion. Stated as a gap, not as a pass.
- `tests/req115-builder-shell.test.ts` and `tests/reconciliation-builder-workspace-origin.test.ts` fail with the same `listen EPERM` — environmental, not a code defect.
- The `WEBUI_INSTALLED` gates did **not** silently empty the REQ-161 evidence: `test_UAT_FC_REQ-161_library_tab` and `_upload_overlay` ran 13 tests, all passing.

## External Interface Accessibility

New entry points wired in: **yes**, no gaps found.

| Surface | Evidence |
|---|---|
| 7 new material routes | `apps/control-app/src/router.ts:673-830` (`/api/material`, `/item`, `/file`, `/description`, `POST /api/material`, `/api/material/fetch`) |
| New error → status mapping | `apps/control-app/src/router.ts:1058-1075` (`MaterialRejectedError`, `FetchRefusedError`, `NotRepublishableError`, `NotMaterialError`) |
| `AI` binding | `apps/control-app/wrangler.toml` `[ai]` **and** `[env.production.ai]` — both halves, as REQ-154 requires |
| Material bucket separation (AC-1489) | `bucket_name = "1stcontact-material"` declared in the default half and again under `[env.production]`, distinct from the `SITES` bucket in both |
| Identity gate | `apps/control-app/src/index.ts:120-125` — `admit` runs after `guardAccess`, before `route`; `guardAccess`'s new `AccessOutcome` shape has exactly one caller and it was updated |
| `0004_identity.sql` | `wrangler.toml:128,243` `migrations_dir`; `tests/support/d1-site-factory.ts:51` |
| `writeProjections` | `tools/generate/src/cli/index.ts` — called in both `kb export` and `kb build`, before the export, with the ordering rationale stated |
| `CATALOG`/`catalog`/`getModuleMeta` | `packages/framework/src/modules/index.ts:2-5` |
| Library + upload overlay | `apps/control-app/src/builder/app.js` — `createLibraryPanel` appended to `LIBRARY_TAB`, `createUploadOverlay` watching both chat and library elements |
| `cmdAssets` async migration | `tools/generate/bin/1c.mjs:80` and `tools/generate/src/cli/index.ts:616` both awaited — the missing-await failure mode is called out in the comment and both call sites are fixed |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `apps/control-app/src/fetch-guard.ts:126` | IPv4-mapped IPv6 branch is unreachable in production and leaves loopback/link-local reachable — see Critical 1 | Critical |
| `tests/test_UAT_FC_REQ-165_projected_reference.test.ts:236` | UAT throws before asserting — see Critical 2 | Critical |
| `ac1489.json` (repo root) | A 27-line dump of acceptance criterion `acceptance_criterion-f119999e` committed to the repository root. Not source, not a fixture, not referenced by anything; it is scratch output from a reconcile step (commit `cdccbd2da7`). Violates Coding Standards §3/§4 (no stray files in production directories, delete orphans) and will land on `main`. | Warning |
| `apps/control-app/src/router.ts:1062` | `err.message.includes('the limit is') ? 413 : 400` selects the HTTP status by sniffing a substring of prose written in `tooBig()` (`fetch-guard.ts:238`). Rewording that client-facing sentence — the exact kind of edit its own comment invites — silently downgrades every over-size rejection from 413 to 400, with no test to catch it. The distinction should be carried on the error (a `kind` / `tooLarge` field on `MaterialRejectedError`), not re-derived from its message. | Warning |
| `tools/generate/src/cli/kb.ts:826` | `lib.search(query, { source: indexSource, ... })` — the shared library takes `indexes`, so `buildKb` → `buildMap` → `find` throws `KnowledgeConfigError` and **`1c kb build` cannot complete** in this environment. **Pre-existing, not introduced**: `main:tools/generate/src/cli/kb.ts:584` is byte-identical, and main's own `tests/reconciliation-system-knowledge-base.test.ts:359` carries the same stale form. Flagged for visibility because it disables the command REQ-158/164/165 are built around; **out of scope for this fix loop**. | Warning (pre-existing) |

On structure and consistency more broadly: the new modules follow the surrounding idiom closely — errors as named classes carrying the field the router needs, seams injected through a `deps` object for offline UATs, per-request memoisation matching the existing `openStore` pattern, generated-shim construction identical across all four shims in `assets.ts`. No debug code, no commented-out blocks, no TODO stubs, no `_v2` files, no duplicated helpers, and constants are named (`VISION_MODEL`, `VISION_MAX_BYTES`, `MAX_REDIRECTS`, `MAX_MATERIAL_BYTES`) rather than inlined. The two `console.log` calls in `index.ts` are CLI output, not debug residue. The comment density is far above normal but matches this repository's established house style.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists (all three queries returned 0 items). Sections omitted per the review contract.

## Smoke Test

| Entry point | Result |
|---|---|
| `./bin/1c kb status` | **Pass.** Emits the new two-producer line: `corpus: 4 exported + 3 projected (of 4 ticket(s) carrying doc_kind: system_kb)`, then `index: built`, `chunks: built`, `map: built`. No stack trace, correct new `doc_kind` vocabulary. |
| `./bin/1c kb build` | **Not invoked** — it writes to `kb/` and this is a read-only review. Its failure is nonetheless established from a test stack trace (`buildKb` → `buildMap` → `find` → `kb.ts:825`), and is pre-existing on main. |
| `./bin/1c kb export` | Not invoked — writes to `kb/`. |
| Worker routes | Not invocable — the workers runtime cannot start in this sandbox (see Quality Gates). |

## Issues Found

**Critical (must fix)**:

1. **`apps/control-app/src/fetch-guard.ts:126` — the SSRF guard does not refuse IPv4-mapped IPv6 addresses, and its UAT asserts a form that can never occur.**

   `assertFetchable` (line 76) passes `url.hostname` to `isPrivateHost`. The WHATWG URL parser serialises IPv6 hosts in compressed hex and *never* in the dotted-quad form, so `new URL('https://[::ffff:127.0.0.1]/').hostname` is `[::ffff:7f00:1]`. Line 126 strips the `::ffff:` prefix and recurses with `7f00:1`, which contains a colon, matches neither `^f[cd]` nor `^fe[89ab]`, and falls through to `return false`. The address is allowed.

   Verified executably against a verbatim transcription of the function:

   ```
   https://[::ffff:127.0.0.1]/         hostname=[::ffff:7f00:1]     isPrivateHost=false => ALLOWED
   https://[::ffff:169.254.169.254]/   hostname=[::ffff:a9fe:a9fe]  isPrivateHost=false => ALLOWED
   https://[0:0:0:0:0:ffff:a9fe:a9fe]/ hostname=[::ffff:a9fe:a9fe]  isPrivateHost=false => ALLOWED
   https://127.0.0.1/                  hostname=127.0.0.1           isPrivateHost=true  => REFUSED
   https://169.254.169.254/            hostname=169.254.169.254     isPrivateHost=true  => REFUSED
   ```

   `169.254.169.254` is the cloud metadata service the module's own header names as the reason link-local is on the list at all. The hole is reachable from `POST /api/material/fetch` (`router.ts:817`) and applies identically to every redirect hop, since `guardedFetch` re-validates through the same `assertFetchable` (line 210) — so a public address may 302 to `https://[::ffff:169.254.169.254]/` and be followed, which defeats the module's stated rule 3 as well as rule 2.

   The reason this shipped green is an evidence defect: `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts:263` asserts `isPrivateHost('::ffff:127.0.0.1')` — the **dotted literal**, which the production path cannot produce. The test exercises a string no caller supplies, so it proves nothing about the guard as wired.

2. **`tests/test_UAT_FC_REQ-165_projected_reference.test.ts:236` — a newly added UAT throws before its first assertion.**

   ```
   KnowledgeConfigError: knowledge base 'system' reads from source 'shipped',
   which this host has no index for (available: none)
     at indexFor (@lagrangefoundry/knowledge/src/index_store.js:118)
     at scopedIndexes (@lagrangefoundry/knowledge/src/search.js:127)
     at Module.searchChunks (@lagrangefoundry/knowledge/src/search.js:317)
     at tests/test_UAT_FC_REQ-165_projected_reference.test.ts:235
   ```

   `searchChunks` destructures `indexes` (`search.js:299`), not `source`. The call passes the shorthand `source,` at line 236, so `indexes` is `undefined`, `asMap(undefined)` is empty, and `indexFor` throws. `test_UAT_FC_REQ-165_asking_what_a_component_supports_returns_the_projection` is the end-to-end evidence for REQ-165's headline claim — that the projection reaches the corpus and answers a question asked in ordinary words — and it currently proves nothing.

   The correct form is already in this tree, in the reconcile-generated twin of the same scenario: `tests/reconciliation-projected-reference.test.ts:357` uses `indexes: { [SHIPPED_SOURCE]: chunks }` and passes.

**Warnings (should fix)**:

- `ac1489.json` at the repository root is committed scratch output and should be deleted.
- `router.ts:1062` selects 413 vs 400 by substring-matching error prose; carry the distinction on `MaterialRejectedError` instead.
- The recorded quality gate ran 0 tests and skipped type-checking; it should not be read as evidence for this bundle.
- Every `*.workers.test.ts` in this bundle is unverified — the workers runtime cannot boot in this sandbox.
- **Pre-existing, do not fix in this loop**: `tools/generate/src/cli/kb.ts:826`, `tests/test_UAT_FC_REQ-123_system_kb.test.ts:156,178` and `tests/reconciliation-system-knowledge-base.test.ts:337,359` all pass `source:` where the shared library now takes `indexes:`. This breaks `1c kb build` and 4 tests, and is identical on `main` (`main:tools/generate/src/cli/kb.ts:584`). It is shared-dependency drift in `@lagrangefoundry/knowledge`, not a regression from this bundle, and warrants its own ticket.

## Fix-It Prompt

Two changes. Do not touch anything else; in particular **do not** attempt to fix `tools/generate/src/cli/kb.ts:826` or the two pre-existing test files — that drift is identical on `main` and belongs to a separate ticket.

**Fix 1 — close the IPv4-mapped IPv6 hole in `apps/control-app/src/fetch-guard.ts`.**

The production entry point only ever sees WHATWG-normalised hostnames, in which an IPv4-mapped address appears as compressed hex (`::ffff:7f00:1`), never dotted. Line 126 handles only the dotted form. Replace it with a branch that decodes the hex form back to dotted quad before recursing, keeping the existing dotted-form handling so both spellings are covered:

```ts
// `::ffff:127.0.0.1` and `::ffff:7f00:1` are the same address. The URL parser
// emits the SECOND form and never the first, so decoding the hex pair is what
// actually guards the mapped range — a dotted-form check alone never fires.
if (host.startsWith('::ffff:')) {
  const mapped = host.slice('::ffff:'.length)
  const hex = mapped.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex) {
    const [hi, lo] = [parseInt(hex[1], 16), parseInt(hex[2], 16)]
    return isPrivateHost(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`)
  }
  return isPrivateHost(mapped)
}
```

Then extend the UAT at `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts:248-272` so it exercises the form the production path actually produces. Add to the refused list the *normalised* spellings — `'::ffff:7f00:1'` and `'::ffff:a9fe:a9fe'` — and, more importantly, add an assertion through the real entry point rather than the helper, because that is the level at which the current test is blind:

```ts
// THROUGH `assertFetchable`, not `isPrivateHost`. The URL parser rewrites an
// IPv4-mapped host into hex, so a test that only calls the predicate with a
// dotted literal exercises a string no caller can produce.
for (const raw of [
  'https://[::ffff:127.0.0.1]/',
  'https://[::ffff:169.254.169.254]/',
  'https://[0:0:0:0:0:ffff:a9fe:a9fe]/',
]) {
  expect(() => assertFetchable(raw), raw).toThrow(FetchRefusedError)
}
```

**Fix 2 — `tests/test_UAT_FC_REQ-165_projected_reference.test.ts:235-243`.**

`searchChunks` takes `indexes` (a map of source name → index source), not `source`. Import `SHIPPED_SOURCE` from `../tools/generate/src/cli/kb` alongside the existing imports and change the option, mirroring `tests/reconciliation-projected-reference.test.ts:357` exactly:

```ts
const hits = await lib.searchChunks('does the carousel component support autoplay', {
  indexes: { [SHIPPED_SOURCE]: source },
  store: binding.store,
  ...
})
```

Leave `buildChunkIndex` at line 227 alone — it takes the index source positionally and is already correct.

**Verify with** (both must be green, and the second must report 13 passed rather than any skip):

```
npm test -- tests/test_UAT_FC_REQ-165_projected_reference.test.ts tests/test_UAT_FC_REQ-163_material_pipeline.test.ts
```

**Also delete** the stray `ac1489.json` from the repository root — it is a committed dump of `acceptance_criterion-f119999e`, referenced by nothing.
