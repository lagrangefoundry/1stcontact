---
uid: acceptance_criterion-8b22495a
id: AC-2464
type: acceptance_criterion
title: The asset build emits each framework bridge's full import graph and refuses
  to ship a tree with an unresolvable import or stylesheet, naming every dangling
  edge and keeping the previous served tree
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T14:25:10.635371+00:00'
updated_at: '2026-11-08T14:25:10.635371+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The asset build (`1c assets`) emits everything each framework bridge needs to
load in a browser. It refuses to ship a served tree that cannot load.

- **The graph, not a list.** Each declared bridge keeps its stable public URL,
  `/framework/<name>.js`. Every module a bridge imports at run time is also
  emitted, recursively, under a URL named for its repo-relative source path. Its
  import specifier is rewritten to that URL. No emitted framework file carries a
  relative or extensionless specifier. Every absolute one ends in `.js`.
- **Only what the browser fetches.** Imports that exist only for types are not
  emitted. An import quoted inside a comment is not followed and not rewritten.
- **One URL per source file.** A module that is both an entry and another
  module's dependency is emitted once and imported by its entry URL everywhere.
  So the emitted framework tree is closed: every `/framework/` URL it imports is
  a file it contains, and no file appears twice.
- **An unresolvable source import fails the build where it is found.** A bridge
  import that resolves to no file, or to a file outside the repository, fails
  the build as an environment error. The error names the importing file and the
  specifier.
- **Verified before it is served.** Before the newly built tree replaces the
  served one, the build walks every static import reachable from the builder's
  entry module, `/builder/main.js`. Relative and absolute imports resolve
  against the built tree, and bare imports against the import map. The walk
  also checks every stylesheet the import map declares. If anything dangles,
  the build fails as an environment error. The error names **every** dangling
  import or stylesheet, each with the file that imports it (or the import map),
  and says that the previous `dist-assets` is untouched. The previously served
  tree is then left exactly as it was.
- **The report shows the proof.** A successful build reports the number of
  modules and stylesheets it verified, and states that every import resolves.

## Verification

Run `1c assets` and inspect the tree it wrote. The sibling module that broke the
builder (`l1/text`) is emitted, and `site-schema-edit.js` imports it at its
emitted URL. No framework file carries a relative or extensionless specifier.
An independent walk from `/builder/main.js` finds no dangling import over a
graph of more than 50 modules, and every declared stylesheet exists. The
framework tree is closed, with each file appearing once. The printed report
gives the module and stylesheet counts the independent walk found.

Then, against a staged tree, check three dangling edges: a missing absolute
import, an unmapped bare import and a missing stylesheet. The tree also holds a
comment that quotes an import. Assert that the refusal is an environment error,
that it names all three edges with their importers, that it omits the commented
specifier, and that it says the previous `dist-assets` is untouched. Assert that
a whole staged tree passes and reports its module and stylesheet counts.
