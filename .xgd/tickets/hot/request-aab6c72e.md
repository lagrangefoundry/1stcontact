---
uid: request-aab6c72e
id: REQ-290
type: request
title: 'Retire the file-backed authoring tier: storage/sites, bin/publish, 1c push'
created_by: EPIC-16
created_at: '2026-09-21T00:09:46.682813+00:00'
updated_at: '2026-09-21T20:27:37.762560+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
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
  - working_sha: dc076907ba7ee829d6d0b89817a56b62e4d9a214
    reconcile_sha: null
    main_sha: null
  version: 0.2.307
  story_points: 8
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
| **A corpus of hand-authored L1 for conformance tests** — `req107` AC-4 globs `storage/sites/**`, `req105` globs `storage/sites/*/draft/pages/*.json`, [[BUG-101]] reads `gigabytealchemy/draft/pages/home.json` | **Load-bearing, and wider than first written.** The implementing session's trace found **fourteen** suites reading the repo's own tree — and the move itself found **twenty-three**, because a suite that opens the tree through a `StoreContext` rather than a glob does not match a search for the path — `req107`, `req105`, `req103`, `req55`, `req109`, `req119`, `reconciliation-l1-control-and-texture`, `reconciliation-l1-one-colour-system`, `reconciliation-colour-census-and-retrofit`, `reconciliation-colour-retrofit-shade-model`, [[BUG-92]], [[BUG-101]], [[REQ-153]], [[REQ-175]]. (An earlier draft of this ticket said three. It was wrong.) 31 test files mention `storage/sites` in total, most against a temp `cwd`, so the move is verified by running the suite rather than by working down a list. |

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

So the flip is at the CLI's own entry point rather than at those three call
sites. `run()` in `cli/index.ts` constructs `GlobalOptions` with `sandbox: true`
unconditionally, and `ctxOf` — which all three call sites already go through —
is left resolving `opts.sandbox ? 'sandbox' : 'sites'` exactly as it did.

Pinning the three call sites individually was tried first and abandoned: it
leaves an open-ended tail, because every library entry point that takes a
`GlobalOptions` then has to be flagged by hand in any suite that also drives
the CLI, and a missed one silently writes the retired root. Pinning the one
place the CLI builds its options makes the library and the CLI agree by
construction, and it is the narrower diff. The library still addresses both
roots — that is what the relocated corpus needs.

`--sandbox` is still parsed and still means what it always meant, because a
flag that errors is a worse answer than one that has become a no-op. It comes
out of the help text, because documenting a choice that is not offered is how
the retired tier would keep being advertised.

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

## What landed

The behaviour above, as stated, with three things worth recording because the
work found them rather than the ticket predicting them.

**The corpus fixture gets a module, not twenty-three relative paths.**
`tests/fixtures/l1-corpus/corpus.ts` exports `L1_CORPUS_CWD` and
`L1_CORPUS_SITES` and is the single definition site for where the corpus lives.
While the corpus *was* the repository's own `storage/sites/`, every reader
deriving it from the repo root independently cost nothing — there was nothing to
agree about. As a fixture it does: a suite that missed a later move would not
fail loudly, it would find no documents and assert nothing. The README the
ticket asks for sits beside it.

**[[BUG-36]]'s credential assertion is repointed twice, not once.** It read the
retired push script for the claim that the operator commands name a credential
that exists. That artefact is gone, so the claim moved to where the refusal now
lives — and [[BUG-134]], which landed on `xgd-working` during this work, then
split that: the three-way a service-token pair requires is still `serviceToken`
in `cli/copy.ts`, but the variable names the refusal puts in its sentence became
a row of `ACCESS_NAMING` in `cli/push.ts`, because a copy has two ends and each
end has its own names. Both halves are still asserted. The claim is unchanged;
only the files that carry it moved.

**Two comments naming the retired command are rewritten in tests this ticket
does not otherwise touch** — [[BUG-134]]'s and `pushSite`'s own. The ticket's
promise is that a grep for the script or the verb returns only the tickets and
documents recording the retirement, and a UAT asserts exactly that over the
tracked tree; a surviving prose mention would make it false. They are
comment-only edits.

**The operator's checkout had untracked residue under `storage/sites/`** — a
`.DS_Store` and a `.journal.json` holding one already-applied copy edit from
August, which is why git left the directory behind after deleting everything it
tracked. The applied text is already in the corpus copy, so the record was
redundant; the directory is removed, because a surviving empty `storage/sites/`
is still a directory an agent finds and reads as a place sites go.

### Evidence

`tests/test_UAT_FC_REQ-290_file_backed_authoring_tier_retired.test.ts` — 13
cases across five groups: the tier is gone (trees, script, helper, and a scan of
the whole tracked tree for either name); the CLI always uses the sandbox root
(a site created with no flag, the redundant flag, the render path, the help
text, and `push` no longer resolving as a verb); the corpus moved intact (same
three sites, repo shape still loadable through `loadSite`, and the README saying
what it is); `1c reset` no longer advertises a source it does not have; and the
transport the retired verb used is still importable by the Worker.

The cases drive the shipped launcher (`tools/generate/bin/1c.mjs`) rather than
calling `cmdNew` directly, which matters here specifically: the root a command
resolves is decided in `run()`, so a test against the library would be asserting
the library's default — and the whole point is that the library still addresses
both roots while the CLI no longer chooses between them.