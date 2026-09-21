---
uid: request-aab6c72e
id: REQ-290
type: request
title: 'Retire the file-backed authoring tier: storage/sites, bin/publish, 1c push'
created_by: EPIC-16
created_at: '2026-09-21T00:09:46.682813+00:00'
updated_at: '2026-09-21T20:20:17.952661+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3b04e5eb
  commits:
  - working_sha: 766f26e10cfb3154e57a2cf0530dfcf440e0bfc0
    reconcile_sha: null
    main_sha: null
  - working_sha: d4f941881ed562be0f1c159d2fdb947a927e93ac
    reconcile_sha: null
    main_sha: null
  - working_sha: f843e29ee15c1d59f2801f33e36e42ff18ee5f18
    reconcile_sha: null
    main_sha: null
  version: 0.2.307
---

Parent: [[EPIC-16]]. Asked for by the operator on 2026-09-20: "the old dev path and
content are dead and I do not want to support them or allow you (or any other agent)
to be confused by them."

**Ordering, revised 2026-09-20 (was: blocked on [[REQ-289]]).** This ticket is **not**
blocked. The original dependency assumed `bin/publish` was a working content path
being removed ahead of its replacement. It is not: `bin/publish` can only read
`storage/sites/<slug>/`, i.e. the three dead trees, and has never been able to move
a builder-authored site — which is every real site. Deleting it removes no capability
that works for anything real; it removes a command that answers when an agent asks it
a question, which is the defect this ticket exists to fix.

The one genuine ordering constraint is narrower and is stated under *Behaviour*:
`push.ts`'s transport must survive, because [[REQ-289]] builds on it and the deployed
Worker already imports from it.

[[REQ-289]] remains the higher-priority ticket — the Lagrange Foundry draft still has
no backup — but that is a claim about what to do next, not about what this ticket may
land after.

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
| **A corpus of hand-authored L1 for conformance tests** — `req107` AC-4 globs `storage/sites/**`, `req105` globs `storage/sites/*/draft/pages/*.json`, [[BUG-101]] reads `gigabytealchemy/draft/pages/home.json` | **Load-bearing, and wider than first written.** The implementing session's trace found **fourteen** suites reading the repo's own tree — `req107`, `req105`, `req103`, `req55`, `req109`, `req119`, `reconciliation-l1-control-and-texture`, `reconciliation-l1-one-colour-system`, `reconciliation-colour-census-and-retrofit`, `reconciliation-colour-retrofit-shade-model`, [[BUG-92]], [[BUG-101]], [[REQ-153]], [[REQ-175]]. (An earlier draft of this ticket said three. It was wrong.) 31 test files mention `storage/sites` in total, most against a temp `cwd`, so the move is verified by running the suite rather than by working down a list. |

## Behaviour

**The L1 conformance corpus moves first, and the tests keep asserting what they
assert.** The hand-authored L1 documents move to `tests/fixtures/l1-corpus/`, and the
fourteen suites are repointed at it. They check the same documents for the same
properties afterwards — this is a move of where the corpus lives, not a reduction in
what is checked. The corpus has to move *before* the trees are deleted, or the build
breaks between the two commits.

**The fixture keeps repo shape**, i.e. `tests/fixtures/l1-corpus/storage/sites/<slug>/`.
Two suites (`req109`, [[REQ-153]]) call `loadSite({cwd: REPO, root: 'sites'}, …)`, so a
flattened fixture would force their assertions to be rewritten. With the shape
preserved every reader swaps one constant — `REPO` → `CORPUS_ROOT` — and not one
assertion changes. That is the whole reason to accept a `storage/sites/` path
surviving inside a fixture directory.

**The fixture directory carries a README** saying what the corpus is, that it is a
frozen test input and not an authoring tier, and that new sites are made in the
builder. The path `storage/sites/` still reads as an authoring tier to anything
grepping for it, and this ticket exists because a retired path that still answers
questions is worse than one that is gone. One file closes that.

