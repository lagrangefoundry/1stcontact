---
uid: request-aab6c72e
id: REQ-290
type: request
title: 'Retire the file-backed authoring tier: storage/sites, bin/publish, 1c push'
created_by: EPIC-16
created_at: '2026-09-21T00:09:46.682813+00:00'
updated_at: '2026-09-21T00:09:46.682813+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
---

Parent: [[EPIC-16]]. Asked for by the operator on 2026-09-20: "the old dev path and
content are dead and I do not want to support them or allow you (or any other agent)
to be confused by them."

Depends on [[REQ-289]], which supplies the replacement content path. Nothing here
should land until a builder-authored site can be copied to the cloud without
`bin/publish`.

## Why

`storage/sites/` is the file-backed authoring tier: author a site as JSON on disk,
render it, freeze revisions into `revisions/`, copy it up with `bin/publish`. The
builder replaced all of it. The three trees still in the repo — `1stcontact`,
`gigabytealchemy`, `xgd` — are the residue, and they are actively misleading: this
session's own investigation looked there for the Lagrange Foundry site, found
nothing, and reported that the site did not exist. It exists; it is in the
builder's store, where every real site now lives.

A retired path that still works is worse than one that is gone, because it answers
when an agent asks it a question.

## What is dead, and what only looks it

`storage/sites/` has three uses. **Only the first is dead**, and deleting the tree
without separating them breaks the build:

| Use | Status |
|---|---|
| **Authoring a real site on disk** — `1c new` / `publish` / `checkout` against the `sites` root, then `bin/publish` up | Dead. Superseded by the builder. |
| **The reproduction substrate** — `1c repro --ref <bundle>` imports a capture as a site, then `render` / `shot` / `diff` / `values-diff` / `gate` run the fidelity loop over it. `storage/sandbox/` holds seven such trees | **Load-bearing.** It is the framework-growth loop, and [[DOC-41]] §1 already names it as the thing that resembles a raw server and is not. |
| **A corpus of hand-authored L1 for conformance tests** — `req107` AC-4 globs `storage/sites/**`, `req105` globs `storage/sites/*/draft/pages/*.json`, [[BUG-101]] reads `gigabytealchemy/draft/pages/home.json` | **Load-bearing, narrowly.** Three tests read the repo's own tree; every other suite builds its own under a temp `cwd`. |

## Behaviour

**The L1 conformance corpus moves first, and the tests keep asserting what they
assert.** The hand-authored L1 documents move to a fixtures directory under
`tests/`, and the three suites are repointed at it. They check the same documents
for the same properties afterwards — this is a move of where the corpus lives, not
a reduction in what is checked. The corpus has to move *before* the trees are
deleted, or the build breaks between the two commits.

**The three site trees are deleted** from `storage/sites/`, and `storage/sites/`
ceases to be an authoring tier.

**`bin/publish` and `1c push` are deleted.** `1c help` no longer lists `push`, and
nothing in the repo refers the operator to either. A grep for `bin/publish` outside
of history returns only the tickets and documents that record its retirement.

**The file-backed store module stays.** `tools/generate/src/store/fs-store.ts` and
its neighbours are the reproduction tier's storage and the transport dozens of test
suites open against temp directories. Nothing here touches them.

**The reproduction loop is pinned to the sandbox root.** `1c repro` and the
fidelity commands write to `storage/sandbox/` and can no longer write to
`storage/sites/`. Today `repro` defaults to the `sites` root and `--sandbox`
switches it; after this the sandbox is where reproduction lives, so a retired tier
cannot be repopulated by the one loop that still writes sites.

**`1c reset` stops advertising `storage/sites` as preserved.** Its `preserved` list
names `storage/sites` as the git-tracked source a re-seed comes from. That sentence
is no longer true, and the command's own reporting is where an operator reads what
survives a reset.

## Acceptance

[[DOC-41]] §2 and §3 describe `bin/publish` and `storage/sites/` as the local
content loop, and §1's table lists the file-backed store as a live tier. All three
are rewritten: the builder's store is where a site lives, [[REQ-289]]'s pair is how
content moves, and the file store is described as what it now is — the reproduction
substrate and a test transport.

## Boundaries

- No change to the reproduction or fidelity commands beyond the root they write to.
- No removal of the fs-store module, `storage/sandbox/` or `storage/references/`.
- `1c new` / `render` / `publish` / `checkout` / `revisions` / `verify` keep working
  against the sandbox root — they are how a reproduction gets a published channel to
  diff against. What ends is their use for authoring real sites.
