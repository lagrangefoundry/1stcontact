---
uid: request-7ae3c2cc
id: REQ-148
type: request
title: 'Behavior modules render in workerd: contact-form precompiled'
created_by: xgd
created_at: '2026-08-15T20:34:22.601169+00:00'
updated_at: '2026-08-18T20:56:52.363854+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: low
  story_points: 8
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-141
  - REQ-142
  - REQ-143
  - REQ-144
  - REQ-145
  - REQ-147
---

# Behavior modules render in workerd: Astro leaves the render path

> **Status: settled (CHAT session).** The mechanism chosen is **not** precompilation —
> it is **removing Astro from the module render path entirely**. See §2.

`render.ts` imports `astro/container` lazily, so a pure-L1 site already renders in workerd
([[REQ-145]]). A site using a **behavior module** does not: the container API needs the
Vite/Astro transform to compile `.astro` sources, and workerd has no such transform.

## 1. Scope is one mechanism, two modules

Across all three sites in `storage/sites/`, exactly one behavior module is in use:
`contact-form`, at 4 instances. `carousel` exists in the catalog but appears in no site.
Both convert; the mechanism is shared, so nothing is per-module.

## 2. The mechanism: delete Astro, don't precompile it

The original framing was "precompile the `.astro` sources at build time and bundle the
compiled render function." Investigation showed that is the wrong shape:

- **Neither component uses any Astro runtime feature.** No islands, no hydration, no
  `Astro.request`/`Astro.url`, no layouts, no child slots. Each reads `Astro.props`, runs
  plain TypeScript, calls `renderL1Fragment` (pure TS, already worker-safe) and emits HTML
  with a couple of `set:html` fragments.
- Precompilation would still require Astro's **runtime** (`astro/runtime/server` plus a
  factory executor) inside the Worker — the exact surface REQ-145 found drags
  `markdown-remark`/Shiki/Prism and `virtual:` specifiers — and would add a build step plus
  a bundled artifact that can go stale.

So the components become **plain TypeScript functions** `(props) => string`. This *deletes*
rather than adds:

| Deleted | Why it can go |
|---|---|
| `astroContainer()` (`render/write.ts`) | nothing to create |
| `RenderSiteOptions.createContainer` | no seam to inject |
| the `needsAstro` branch in `renderSiteFiles` | there is one render path |
| `unresolvableModule` + the resolver injection | the registry is now plain TS, so `render.ts` imports `getModule` directly |
| `renderSiteFilesNode` | nothing left for it to inject |
| `modules/extract-style.ts` | CSS moves to a real `styles.css` per module |
| `astro-env.d.ts`, `astro-shims.d.ts` | no `.astro` to declare |
| `AstroComponentFactory` from the behavior contract | replaced by `BehaviorComponent` |

The one code path that remains is the one both node and workerd take, which is what makes
AC-1 true by construction rather than by comparison.

### Module CSS

The invariant-element CSS moves out of each `.astro` `<style>` block into a real
`styles.css` beside the component. `1c assets` still precompiles it into
`module-assets.ts` (unchanged mechanism, unchanged drift UAT) — it just reads `styles.css`
instead of scanning an Astro template, which is why the regex scanner in
`extract-style.ts` (and its two documented footguns) is deleted. `client.js` is untouched.

### Consequence: the registry becomes worker-safe

With both components plain TS, `modules/registry.ts` no longer drags a transform into the
graph, so `@1stcontact/framework/worker` can export `getModule` and `render.ts` can name it
statically. That is what actually delivers "a site using `contact-form` renders in workerd".

## 3. Constraint that must not be lost

[[DOC-25]] and `CLAUDE.md`: a conforming behavior module ships **zero CSS**, save a declared
set of invariant elements pinned by obligation rather than taste. The conversion moves the
existing invariant CSS verbatim; it adds nothing and entrenches nothing REQ-96 is removing.

## 4. Acceptance criteria

1. A site using `contact-form` renders in workerd, producing the **same bytes as the Node
   render** — structurally guaranteed, since both run the same function. (Parity is
   node-vs-worker, **not** parity with today's Astro output: whitespace between elements
   differs, which is semantically inert — whitespace-only text nodes are not flex items.)
2. No `.astro` file exists on the render path, and no Vite/Astro transform runs in the
   Worker. Astro appears nowhere in `packages/framework` or `tools/generate/src/render`.
3. `carousel` converts through the same mechanism with no per-module machinery.
4. The module conformance harness ([[DOC-20]]) passes; its 12 negative fixtures convert to
   plain TS and still discriminate.
5. Module CSS is byte-equivalent to today's (modulo the dedent from leaving the `<style>`
   block) — the conversion neither adds rules nor entrenches ones REQ-96 removes.

## 5. Supersession

- **AC-739** ("the render path is Astro-free *unless a page needs Astro*") is superseded by
  the stronger property: the render path is Astro-free, full stop. Its reconciliation UAT is
  rewritten to assert the stronger invariant rather than the lazy-container one.
- The `1c` bootstrap (`tools/generate/bin/1c.mjs`) boots a Vite server via Astro's
  `getViteConfig` solely because the render path imported `.astro`. Collapsing it to a plain
  Vite SSR server is **deliberately out of scope here** — filed separately.

## 6. Verification, and what the sandbox prevented

**Site output is unchanged.** Both real sites (`gigabytealchemy`, `xgd` — 4 live
`contact-form` instances between them) were rendered on a clean `xgd-working` checkout and
again on this branch:

| Artifact | Result |
|---|---|
| `home.html`, `whitepapers.html` | identical after normalising whitespace and Astro's inert `data-astro-cid-*` scope attribute |
| `theme.css` | identical ignoring whitespace (module CSS is dedented, leaving the `<style>` block) |
| `capabilities.js` | byte-identical |

The only non-whitespace difference anywhere is `action` → `action=""` on the one form whose
configured action is empty — the same thing in HTML.

**Test suites.** The full node project was run on this branch and on a clean checkout, and the
FAILURE SETS were diffed. Branch-only failures: exactly two (`AC-809`, `AC-810`), both caused
by a test helper that sliced a module's CSS block at `\n\n/* ` — correct while the chrome sat
indented inside an `.astro` `<style>`, wrong now that `styles.css` is dedented. Both fixed
(the helper now ends a block at the next *section* header); the branch's failure set is
otherwise identical to the clean tree's.

**What could NOT be verified in-session.** The session sandbox denies all socket binding
(`listen EPERM` on loopback and on UNIX sockets), so:

- the **workerd project is unrunnable** — Miniflare cannot listen, and the Node process
  aborts rather than failing a test. `test_UAT_FC_REQ-148_behavior_in_workerd.workers.test.ts`
  — the UAT for AC-1, the whole point of this ticket — has therefore **never executed**. It is
  written, and it is unverified.
- the **conformance harness (AC-4) cannot run**: every dimension serves a one-module page over
  loopback first. `req39`/`req40`/`req41`/`req42`/`req85-conformance` fail at the serve on a
  clean checkout too.
- 51 of the 57 node test files that fail on a clean checkout fail for this reason.

Filed against XGD's own tooling as a bug (body: `.xgd/tmp/REQ-148-sandbox-bug.md`; the report
could not be filed from the session either, because the write allowlist does not cover the
xgd repo's git object store). **Before this ticket is promoted, the workerd UAT and the
conformance dimensions must be run somewhere with sockets.**

## Origin

[[CHAT-25]]. The only remaining thing that needs Node in the render path.