---
uid: report-7cec4c17
id: REPORT-4194
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T01:03:24.446746+00:00'
updated_at: '2026-09-14T01:03:24.446746+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Context

Cherry-pick of `6d345f3303` (`Merge branch 'free-REQ-160' into xgd-working`,
2026-09-01) onto HEAD, whose relevant side is `1b269f32` (`Workflow
fix_implementation_drift completed: fail`, bundle-87be4669, 2026-09-11).

The two sides are not competing on the same feature. HEAD had already migrated
this host to the CURRENT `@lagrangefoundry/ai` API — `Role({priming: [...],
reminders: [...]})` with a `PrimingProviders` registry — while incoming's
REQ-160 work was authored against the previous one (`role.source` /
`role.reminder` mutation, `KnowledgeDocs.open`). Verified directly against the
installed store at `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry`:

- `ai/src/roles.js:480` — `Role` accepts only `priming`/`reminders` entry lists
  and calls `Object.freeze(this)`, so incoming's `role.reminder = ...` would
  throw on every turn and its `new Role({system, source, reminder})` would
  prime with nothing (keys silently ignored).
- `ai-knowledge/src/index.js:30` — `KnowledgeDocs` is gone; the seam is
  `registerKmProviders` / `LANDSCAPE_PROVIDER` / `MECHANISM_PROVIDER`.
- `ai/src/roles.js:257` + `ai/src/manager.js:635` — a provider is
  `async (ctx) => string|null` and reminders are assembled per turn with a
  `SessionContext` carrying `sessionId`.

So HEAD's structure is load-bearing and incoming's REQ-160 substance is the new
feature. Both were kept: nothing of either side's intent was dropped.

## Files resolved

- `tools/generate/src/cli/ai/host-core.ts` — UU, code (2c.2 + 2c.3.b).
  Two hunks.
  - `HostDeps`: pure combine. Incoming never changed `priming` (it appears in
    the theirs block only as adjacent hunk context — `git diff :1: :3:` shows
    incoming's only edit here is an ADDITION), so HEAD's provider-pair
    `priming?: {landscape, mechanism, register}` is kept verbatim and incoming's
    new `delta?: (sessionId) => Promise<string|null>` field is appended
    verbatim. One clause of incoming's doc comment was updated: it described
    delivery via "`SessionManager` re-reads `role.reminder`", a mechanism HEAD
    removed, so it now names the reminder provider instead.
  - `streamPrompt`: manual integration. HEAD moved the reminder computation out
    of `streamPrompt` into the `reminderFor` provider; incoming edited the block
    HEAD deleted, to resolve the delta and pass it as `caretakerReminder`'s
    third argument. Achieved both intents by moving incoming's two lines into
    `reminderFor` (outside the conflict region, edited deliberately — that is
    where HEAD relocated the code incoming was changing), and by widening the
    provider registration to take the framework's `ctx` so `ctx.sessionId`
    reaches `deps.delta`. Incoming's "delta even on the first turn" behaviour
    (`before === undefined` branch also passes it) is preserved.

- `apps/control-app/src/ai.ts` — UU, code (2c.3.a/2c.3.b).
  Incoming's block taken whole — `sessionKnowledgeSurface`, `sessionPriming`,
  and the `delta:` wiring — with HEAD's single change layered on: the role
  purpose is no longer passed to the priming factory, because `host-core.ts` now
  owns where the purpose sits in the entry list. `git diff` of the resolved file
  against `:3:` is exactly that one difference and nothing else. HEAD's
  `knowledgeSurfaceFor`/`knowledgePriming` calls were superseded rather than
  discarded: they are the single-KB (`SYSTEM_KB` only) form of what incoming's
  two-KB co-ranked pair does, and both functions remain exported from
  `system-knowledge.ts` for the reconciliation test that uses them.

- `apps/control-app/src/session-knowledge.ts` — NOT conflicted (`A`, incoming's
  new file), edited as the manual-integration half of the `ai.ts` resolution.
  `sessionPriming` returned the removed `(box) => KnowledgeDocs.open(...)` shape,
  which `HostDeps.priming` no longer accepts. Ported to the provider pair,
  mirroring HEAD's own `knowledgePriming` in `system-knowledge.ts` but over the
  composite runtime and with `kb: [...SESSION_KBS]` so BOTH maps land in the one
  landscape section — which is REQ-160's central claim. The `rolePurpose`
  parameter is gone for the same reason it is gone at the call site. This was
  the alternative to either discarding REQ-160's two-KB priming (a STEP 3
  violation) or leaving `ai.ts` handing `host-core.ts` a shape it rejects.

