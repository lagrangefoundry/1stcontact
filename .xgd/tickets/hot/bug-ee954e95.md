---
uid: bug-ee954e95
id: BUG-71
type: bug
title: '1c assets: framework bridges emit dangling sibling imports, so the builder
  never boots'
created_by: martin-github@westhead.me
created_at: '2026-09-10T17:54:23.271115+00:00'
updated_at: '2026-09-10T19:50:07.267600+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-19db7f70
  severity: high
  commits:
  - working_sha: 15273eae89d9951de9f06d6e9ea6ea54aea1d113
    reconcile_sha: null
    main_sha: null
  - working_sha: 40398672584952b140c541290a0a18900fcab076
    reconcile_sha: null
    main_sha: null
  version: 0.2.149
  story_points: 3
---

## Symptom

`1c builder` starts, the chrome document arrives 200, `GET /api/sites` answers
200 — and the page stays blank until the boot guard writes *"The builder did not
start. What failed: could not load http://127.0.0.1:8788/builder/main.js"*.

Running `1c assets` does not fix it. Running it twice does not fix it. The
builder is unusable and the remediation the boot guard offers is the one thing
that cannot help.

## Root cause

`main.js` is fine. A module script's `error` event fires on the **top-level**
script element even when the failure is a nested import, so the guard names the
entry point rather than the file that 404ed. The file that actually 404s is
reached from it:

`dist-assets/framework/site-schema-edit.js` line 1 reads

    import { l1TextRuns } from './text';

which the browser resolves to `/framework/text`. Nothing is emitted at that
path — `dist-assets/framework/` holds exactly the six files
`FRAMEWORK_SOURCES` names — so the request 404s and the whole module graph
fails to load.

Two separate defects in `tools/generate/src/cli/assets.ts` produce that line:

1. **The framework emit does not follow imports.** `FRAMEWORK_SOURCES`
   (`assets.ts:68`) is a hand-maintained list of six entry points, and
   `transpileForBrowser` (`assets.ts:114`) type-strips one file at a time. A
   module a bridge imports is never emitted, and its specifier is never
   rewritten. The file header asserts this is safe — *"these files' only runtime
   import is each other"* — and that assertion is now false.
2. **A relative specifier is not a browser URL.** TypeScript writes `./text`;
   a browser needs `./text.js`. Even had `text.ts` been emitted, the import
   would still have 404ed.

Introduced by `df9862ce77` *"feat(l1): one string of page copy can vary within
itself"* (2026-09-10), which added `packages/site-schema/src/l1/text.ts` and
imported it from `l1/edit.ts`. It is the first **value** import between these
sources; every earlier sibling import is `import type`, which the transpiler
erases before it can become a fetch. The hole has always been there — nothing
had stepped in it.

The build reported success throughout, and the only place the defect was
visible was a blank page in a browser.

## Fix

**1. Emit the graph, not a list.** The six declared entries keep their stable
public URLs (`/framework/<name>.js`) — the builder imports those by name. From
each one, follow the relative imports that *survive transpilation*, resolve each
to its source file, emit it, and rewrite the specifier to the URL it was emitted
at. Recurse.

Following the **transpiled output** rather than the source is what keeps
type-only modules out of the browser: `transpileModule` erases `import type` and
elides any import whose bindings never reach the emitted JS, so what survives is
exactly what the browser will fetch. Reading the source instead would ship
`./palette` and `./types`, which exist only at compile time.

A dependency is emitted under its **repo-relative source path**, so two packages
that each hold a `text.ts` cannot collide, and the URL in a stack trace names
the file to open. An import that resolves to no file, or to a file outside the
repository, fails the build where it is found rather than being emitted as a
specifier nothing can serve.

**One URL per source file.** Resolution is keyed on the absolute source path and
seeded with the entries, so a module that is both an entry and someone's
dependency is emitted once and imported by its entry URL everywhere. Emitting it
twice would give the page two instances of one module — two copies of whatever
state it holds. The emitted tree is therefore *closed*: every `/framework/` URL
it imports is a file it contains, and no file is served under a second name.

**A comment that quotes an import is prose, not an edge.** Specifiers are found
with the compiler's own scanner rather than by pattern-matching text. This is not
a stylistic preference — a regex first version rewrote a doc comment that quoted
an import as an example, followed the specifier out of it, and emitted a module
nothing imports, which imported `zod`, which cannot be served, which failed the
build over a line of prose.

**2. Refuse to ship a tree that cannot load.** After the tree is assembled and
**before it is swapped into place**, walk the import graph from
`/builder/main.js` and resolve every static specifier — relative and absolute
against the emitted tree, bare against the import map — plus every stylesheet the
import map declares. If anything dangles, `1c assets` fails with an
`ENVIRONMENT` error that names **every** unresolved specifier, not just the
first, each with the file that imports it — the half the boot guard could not
give — and tells the operator their previous build is untouched.

Checking before the swap is what makes strictness safe: a refusal leaves the
previous working `dist-assets` exactly where it was, which is the property the
staging-directory design already exists to provide. Checking after would mean
every refusal also broke the thing it was protecting.

The check is anchored at `/builder/main.js` because that is what the page
actually loads; a file no entry reaches cannot produce this failure and is not
the build's business.

**3. Say so in the report.** `1c assets` prints the size of the graph it
verified — modules and stylesheets — so "the imports were checked" is something
the operator can see rather than something they have to trust.

Not fixed here, and deliberately: `1c builder` still does not build assets
before starting `wrangler dev`, and the CLI usage text still lists the `serve`
command REQ-177 deleted.

## Test plan

`tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts`, driving `1c assets`
itself once and asserting against the tree it wrote — the bug was invisible to
every artifact short of the emitted bytes, so a test that asked the build what it
did rather than reading what it wrote would have passed throughout. The graph
walk in the test resolves specifiers independently of the one in the build, so
the evidence is about the tree rather than about the checker agreeing with
itself.

- the sibling module `l1/text.ts` is emitted, `site-schema-edit.js` imports it at
  that URL, and no emitted framework file still carries a relative or
  extensionless specifier;
- the builder's import graph resolves end to end from `/builder/main.js`, over a
  graph large enough to prove the walk did not stop at the entry — the regression
  this ticket exists for;
- the emitted framework tree is closed and each file appears once;
- the report states the graph size, and it is the size the independent walk
  found;
- a staged tree with dangling specifiers is refused as `ENVIRONMENT` with all of
  them named — a missing absolute import, an unmapped bare specifier and a
  missing stylesheet — each against its importer, with a specifier that appears
  only inside a comment correctly ignored, and the refusal telling the operator
  the previous `dist-assets` is untouched;
- a whole staged tree passes and reports its size.

Regression scope: the same file, `tests/bug23-repro-local-assets.test.ts`, the
framework suites (`tests/framework-*.test.ts`),
`tests/req177-discontinue-raw-server.test.ts` and
`tests/test_UAT_FC_BUG-50_builder_env_files.test.ts`; plus the full `node`
vitest project, whose 11 failing files are unchanged by this work (verified
against the same tree with the fix reverted).