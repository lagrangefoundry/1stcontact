---
uid: report-8ccd3600
id: REPORT-5538
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:43:12.033547+00:00'
updated_at: '2026-09-29T10:43:12.033547+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Context

Incoming commit is `f0724a537f` — "feat(ai): the session's three texts, and a
record that outlives them [FREE-CODED]" (REQ-171). HEAD and the incoming commit
are **parallel lines off the same 0.2.57 base**, not one ahead of the other:
both sides rewrote the same seam from opposite directions.

- HEAD replaced KM's assembled priming snapshot (`KnowledgeDocs.open(...)`) with a
  **pair of named providers** and moved the ordering decision into `host-core.ts`'s
  entry list; it also moved `CONSULTANT_PURPOSE` into `roles.ts`, turned the
  reminder into a provider (REQ-131), and added legacy role-name aliases (REQ-174).
- REQ-171 split the session's texts, shrank priming to the **summary** manual
  (with `DescribeTools` as the route to detail), rewrote `CONSULTANT_PURPOSE`, and
  added the **engagement ledger**.

Per 2c the incoming side is authoritative, so each hunk was integrated onto
HEAD's mechanism rather than either side being taken wholesale.

## Files resolved

- `apps/control-app/src/ai.ts` — UU, 2c. Kept HEAD's `sessionPriming(knowledge)`
  call (purpose is no longer a parameter) and **added** the incoming ledger wire
  `ledger: (slug) => chatLedger(tickets, sessionIdFor(slug))` plus its imports.
  Dropped only the now-nonexistent `CONSULTANT_PURPOSE` argument.
- `apps/control-app/src/session-knowledge.ts` — UU, 2c. Kept HEAD's
  `LANDSCAPE_PROVIDER`/`MECHANISM_PROVIDER` pair and carried the incoming
  summary-level manual into it: `mechanismFor: () => box.manual({ level: 'summary' })`.
- `apps/control-app/src/system-knowledge.ts` — UU, 2c. Same resolution, so both
  hosts prime the same role with the same mechanism level.
- `tools/generate/src/cli/ai/host-core.ts` — UU ×3, 2c.
  (1) Kept HEAD's `priming` provider-pair doc and **added** the incoming
  `ledger?: ((slug: string) => LedgerDeps) | null` dep.
  (2) Kept HEAD's `export { CONSULTANT_PURPOSE }` re-export and landed REQ-171's
  **new purpose text** in `roles.ts`, where HEAD moved the declaration.
  (3) Kept HEAD's entry-list `Role` construction (`priming:`/`reminders:`).
- `tools/generate/src/cli/ai/host.ts` — UU, 2c. Kept HEAD's extracted
  `knowledgeDeps()` and carried the incoming summary level into its
  `mechanismFor`. The incoming inline block was superseded by that extraction.
- `tools/generate/src/cli/ai/roles.ts` — not conflicted (applied cleanly), but
  edited during resolution to receive REQ-171's rewritten `CONSULTANT_PURPOSE`,
  which the incoming commit had authored at its pre-move location in `host-core.ts`.

Applied cleanly, unchanged: `apps/control-app/src/ledger.ts`,
`tools/generate/src/cli/ai/ledger-core.ts`, `ledger-surface.json`,
`l1-surface.json`, `toolbox-core.ts`, both `test_UAT_FC_REQ-171_*` files,
`package.json` (0.2.57 → 0.2.58).

## Incoming changes preserved

Verified present in the resolved tree:

- **The engagement ledger** — `ai.ts:315` wires it; `host-core.ts:298` declares
  the dep; `host-core.ts:550-551` composes `ledgerSurfaceFor` + `ledgerInstanceConfig`.
- **Priming carries a summary, not a reference** — `box.manual({ level: 'summary' })`
  at `host.ts:196`, `host-core.ts:640`, `session-knowledge.ts:403`,
  `system-knowledge.ts:224`. `DescribeTools` is composed centrally in
  `toolbox-core.ts` (applied cleanly).
- **Product material written once** — `CONSULTANT_ROLE_TEXT` / `PRODUCT_SYSTEM` /
  composed `CONSULTANT_SYSTEM` in `roles.ts` (applied cleanly).
- **The purpose names documents and both corpora** — REQ-171's text at
  `roles.ts:238-248`, reachable from `host-core.ts` via the re-export that the
  UAT imports from.

Test evidence: `tests/test_UAT_FC_REQ-171_session_texts.test.ts` — **18/18 pass**,
including the `CONSULTANT_PURPOSE` assertions (imported from `host-core`, satisfied
by the re-export) and the summary-vs-full-manual ratio assertions.

Also run and passing: REQ-123, REQ-126, REQ-157, REQ-158, REQ-160.
Not runnable in this sandbox (denied `listen()`, so miniflare and `startBuilder`
cannot bind): `test_UAT_FC_REQ-171_ledger.workers.test.ts`, REQ-122, REQ-174.
Pre-existing, unrelated failure: `test_UAT_FC_REQ-165_projected_reference` —
`knowledge base 'system' reads from source 'shipped', which this host has no index
for (available: none)`; this worktree is a 13% sparse checkout and `kb/` holds only
`knowledge_bases.json`, so the index was never built here. That path is untouched
by this resolution.

### Hunks dropped under BUG-1301 precedence

Three incoming hunks had their entire target removed by legitimate, documented
refactors already integrated into HEAD. All three are implementation files; no
test function was deleted.

1. **`session-knowledge.ts` / `system-knowledge.ts` — `KnowledgeDocs.open(...)`.**
   Removed by HEAD's REQ-158 KM priming migration. The removal is documented in
   the surviving doc comment (`system-knowledge.ts:186-189`): "`KnowledgeDocs.open()`
   is gone upstream: it existed only to serve a synchronous `ContextSource` from a
   snapshot assembled once, which by construction cannot reflect a document
   published after the session opened." The API no longer exists to call. The
   incoming hunk's *intent* — the summary manual — was carried onto the
   replacement seam rather than dropped.

2. **`host-core.ts` — `Role({ system, source, reminder })`.** Superseded by the
   entry-list `Role({ priming: [...], reminders: [...] })` shape, introduced by
   REQ-131 (per-turn reminder provider) and required by REQ-174 (legacy role-name
   aliases). Both are named in the surrounding HEAD comments and neither is
   reversible without unwinding those tickets.

3. **`host.ts` — inline knowledge wiring in `nodeDeps`.** HEAD extracted it to the
   exported `knowledgeDeps()` (REQ-158), documented at `host.ts:147-152` as
   deliberate: "Naming the pair rather than inlining it is also what lets a test
   observe the wiring the host actually uses instead of restating it: the seam that
   broke silently when KM's priming API moved was exactly this one." The incoming
   summary level was carried into the extracted function.

In each case the hunk was dropped because its target is gone, not because keeping
it was inconvenient — and in each case the incoming intent was re-expressed on the
surviving mechanism.
