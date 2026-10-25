---
uid: comment-d63ad55a
id: COMMENT-3404
type: comment
title: Comment on request REQ-290
created_by: xgd
created_at: '2026-09-21T00:32:06.377058+00:00'
updated_at: '2026-09-21T00:32:06.377058+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-aab6c72e
  kind: note
---

Answered from [[EPIC-16]], which holds the design context. All three are in the ticket
body now — the decisions have to live there, not only here, or the UATs have nothing to
trace to.

## Q1 — Yes. Land REQ-290 whenever; it is not blocked.

Your reading is right and my dependency line was wrong. I wrote it as though
`bin/publish` were a working content path being removed ahead of its replacement. It
is not — it can only read the three dead trees, and has never been able to move a
builder-authored site. Deleting it removes nothing that works for anything real.

The body now states the one constraint that *is* real, and it is your Q3: `push.ts`'s
transport must survive.

One thing to hold in view rather than act on: [[REQ-289]] stays the higher-priority
ticket, because the Lagrange Foundry draft still has no backup and lives in one
gitignored directory. That is about what to do next, not about what you may land.

## Q2 — Narrow, but wider than the narrow you described.

Narrow is right and wide is churn the Boundaries section already forbids. But pinning
`1c repro` alone does not deliver what the ticket claims.

The default lives at **three** call sites, not one — `cli/commands.ts:36`,
`cli/shot.ts:94`, `cli/serve.ts:56`, each resolving `opts.sandbox ? 'sandbox' : 'sites'`.
So *every* command without `--sandbox` writes `storage/sites/`, not just `repro`. Pin
`repro` alone and `1c new foo` still recreates `storage/sites/foo`: the tier would be
empty rather than retired, which is the state this ticket is written against.

**Flip all three. The CLI resolves `sandbox` unconditionally; `--sandbox` comes out of
the help text.** `'sites'` stays in the `Root` type — it is how the relocated corpus is
read, and those suites build a context directly rather than through the CLI, so the
~103 temp-`cwd` suites stay untouched. Still narrow; it just closes the hole.

## Q3 — Confirmed, and it is firmer than "pure waste".

Deleting `push.ts` **breaks the deployed Worker**: `apps/control-app/src/router.ts:38`
imports `payloadToWrite` and `SitePayload` from it to serve `/api/import`. That outranks
the reuse argument, correct though the reuse argument also is.

So: delete `bin/publish`, the `push` case, its help section. Keep the module, rewrite
its header. **Where it finally lives is [[REQ-289]]'s call** — that ticket knows what the
transport becomes, and renaming it now would be a second churn on the same file.

## On your finding — thank you, and the body is corrected

Three was wrong; fourteen is in the ticket, attributed to your trace. Your fixture plan
is adopted as written: `tests/fixtures/l1-corpus/storage/sites/<slug>/`, repo shape
preserved so every reader swaps `REPO` → `CORPUS_ROOT` and no assertion changes. That
is worth the oddity of a `storage/sites/` path surviving inside a fixture.

**One addition, and it is the only thing I am adding to your plan:** put a README in the
fixture directory saying what the corpus is, that it is a frozen test input rather than
an authoring tier, and that sites are made in the builder. That path still reads as an
authoring tier to anything grepping for it, and this whole ticket exists because a
retired path that still answers questions is worse than one that is gone. One file.

The rest — `bin/access-token`'s next-step line, `ACCESS.md`, DOC-41 §1/§2/§3/§5,
deleting `bin/author_xgd_sections.py`, the `1c reset` preserved list — all adopted and
in the body.

Go ahead: yes to all three.
