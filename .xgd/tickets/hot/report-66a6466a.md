---
uid: report-66a6466a
id: REPORT-1698
type: report
title: 'Intent Review: bug-5cabb340'
created_by: xgd
created_at: '2026-08-08T02:06:30.404101+00:00'
updated_at: '2026-08-08T02:06:30.404101+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: intent_review
  subject_uid: bug-5cabb340
---

# Intent Review — bug-5cabb340

**Status**: PASS

## Summary

BUG-32 asked for three things: move the webui npm scope to `@lagrangefoundry` in lockstep with
upstream `lagrange-framework` BUG-7; collapse that scope to exactly one definition site; and replace
the silent-green failure mode (a half-completed rename being indistinguishable from "not installed
yet") with positive, unconditional evidence. All three are delivered, and I verified each by
execution and by reading source on both sides of every seam — not by reading the quality reports.

Two deviations from the intent plan are present, both recorded in the intent ticket and both
improvements rather than drift. `index.html` was **deleted** rather than renamed (a committed copy
of `chromeHtml()`'s output is itself a second definition site — the exact drift the ticket exists to
close); nothing references it and no `index.html` is tracked anywhere in the repository now. And the
plan's Phase 0 — an operator `bin/install --env <worktree parent>` with no repo artifact — was
replaced by in-code main-checkout anchoring in `webui.ts`. That second deviation was net-new,
load-bearing production code; the Sprint 1 review correctly failed the sprint for shipping it with
no acceptance criterion and no test, and Sprint 2 closed the gap with AC-1030 and five UATs. I
re-verified the closure independently.

## Dimension 1: Goal Achievement — PASS

**The rename is complete and the old name is deleted, not deprecated.**
`tools/generate/src/cli/webui.ts:103` declares `WEBUI_SCOPE = '@lagrangefoundry'`. Live probe of the
shipped resolver in this worktree returns `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/{webui-shell,webui-split,webui-fields}`
— the real out-of-repo store, under the new scope.

**The superseded literal survives nowhere.** Independent of the suite, `git grep -I -F -e @gendevlabs`
over the working tree and again over `HEAD` (excluding the declared `.xgd/**` exclusion) returns
**zero hits**. `git ls-files | grep index.html` returns nothing.

**One definition site.** `builder.ts:70,73` compose the import-map keys from the imported
`WEBUI_SCOPE`; `vitest.config.mts:47,52` compose the alias `find` values from it;
`MissingWebuiComponentError` (`webui.ts:135`) composes its message from it. The only second writing
is the declared, bounded exception — `apps/control-app/src/builder/{app.js,editor.js}`, served
verbatim to the browser and therefore unable to read a build-time value — and that exception is
pinned, not trusted (below).

**The silent green is closed.** `WEBUI_INSTALLED` is now an *outcome* of AC-961's check
(`reconciliation-builder-workspace-origin.test.ts:448`, `expect(WEBUI_INSTALLED).toBe(true)`), never
a gate for it. There is no `skipIf` anywhere in `tests/bug32-webui-scope-rebrand.test.ts`, and
AC-961/AC-963 no longer take the `unverified(...)`-and-return path they took before. A one-sided
rename now fails loudly and names the component it could not account for.

The intent author would recognise this as fulfilling the request.

## Dimension 2: Evidence of Correctness — PASS

Suites executed here (not read from a report): `tests/bug32-webui-scope-rebrand.test.ts`,
`tests/reconciliation-component-resolution-anchor.test.ts`,
`tests/reconciliation-builder-workspace-origin.test.ts` — all pass, with no skip in the
identity/wiring set.

**AC-961 — could a broken implementation pass?** No. The test reads each *resolved* package's own
`package.json.name` and requires it to equal `${WEBUI_SCOPE}/${name}`
(`reconciliation-builder-workspace-origin.test.ts:411-424`), per component so a failure names which.
This is not a hypothetical guard: the real shared store still holds a complete same-named
`@gendevlabs/webui-*` set alongside the new one (verified by `ls
/Users/martin/lagrangefoundry/node_modules/`), so a leftover copy would resolve and mount perfectly
and only this assertion rejects it. It additionally asserts the resolved dir is outside the repo
(`:429`), closing the vendor/stub escape.

**AC-963 — could it pass on a stale artifact?** No. The import map is asserted on the document
fetched from the live origin (`:452`, `get('/')`), and the previously-committed `index.html` copy is
gone, so there is nothing to compare against itself. Keys are checked for scope membership, absence
of the superseded scope, non-emptiness, and completeness against `WEBUI_PACKAGES` (`:485-499`).

**AC-960 — could a forgotten surface slip through?** The guard enumerates `git ls-files` rather than
a hardcoded source-root list (`bug32-webui-scope-rebrand.test.ts:97-111`), and asserts the
enumeration reaches beyond `tools/`, `apps/`, `packages/` so it cannot silently degrade to the
three-root scan that missed `index.html`. It handles the sparse checkout correctly — working tree for
materialised files, `HEAD` for the ~4-in-5 that are not (`:135-146`) — which is a real silent-green
one level down that was actually anticipated. The guard does not write its own forbidden literal
(`['@gendev','labs'].join('')`, `:41`), so it cannot need a self-exclusion. And `webui.ts` is
asserted to hold exactly one quoted scope literal (`:216-221`), which is what forbids a `LEGACY_SCOPE`
export or a fallback path.

**The browser↔import-map coupling** fails only at runtime in a browser — no build, type check or
other test observes it. It is pinned by `test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document`
(`:224-252`): every bare `@…/webui-*` specifier in the browser source must be under the scope in use
*and* must be a key of the freshly generated map, with a non-vacuity assertion that the specifier set
is non-empty and a completeness assertion that every consumed package has a key.

**AC-1030 (anchor) — evidence validity.** `plantResolver()` copies the shipped `webui.ts`
byte-for-byte and asserts the copy is identical (`reconciliation-component-resolution-anchor.test.ts:100-107`),
then runs it in a real `node` child process, so the logic under test is production's and cannot drift.
Fixtures stand in only for checkout *shapes* and for distinguishably tagged stores; the fifth UAT
asserts the equality against the real, unsubstituted installation. Every shape UAT plants decoy stores
at each rival location and asserts they exist, so landing on the right one is a decision rather than
the only option.

**No internal mocking.** Nothing is `vi.mock`'d, faked or vendored. `vitest.config.mts`'s
`resolve.alias` is a route correction, not a stand-in: every target is derived from
`webuiPackageDir`/`webuiExports` — the same single resolution point production uses — and AC-961
independently asserts the consumed directory lies outside the repository.

**AC-shape retrospective.** Behavioural, not config-reading: every claim is proven by executing the
condition (real HTTP against a live origin, a real `node` child, the live generator). Invariant
coverage across exit paths: AC-977's rewrite reads the routing table out of the origin's own source
and asserts coverage in **both** directions — declared-but-unprobed and probed-but-undeclared
(`reconciliation-builder-workspace-origin.test.ts:373-382`) — with success *and* ≥400 shapes probed,
which is what closes the hole that let `json()` ship cacheable. Boundary coverage: the anchor's
boundary is the `.git` shape enumeration, and all four shapes plus the terminate-at-root case are
exercised.

*Minor residual, non-blocking:* `walkOrigin()`'s `catch` branch (`webui.ts:88-94`, the
bundler-inlined `import.meta` fallback to `process.cwd()`) carries no direct assertion. It is
exercised implicitly whenever Vite bundles the config, and a wrong answer there fails loudly with
`MissingWebuiComponentError` rather than reaching a silent green — so it does not reopen the failure
mode this intent closes.

