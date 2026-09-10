---
uid: bug-ee954e95
id: BUG-71
type: bug
title: '1c assets: framework bridges emit dangling sibling imports, so the builder
  never boots'
created_by: martin-github@westhead.me
created_at: '2026-09-10T17:54:23.271115+00:00'
updated_at: '2026-09-10T18:32:05.478526+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-19db7f70
  severity: high
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
each one, follow the relative imports that *survive transpilation* (so
type-only imports stay erased and no type-only module is emitted), resolve each
to its source file, emit it, and rewrite the specifier to the URL it was
emitted at. Recurse. A dependency is emitted at a URL derived from its
repo-relative source path, so two same-named modules in different packages
cannot collide.

**One URL per source file.** Resolution is keyed on the absolute source path,
seeded with the entries, so a module that is both an entry and someone's
dependency is emitted once and imported by its entry URL from both places.
Emitting it twice would give the page two module instances and two copies of
whatever state they hold.

**2. Refuse to ship a tree that cannot load.** After the tree is assembled and
**before it is swapped into place**, walk the import graph from
`/builder/main.js` and resolve every static specifier — relative and absolute
against the emitted tree, bare against the import map — plus every stylesheet
the import map declares. If anything dangles, `1c assets` fails with an
`ENVIRONMENT` `CommandError` naming each unresolved specifier and the file that
imports it.

Checking before the swap matters: a build that refuses leaves the previous
working `dist-assets` exactly where it was, which is the property the
staging-directory design already exists to provide.

The check is anchored at `/builder/main.js` because that is what the page
actually loads; a file no entry reaches cannot produce this failure and is not
the build's business.

**3. Say so in the report.** `1c assets` prints the size of the graph it
verified, so "the imports were checked" is something the operator can see
rather than something they have to trust.

Not fixed here, and deliberately: `1c builder` still does not build assets
before starting `wrangler dev`, and the CLI usage text still lists the `serve`
command REQ-177 deleted.

## Test plan

`tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts`, driving the real
`1c assets` entry point against this repository:

- the sibling module `l1/text.ts` is emitted, and no emitted framework file
  still carries an extensionless relative specifier;
- the builder's import graph resolves end to end from `/builder/main.js` —
  the regression this ticket exists for, asserted against the tree the build
  actually wrote;
- a source file that is both an entry and a dependency is emitted once, at its
  entry URL;
- the report states the graph size that was verified;
- a staged tree with a dangling specifier is refused, with the offending
  specifier and its importer named, and the previously built `dist-assets`
  left untouched.

Regression scope: the same file plus `tests/bug23-repro-local-assets.test.ts`
and the framework suites (`tests/framework-*.test.ts`).
