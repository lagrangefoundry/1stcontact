---
uid: report-1ec27b19
id: REPORT-5524
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T09:27:34.149500+00:00'
updated_at: '2026-09-29T09:27:34.149500+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Cherry-pick head: `11ca5fea9a` — "feat(ai): the fidelity surface — the assistant
can look, compare and judge [FREE-CODED]" (REQ-157). Three UU conflicts, all on
code files, all resolved under rule 2c (incoming is authoritative, keep both
sides where non-overlapping). No DU/UD/AA conflicts; no spec or intent tickets
involved.

Every conflict was the same collision on two axes: the incoming commit converts
the host's single `knowledgeSurface` slot into a plural `extraSurfaces` list so
the fidelity surface can be composed alongside the L1 one, while HEAD had
independently moved the knowledge wiring onto KM's newer provider-pair API
(REQ-158/160). Both sides are right about a different axis, so both were taken.

- **`apps/control-app/src/ai.ts`** (UU, code — 2c). One hunk in `workerHost`'s
  `deps`. Took the incoming `extraSurfaces: knowing ? [sessionKnowledgeSurface(knowledge)] : []`
  (required: merged `host-core.ts` declares only `extraSurfaces` in `HostDeps`,
  and appends the fidelity surface to it at `host-core.ts:482`). Kept HEAD's
  one-argument `priming: sessionPriming(knowledge)` — see the precedence note
  below. `sessionKnowledgeSurface` returns `{surface, granted}`, which is exactly
  the `extraSurfaces` element shape.

- **`tests/reconciliation-assistant-conversation.test.ts`** (UU, code — 2c).
  One hunk, imports only. Union of both sides: HEAD's five symbols from
  `./support/scripted-model-client` (`calls, modelSaw, says, scriptedClient,
  stalls`) plus incoming's `FIDELITY_DECLARATION` from `ai/fidelity-core`. All
  six are referenced in the file body (`stalls` at :548, `modelSaw` at :686/:718,
  `FIDELITY_DECLARATION` at :733), so dropping either side's list would have
  broken the file. Not a `test_UAT_*` file, so 2f's stricter rule did not apply;
  regardless, no test function was removed on either side.

- **`tools/generate/src/cli/ai/host.ts`** (UU, code — 2c). Three hunks.
  1. Took incoming's `nodeFidelityDeps(slug, opts, origin)` helper verbatim,
     hoisted above `nodeDeps`'s doc comment (the merge had wedged it between that
     comment and its function). Kept HEAD's `export` on `nodeDeps` —
     `tests/reconciliation-assistant-conversation-knowledge.test.ts:423` imports it.
  2. Dropped incoming's inlined knowledge wiring in favour of HEAD's extracted
     `knowledgeDeps()` — see precedence note. Changed `knowledgeDeps`'s return
     type from `Pick<HostDeps, 'knowledgeSurface' | 'priming'>` to
     `Pick<HostDeps, 'extraSurfaces' | 'priming'>` and wrapped its surface in a
     one-element list, which is how the incoming plural axis reaches this path.
  3. Took incoming's `fidelity: opts.origin ? (slug) => nodeFidelityDeps(...) : null`
     verbatim, alongside HEAD's defaults-then-spread pattern for the
     surface/priming pair.

## Incoming changes preserved

Confirmed present in the resolved tree, checked against `git show 11ca5fea9a`:

- `ai.ts`: `extraSurfaces` (:200).
- `host.ts`: `nodeFidelityDeps` (:209), `fsReferenceStore` import (:57) and use
  (:213), `createPlaywrightDriver`/`guardedPlaywrightDriver` import (:58) and
  `guardedDriver` wiring (:222), `fidelity:` factory (:253), `extraSurfaces`
  (:166, :259).
- `conversation.test.ts`: `FIDELITY_DECLARATION` import (:25) and use (:733).

A declaration-level diff of the resolved `host.ts` against the incoming blob
(`3802e1ea`) shows only three differences, all expected: the resolution
additionally keeps HEAD's `setKnowledgeRoot` and `knowledgeDeps` (newer work the
cherry-picked commit predates), and keeps `nodeDeps` exported.

### Hunks not taken verbatim — BUG-1301 precedence

Two incoming constructs were deliberately not carried over, because their entire
target was removed by a legitimate refactor already integrated into HEAD. Both
are the same refactor, and both are documented in the code that replaced them —
this is acknowledging an earlier decision, not a resolution shortcut:

1. **`ai.ts`: incoming's `sessionPriming(knowledge, CARETAKER_PURPOSE)`.** The
   two-argument signature no longer exists — `apps/control-app/src/session-knowledge.ts:388`
   declares `sessionPriming(knowledge: SessionKnowledge)`, and its doc comment
   (:359-367) states why: "the purpose is not a parameter of this function …
   `host-core.ts` states the order — map, purpose, mechanism — in the entry list
   it builds the role from." `host-core.ts:569` is that entry list. Taking the
   incoming call verbatim would not compile.

2. **`host.ts`: incoming's inlined `bridge.KnowledgeDocs.open(knowledge, {rolePurpose, mechanism})`.**
   That seam is gone. `host-core.ts:246-253` documents the replacement: "KM used
   to hand back a snapshot (`KnowledgeDocs.open(...)`) whose internal order it
   owned; that seam is gone, because a snapshot assembled once cannot reflect a
   document published after the session opened." `HostDeps.priming` is now the
   provider pair `{landscape, mechanism, register}` (`host-core.ts:264`), consumed
   at `host-core.ts:566-576` and `:637`. HEAD's `knowledgeDeps()` already builds
   exactly that pair, so the incoming hunk's contribution — grant the corpus,
   prime with it — is preserved through the current API rather than the dead one.

Both projects typecheck clean after the resolution: `tsc --noEmit` on
`tools/generate/tsconfig.json` and `apps/control-app/tsconfig.json`.

### Test verification (partial — sandbox limitation)

58 tests pass across the suites that exercise the resolved seams:
`test_UAT_FC_REQ-157_fidelity_surface.test.ts`,
`reconciliation-assistant-conversation-knowledge.test.ts` (which covers the
`knowledgeDeps` signature change directly), `reconciliation-assistant-control-surface.test.ts`,
`test_UAT_FC_REQ-126_l1_surface.test.ts`.

NOT run: every `startBuilder`-based suite (including
`reconciliation-assistant-conversation.test.ts`, one of the three resolved files)
and every `*.workers.test.ts`. This sandbox refuses listening sockets
(`syscall: 'listen', address: '127.0.0.1'`), so those suites cannot start. This
is environmental, not a defect in the resolution: `req119-request-time-render.test.ts`,
which this cherry-pick never touches, fails identically. Those suites need a run
outside the sandbox before the merge is fully trusted.

### Note for post-merge review (not a conflict)

`apps/control-app/src/shot.ts:150` exports `fidelityDeps` for the Worker, but no
app code calls it and `workerHost` in `ai.ts` never sets `fidelity:` — so the
Worker composes no fidelity surface. This is the cherry-picked commit's own state
on both sides of the conflict (its `ai.ts` blob contains zero `fidelity`
references), not something the resolution introduced. Flagging it because
REQ-157's message describes the Worker path as intended.
