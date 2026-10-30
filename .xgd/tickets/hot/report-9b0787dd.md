---
uid: report-9b0787dd
id: REPORT-5544
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T12:22:56.426793+00:00'
updated_at: '2026-09-29T12:22:56.426793+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Incoming commit: 798310c363 — `[FREE-CODED] BUG-55 — the index seam is a map keyed by source, not one index`

## Context that governs every resolution below

HEAD already carried a reconciled equivalent of BUG-55. Upstream REQ-112 replaced the
singular `source:` / `chunkSource:` options with `indexes:` / `chunkIndexes:` MAPS keyed by
source name, and main had already migrated all seven call sites. So nearly every hunk was
two spellings of the same fix rather than competing intent.

Verified facts underpinning the calls (read from the installed component, not assumed):

- `indexFor(kb, indexes)` at `@lagrangefoundry/knowledge/src/index_store.js:113` does a bare
  `map.get(kb.source)` with NO fallback — the map key must equal `kb.source` exactly.
- `DEFAULT_SOURCE === 'project'` (`config.js:59`); the declaration parser defaults a missing
  `source` to `DEFAULT_SOURCE` (`config.js:353`); `PROJECT_KB === 'project'`
  (`knowledge.ts:95`, whose own comment records the deliberate collision).
- `kb/knowledge_bases.json` gives the project KB no `source` (confirmed by parsing it).

Therefore incoming's `{ [DEFAULT_SOURCE]: … }` and HEAD's `{ [kb.source ?? PROJECT_KB]: … }`
resolve to the identical key `'project'` at runtime.

## Files resolved

- **apps/control-app/src/knowledge.ts** — UU, code file (rule 2c). One conflict, on the
  `indexes:` key expression. Kept HEAD's `{ [this.kb.source ?? PROJECT_KB]: this.index }`.
  Incoming's docstring paragraph ("The index goes over as a MAP keyed by the name this KB's
  declaration resolves to") merged cleanly and was retained. Removed the now-unused
  `DEFAULT_SOURCE` import that incoming added (retained only as prose references), so the
  file lints.
- **apps/control-app/src/session-knowledge.ts** — UU, code file (rule 2c). Three conflicts.
  Took **incoming's** comment at the `search` site (HEAD had none there, which left HEAD's own
  chunk-site comment "under the same option name" referring back to nothing). Took HEAD's
  chunk-site comment and HEAD's project opener, which hoists `const kb = projectKb()` and so
  drops a duplicate call. Incoming's two changes that HEAD LACKED both merged cleanly and were
  preserved: dropping the now-dead `source: null` from `compositeRuntime` (line 136), and the
  docstring paragraph on snapshot emptiness. Removed the unused `DEFAULT_SOURCE` import.
- **apps/control-app/src/system-knowledge.ts** — UU, code file (rule 2c). One conflict,
  comments only — both sides' code was byte-identical
  (`indexes`/`chunkIndexes` keyed by `SHIPPED_SOURCE`). Kept HEAD's comment; incoming's
  rewritten `sources` comment merged cleanly and was retained.
- **tools/generate/src/cli/kb.ts** — UU, code file (rule 2c). Two conflicts, comments only —
  code byte-identical on both sides at `buildMap` and `openKnowledgeRuntime`. Kept HEAD's
  comments; incoming's docstring paragraph ("THE INDEXES ARE PASSED AS A MAP AND THAT IS NOT A
  SPELLING DETAIL") merged cleanly and was retained.
- **tests/test_UAT_FC_REQ-123_system_kb.test.ts** — DU (deleted by us / modified by them),
  rule 2a resolved as `git rm` under the BUG-1301 PRECEDENCE exception. Justified in detail
  below.

## Incoming changes preserved

Confirmed by reading the resolved files (`grep` of the seam in each):

- `knowledge.ts:348` — `indexes: { [this.kb.source ?? PROJECT_KB]: this.index }`
- `session-knowledge.ts:209` — `indexes: runtime.indexes`
- `session-knowledge.ts:241` — `indexes: runtime.chunkIndexes`
- `session-knowledge.ts:335-336` — `indexes` / `chunkIndexes` for the project KB
- `session-knowledge.ts:136` — `new KnowledgeRuntime({ store, kbs, documents, sources })`,
  i.e. incoming's removal of the stale `source: null` is present (HEAD lacked this)
