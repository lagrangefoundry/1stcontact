---
uid: report-8c53ee5a
id: REPORT-4883
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:09:53.640610+00:00'
updated_at: '2026-09-23T23:09:53.640610+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

Three `UU` conflicts, all on code files — rule 2c (incoming authoritative,
non-overlapping changes kept from both sides). Incoming is
`11ca5fea9a feat(ai): the fidelity surface … [FREE-CODED]` (REQ-157).

- **`apps/control-app/src/ai.ts`** — UU, 2c. One hunk in `workerHost`'s deps
  literal. Incoming's real change is the field rename
  `knowledgeSurface: …` → `extraSurfaces: [ … ]`; the neighbouring
  `priming:` line was context that HEAD has since changed (REQ-158 moved the
  role purpose into `host-core.ts`, so `sessionPriming` now takes one
  argument — confirmed at `apps/control-app/src/session-knowledge.ts:388`).
  Resolved as incoming's `extraSurfaces` line + HEAD's one-argument
  `sessionPriming(knowledge)` and its explanatory comment. Incoming's
  `CARETAKER_PURPOSE` argument is dropped because the symbol is neither
  imported nor accepted on HEAD.

- **`tests/reconciliation-assistant-conversation.test.ts`** — UU, 2c/2f.
  One hunk, an import line. Strictly additive on both sides and
  non-overlapping, so both were kept: HEAD's `modelSaw`/`stalls` additions to
  the `scripted-model-client` import, plus incoming's new
  `FIDELITY_DECLARATION` import. No test function on either side was
  removed. Incoming's second hunk (the two-surface grant assertion in
  `what the assistant is offered`) auto-merged and is present at lines
  733–739.

- **`tools/generate/src/cli/ai/host.ts`** — UU, 2c. Three hunks:
  1. `nodeDeps`' signature/preamble. Kept incoming's whole new
     `nodeFidelityDeps` helper and HEAD's `export` on `nodeDeps` (HEAD
     exported it so tests can assemble and inspect the runtime). The two
     doc comments were re-ordered so each sits above the function it
     documents.
  2. The inline knowledge block inside `nodeDeps`. HEAD wins: that block was
     extracted into `knowledgeDeps()` and rewritten for KM's current
     provider-pair priming API (`km.landscape`/`km.mechanism`/`register`).
     Incoming's copy still calls the removed `KnowledgeDocs.open(…)` seam —
     see the note under "Incoming changes preserved" below.
  3. The returned deps literal. Combined: incoming's `fidelity:` factory
     (guarded on `opts.origin`) plus HEAD's
     `...(knowledge !== null ? await knowledgeDeps(knowledge) : {})`
     spread, with the `knowledgeSurface: null` default replaced by
     `extraSurfaces: []` to match the merged `HostDeps`.

  Consequential (non-conflicted) edit in the same file: `knowledgeDeps()`'s
  return type and body were moved from `knowledgeSurface` to
  `extraSurfaces: [ … ]`. The already-auto-merged `host-core.ts` no longer
  declares `knowledgeSurface` at all (`HostDeps.extraSurfaces`, line 221,
  consumed at 482–487), so leaving HEAD's spelling would have been a type
  error — this is the same rename, applied at the place HEAD moved the code
  to.

## Incoming changes preserved

- `apps/control-app/src/ai.ts` — incoming's sole change (`knowledgeSurface` →
  `extraSurfaces` array) is present at line 196.
- `tests/reconciliation-assistant-conversation.test.ts` — incoming's
  `FIDELITY_DECLARATION` import (line 25) and its use in the union-of-two-
  declarations grant assertion (lines 733, 739) are both present.
- `tools/generate/src/cli/ai/host.ts` — all four of incoming's changes are
  present: the three new imports (`fsReferenceStore`,
  `createPlaywrightDriver`/`guardedPlaywrightDriver`, `FidelityDeps`) at
  lines 57–59; `nodeFidelityDeps` at line 209; the `fidelity:` dep at lines
  255–257; and the `knowledgeSurface` → `extraSurfaces` rename, carried into
  `knowledgeDeps()` at lines 159/166.

One incoming hunk was dropped, under the BUG-1301 precedence note: the body
of incoming's inline knowledge block in `nodeDeps` (the
`priming = async (box) => bridge.KnowledgeDocs.open(knowledge, { rolePurpose,
mechanism })` form). Its target was already removed by HEAD-side commit
`Merge branch 'free-REQ-158' into xgd-working`, which extracted the block
into the exported `knowledgeDeps()` helper and rewrote the priming against
KM's replacement API. That removal is a legitimate refactor, not a
resolution shortcut: `host-core.ts`'s own `HostDeps.priming` doc (lines
246–263, auto-merged, not written by me) states that the snapshot seam
"is gone, because a snapshot assembled once cannot reflect a document
published after the session opened", and the priming field's type on HEAD is
the `{ landscape, mechanism, register }` triple rather than a function —
incoming's closure would not type-check against it. The semantic content of
the dropped hunk (the surface, its grant, and the manual-as-mechanism
ordering) survives inside `knowledgeDeps()`; only the call shape changed.

Verification beyond reading: `tsc --noEmit` passes clean on both affected
packages — `tools/generate/tsconfig.json` and `apps/control-app/tsconfig.json`.
No conflict markers remain anywhere under `apps/`, `tools/` or `tests/`.