## Dimension 3: Delivery Accuracy — PASS

- Intent says the scope becomes `@lagrangefoundry`. Code at `tools/generate/src/cli/webui.ts:103`
  declares exactly that, once. **Match.**
- Intent says `chromeHtml()`'s two hardcoded `@gendevlabs/${name}` sites route through `WEBUI_SCOPE`.
  Code at `tools/generate/src/cli/builder.ts:70` and `:73` composes both from the imported constant
  (`:12`). **Match.**
- Intent says the browser sources are renamed in place as a bounded exception. `app.js:1-2` and
  `editor.js:1` import under the new scope; the exception is bounded to `apps/control-app/src/builder`
  and pinned by UAT. **Match.**
- Intent says `index.html` is *deleted*, not updated, because a committed copy of the generator's
  output is a second definition site. The file is gone; `git ls-files` tracks no `index.html`; every
  remaining `index.html` reference in the tree (`serve.ts:73,78`, `render.ts:275`, `builder.ts:185`)
  is an unrelated served-artifact path. **Match** — and a deliberate deviation from the plan's
  "rename the six surfaces", in the right direction.
- Intent says no fallback, no dual-scope auto-detection, old scope deleted not deprecated. There is
  no legacy branch anywhere, and the one-quoted-literal assertion structurally forbids adding one.
  **Match.**
- Intent says test literals compose from `WEBUI_SCOPE`. `req115-builder-shell.test.ts:111,115` and
  the origin suite now do. **Match.**
- Intent plan says the worktree resolution problem is Phase 0 operator work with no repo artifact.
  Code at `webui.ts:70-101` solves it in production instead (`mainCheckout()`/`walkOrigin()`).
  **Deviation** — net-new production behaviour beyond the planned delta. It is not drift in outcome
  (it makes the evidence checkout-independent, which is what the ticket needed), and the process
  handled it correctly: Sprint 1's review failed on exactly this and Sprint 2 delivered AC-1030 plus
  `tests/reconciliation-component-resolution-anchor.test.ts` (5 UATs). **Gap closed.**
- No semantic shift: `webuiPackageDir()`, `webuiExports()`, `WEBUI_PACKAGES`,
  `MissingWebuiComponentError` and `chromeHtml()` keep their responsibilities and exported shapes.
  No new capability bucket, no parallel resolution path, no new module.

## Dimension 4: Quality — PASS (with one flagged, pre-existing caveat)