## Incoming changes preserved

Confirmed present in the resolved tree, per `git show 6d345f3303 -m
--first-parent`:

- `host-core.ts` — both incoming hunks: the `delta` seam on `HostDeps`
  (verbatim, minus the one corrected mechanism clause), and the delta resolved
  and passed as `caretakerReminder`'s third argument in both the
  no-baseline and the baseline branch (now in `reminderFor`).
- `ai.ts` — every incoming hunk: the REQ-160 header prose, `TicketStore` import,
  `sessionArchive(tickets)` over `TicketSessionArchive`, the `tickets` parameter,
  the `SessionKnowledge` type, `sessionKnowledgeSurface`, `sessionPriming`, and
  the `delta:` wiring over `turnDelta` — verbatim.
- `roles.ts`, `assets.ts`, `router.ts`, `tickets.ts`, `session-delta.ts`,
  `package.json` and all four test files auto-merged cleanly and carry
  incoming's content unmodified.

No hunk was dropped. The BUG-1301 precedence exception was not used and no test
function was deleted.

## Flagged for post-merge review

Type-checked with `node_modules/.bin/tsc -p apps/control-app/tsconfig.json
--noEmit`. Nothing my resolution produced errors — in particular the
`priming` shape, the `delta` seam and `ctx.sessionId` all check clean. Seven
errors remain, each pre-existing on one side and none introduced here:

1. `host-core.ts:55` / `:245` (TS2440/TS2395 ×3) — `CARETAKER_PURPOSE` is both
   imported from `./roles` and declared locally. PRE-EXISTING ON HEAD: both
   lines are present in `git show HEAD:tools/generate/src/cli/ai/host-core.ts`.
   HEAD's own move of the constant into `roles.ts` left the host-core copy
   behind. NOT fixed here on purpose: `host.ts:49` still imports it FROM
   `host-core`, so the deletion needs `host.ts` changed with it, which is drift
   repair and not conflict resolution.
2. `session-knowledge.ts:17` (TS2459) — `SHIPPED_SOURCE` is imported from
   `./system-knowledge`, which never exported it. PRE-EXISTING IN INCOMING:
   `git show 9081f1b091:apps/control-app/src/system-knowledge.ts` (the
   cherry-pick's own base) has no such export either, so incoming's commit
   carried this error on its own branch.
3. `session-knowledge.ts:10,11,13` (TS2305 ×3) — `searchChunks`, `DEFAULT_TOP_K`,
   `DEFAULT_CHUNKS_PER_HIT` missing from `./generated/knowledge`. NOT A DEFECT:
   the generated shim on disk predates incoming's `assets.ts` change, which adds
   exactly those three to `KNOWLEDGE_EXPORTS`. `1c assets` regenerates it; the
   file is marked "do not commit".

Also worth a reviewer's eye, though not a conflict: incoming's
`test_UAT_FC_REQ-160_a_cold_session_is_primed_with_both_landscapes_in_one_section`
asserts on `'# Your purpose'` appearing between the landscape and the mechanism.
Under HEAD's migrated design KM no longer emits that heading — the host supplies
the purpose as a plain `caretaker-purpose` text entry — so that assertion is
stale against the current framework. Left untouched (2f): the test function
stays, and adjusting its expectation is a drift decision, not mine.