**The three site trees are deleted** from `storage/sites/`, and `storage/sites/`
ceases to be an authoring tier.

**The `bin/publish` script and the `push` CLI verb are deleted — the module is not.**
`1c help` no longer lists `push`, and nothing in the repo refers the operator to
either. A grep for `bin/publish` outside of history returns only the tickets and
documents that record its retirement.

`tools/generate/src/cli/push.ts` **stays where it is.** It is a transport, not a
command: `pushSite(store, slug, opts)` accepts any `SiteStore` and is not tied to the
file tier — the CLI verb is merely what wires an fs-store over `storage/sites` into
it. Three facts make deleting it wrong rather than merely wasteful:

- `apps/control-app/src/router.ts:38` imports `payloadToWrite` and `SitePayload` from
  it to serve `/api/import`. **Deleting the module breaks the deployed Worker.**
- Four suites import `pushSite` / `readSitePayload` / `payloadToWrite`, including the
  UATs for [[BUG-36]] and [[BUG-84]].
- It carries the [[BUG-84]] mirrored-asset rights gate and the [[BUG-36]] Access
  service-token handling, both of which [[REQ-289]]'s `bin/copy-to-cloud` needs.

Its header is rewritten here so it stops describing `storage/sites/` as its source and
describes what it is — the site-payload transport. **Where it finally lives is
[[REQ-289]]'s call**, not this ticket's: that ticket is the one that knows what the
transport becomes, and a rename now would be a second churn for the same file.

**The file-backed store module stays.** `tools/generate/src/store/fs-store.ts` and
its neighbours are the reproduction tier's storage and the transport dozens of test
suites open against temp directories. Nothing here touches them.

**The CLI always uses the sandbox root.** Today three call sites resolve
`opts.sandbox ? 'sandbox' : 'sites'` — `cli/commands.ts:36`, `cli/shot.ts:94`,
`cli/serve.ts:56` — so **every** command without `--sandbox` writes `storage/sites/`,
not just `repro`. Pinning `1c repro` alone would leave `1c new foo` recreating
`storage/sites/foo`, and the tier would not have ceased to be an authoring tier at
all; it would just be empty until someone typed a command.

So the flip is at those three call sites: the CLI resolves `sandbox` unconditionally.
`--sandbox` becomes redundant and comes out of the help text.

**`'sites'` stays in the `Root` type.** It is how the relocated L1 corpus is read —
the suites construct a context directly (`loadSite({cwd: CORPUS_ROOT, root: 'sites'}, …)`)
rather than going through the CLI, so nothing about the fixture move depends on the
CLI default. This is deliberately the narrow change: the ~103 suites that open the
file store against a temp `cwd` are untouched, which is what the Boundaries section
below protects.

**The ancillary references go too.** `bin/access-token`'s next-step line and
`apps/control-app/ACCESS.md` both point the operator at `bin/publish`, and
`bin/author_xgd_sections.py` is a throwaway helper that edits
`storage/sites/xgd/draft/pages/home.json` and nothing else — it is deleted with the
tree it edits.

**`1c reset` stops advertising `storage/sites` as preserved.** Its `preserved` list
names `storage/sites` as the git-tracked source a re-seed comes from. That sentence
is no longer true, and the command's own reporting is where an operator reads what
survives a reset.

## Acceptance

[[DOC-41]] §1, §2, §3 and §5 describe `bin/publish` and `storage/sites/` as the local
content loop, and §1's table lists the file-backed store as a live tier. All four
are rewritten: the builder's store is where a site lives, [[REQ-289]]'s pair is how
content moves, and the file store is described as what it now is — the reproduction
substrate and a test transport.

## Boundaries

- No change to the reproduction or fidelity commands beyond the root they write to.
- No removal of the fs-store module, `storage/sandbox/` or `storage/references/`.
- `1c new` / `render` / `publish` / `checkout` / `revisions` / `verify` keep working
  against the sandbox root — they are how a reproduction gets a published channel to
  diff against. What ends is their use for authoring real sites.