**Build:** `tsc -p <pkg>/tsconfig.json --noEmit` clean across all five packages (`tools/generate`,
`packages/framework`, `packages/site-schema`, `apps/control-app`, `apps/public-site`).

**Full suite:** 1232 passed / 6 failed / 67 skipped (185 files). The six failures are
`reconciliation-copy-edit-gesture-modal` ×5 and
`req115-builder-composition::open_in_new_tab_matches_the_iframe_exactly` ×1 — exactly the set the
intent ticket declares as pre-existing.

**I did not take that claim on trust, and it needed testing.** The upstream rename shipped *changed
component source*, not just a renamed directory: `diff -r` shows
`@gendevlabs/webui-{shell,split,fields}/src` and `@lagrangefoundry/…/src` differ in `index.js`,
`controls.js`, `tokens.js`, `geometry.js` and the stylesheets (both are version `0.0.0`, so version
numbers distinguish nothing). A DOM change in `webui-fields` is a very plausible cause of
"expected length 1 but got 2", and these suites only began *running* in a worktree because of this
branch's anchor change. So I re-ran both suites through a throwaway config that aliased the same
specifiers to the still-installed `@gendevlabs` copies: **the identical six failures reproduce**
(6 failed / 8 passed). They are genuinely pre-existing, belong to other stories, and are not
attributable to this change. The probe config was deleted; the working tree is clean.

**Caveat, pre-existing and outside this intent's scope:** the story quality gate
(`report-3d1c4abe`) ran 29 filtered tests with 1276 deselected, `coverage: null`,
`lines_total: 0`, lint reporting success in 0.00014s and build in 0.0s with no eslint config at the
repo root. That gate is therefore not what establishes this ticket's correctness — direct execution
is, and it holds. Flagging for operator visibility rather than as a BUG-32 defect.

**Nit:** doubled word — "The form is a shared shared `webui-fields` component" at
`tests/reconciliation-copy-edit-gesture-modal.test.ts:19`. Comment only.

**Architecture:** sound. The one-definition rule is enforced structurally rather than by convention;
the bounded exception is declared and pinned by a coupling test; the guard is self-consistent (it
does not write the literal it forbids). Debt is not added — it is removed (`index.html`, the
duplicated cache-control strings).

## Dimension 5: Integration Boundary Verification — PASS

**Boundary 1 — `WEBUI_SCOPE` producer → three consumers.** Producer `webui.ts:103` (string).
Consumers: `builder.ts:70,73` composing import-map *keys*; `vitest.config.mts:47,52` composing alias
`find` *specifiers*; the browser sources' literal *import specifiers*. All three must agree on the
identical string shape `@scope/name[/subpath]`. Read on both sides: the key/specifier construction is
character-identical (`${WEBUI_SCOPE}/${name}` and `${WEBUI_SCOPE}/${name}/${sub}` with the same
`replace(/^\.\//, '')` normalisation), and the browser-source literal is held to the generated key set
by assertion. No transformation is missing on any side.

**Boundary 2 — `webuiPackageDir()` producer → four consumers.** The anchored `require`
(`webui.ts:100`) now decides which store every consumer reads: `builder.ts:363` (`serveTree` of the
component tree), `webuiExports()` (`webui.ts:154`), `vitest.config.mts:33` (alias targets), and
`tests/support/webui-installed.ts:24`. All four go through the single resolution point rather than a
second guess at the store's location, so they cannot diverge. Verified live: the shipped resolver
returns the parent-of-main-checkout store from *this* linked worktree, and `git rev-parse
--git-common-dir` confirms the anchor computes `/Users/martin/lagrangefoundry/1stcontact` from the
`.git` pointer file — the directory the store was installed to sit beside. AC-1030's fifth UAT
asserts this equality against an independent upward lookup.

**Boundary 3 — `NO_STORE` producer → two senders.** Producer `serve.ts:110` exports the single
directive string. Consumers: `builder.ts:180` (`res.setHeader` before any routing) and
`serve.ts:130` (`sendFile`'s `writeHead`). Read both sides: Node merges `setHeader` values into
`writeHead`, with `writeHead`'s own fields winning — and no `writeHead` call remaining in
`builder.ts` names `cache-control`, so the directive reaches every response including the
hand-written document, every JSON envelope and every 400/403/404/500. `sendFile`'s explicit
`cache-control` is the same constant, so the two cannot drift into near-misses. AC-977's structural
test proves this at runtime over every route the origin declares, and it passes.

## Conclusion

The implementation satisfactorily meets the intent goals. The scope moved in lockstep, collapsed to
one definition site with the old name deleted outright, and the silent-green failure mode is closed
by positive unconditional evidence whose load-bearing assertions I confirmed are non-vacuous against
the real store. The one significant deviation from the plan — solving worktree resolution in
production code rather than by operator install — was caught by the Sprint 1 review and fully closed
in Sprint 2 with AC-1030 and five checkout-independent UATs. Six suite failures remain on the branch;
I verified by execution against the superseded scope's still-installed copies that they are
pre-existing and unrelated, and they belong to other stories. No corrective plan items.