- `system-knowledge.ts:152-153` — `indexes` / `chunkIndexes` keyed by `SHIPPED_SOURCE`
- `kb.ts:932` — `indexes: { [SHIPPED_SOURCE]: indexSource }`
- `kb.ts:1085-1086` — `indexes` / `chunkIndexes` keyed by `SHIPPED_SOURCE`

No conflict markers remain anywhere under `apps/`, `tools/`, `tests/`.

Nothing from incoming was discarded. Where HEAD's spelling of a key expression survived
instead of incoming's, the two are provably equal (proof above), and HEAD's form is strictly
more robust: it reads the key from the KB's own declaration, so it keeps working if the project
KB ever declares a `source`, and it matches how `session-knowledge.ts` and
`system-knowledge.ts` already key theirs. Incoming's SUBSTANCE — the seam moving from a bare
artifact to a map keyed by source name — is present at every one of the seven call sites.

### Hunk dropped under the BUG-1301 precedence exception

**File**: `tests/test_UAT_FC_REQ-123_system_kb.test.ts` (kept deleted).

**HEAD-side commit that already removed its target**: `671a09196f`
— *"test(kb): assert the export command itself, and retire the duplicate suite"*
(−503 lines removing this file, +91 lines added to
`tests/reconciliation-system-knowledge-base.test.ts`).

**Why that removal is a legitimate refactor and not a resolution shortcut**:

1. It predates this resync entirely and is already integrated into main — it is not a choice
   made here to make a conflict go away.
2. Its commit subject and shape state the intent explicitly: the suite was a DUPLICATE, and it
   was retired by folding its coverage into the surviving
   `reconciliation-system-knowledge-base.test.ts` in the same commit. Coverage moved; it was
   not dropped.
3. The incoming hunk's ENTIRE target is the three now-gone call sites inside the retired file
   — the change to it was purely the mechanical seam rename
   (`source: nodeIndexSource(…)` → `indexes: { [SHIPPED_SOURCE]: nodeIndexSource(…) }`, plus a
   `SHIPPED_SOURCE` import). No new assertion, no new test function.
4. The surviving suite ALREADY carries that identical seam fix on main
   (`reconciliation-system-knowledge-base.test.ts:461` and `:484`,
   `indexes: { [SHIPPED_SOURCE]: nodeIndexSource(…) }`), so resurrecting the retired file would
   restore a duplicate whose one incoming change is already present elsewhere.
5. BUG-55's own new UAT, `tests/test_UAT_FC_BUG-55_index_seam.test.ts`, came across cleanly and
   covers the seam directly (3/3 passing, see below). No test function that exists on either
   side of this conflict has been lost.

## Verification run in this worktree

- `tests/test_UAT_FC_BUG-55_index_seam.test.ts` — 3 passed.
- `reconciliation-system-knowledge-base-packed`, `test_UAT_FC_REQ-158_system_kb_bundle`,
  `test_UAT_FC_REQ-159_project_kb_config`, `test_UAT_FC_REQ-123_session_knowledge`,
  `test_UAT_FC_REQ-165_projected_reference` — 50 passed.

### Pre-existing failure on main, NOT caused by this resolution

`tests/reconciliation-system-knowledge-base.test.ts` has 3 failures
(`TypeError: install is not a function`). That file is byte-identical to HEAD here
(`git diff HEAD` on it is empty) and is untouched by this resolution — it already contained
BUG-55's seam fix, which is why the cherry-pick produced no change to it. Cause: four
`withStore(…)` call sites pass a value where the local helper at line 183 requires a
`paging(…)` installer thunk — lines 636, 690, 703, 1293. `git blame` attributes them to main's
own `671a09196f` and `47fe3cc820`. Left alone rather than folding an unrelated fix into a
resync commit; wants its own ticket.

### Verification not performed

- Typecheck could not be run: `npx tsc` is denied under this session's permission mode, and
  `pnpm` attempted to purge `node_modules` (no-TTY deps-status check), which I declined to let
  it do. Tests were run via `node_modules/.bin/vitest` directly.
- Workers-pool suites cannot run in this sandbox (they bind a local server, which is blocked),
  so `test_UAT_FC_REQ-160_two_kb_session.workers` and the other `.workers` knowledge suites are
  UNVERIFIED here and should be run before this lands.
