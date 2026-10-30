---
uid: report-fa9e24ab
id: REPORT-4779
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T19:10:17.846490+00:00'
updated_at: '2026-09-21T19:10:17.846490+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

Incoming commit: `e9bd703bd9 [FREE-CODED] REQ-160 — two-KB priming, the change
cursor, and the delta channel` (2026-09-01). Four conflicted files, eight
regions, all resolved in favour of HEAD. Every region is the same shape: the
incoming payload is already on the target side, carried there by **later**
commits that are part of the target base rather than of the replay queue, and
the incoming side is the superseded first form of the same mechanism.

## Files resolved

- `apps/control-app/src/session-knowledge.ts` — **AA** (both-added), 4 regions,
  rule 2b. The KM component's priming and search seams were renamed after this
  commit. Decisive evidence comes from files that are NOT conflicted and
  therefore show pure HEAD:
    - `apps/control-app/src/system-knowledge.ts:205,219` already builds priming
      as `{ landscape: LANDSCAPE_PROVIDER, mechanism: MECHANISM_PROVIDER,
      register }` over `registerKmProviders`.
    - `tools/generate/src/cli/ai/host.ts:177,180` — the CLI host — **consumes**
      that object shape (`bridge.LANDSCAPE_PROVIDER`,
      `bridge.registerKmProviders`).
    - `apps/control-app/src/knowledge.ts:341` and `system-knowledge.ts:152-153`
      pass `indexes:` / `chunkIndexes:` keyed by source name, not `source:` /
      `chunkSource:`.

  Regions: (1) import list — HEAD's `LANDSCAPE_PROVIDER`, `MECHANISM_PROVIDER`,
  `registerKmProviders` over incoming's `KnowledgeDocs`; (2) `CoRankedKnowledge.
  search` — `indexes: runtime.indexes` over `source: runtime.source`;
  (3) `searchChunks` — `indexes: runtime.chunkIndexes` over `source:
  runtime.chunkSource`; (4) `sessionKnowledgeFor`/`sessionPriming` — HEAD hoists
  `const kb = projectKb()` so the runtime's index maps can be keyed by
  `kb.source ?? PROJECT_KB`, and exports `sessionPriming(knowledge)` returning
  the provider-pair object, over incoming's
  `sessionPriming(knowledge, rolePurpose)` returning a
  `(box) => KnowledgeDocs.open(...)` factory.

  Taking the incoming side on any of these four would not compile against the
  generated bridge the rest of the tree is written to.

- `tools/generate/src/cli/ai/host-core.ts` — **UU**, 3 regions, rule 2c.
    1. `HostDeps.priming` type: HEAD's `{ landscape, mechanism, register }`
       object over incoming's `((box: Untyped) => Promise<Untyped>) | null`.
       HEAD is the shape `managerFor` actually calls at line 619
       (`deps.priming?.register(manager.providers, box)`) and the shape both
       `host.ts` and `session-knowledge.ts` construct.
    2. `HostDeps.delta` doc comment: both sides say the host owns delivery and
       differ on what the delivery IS. HEAD ("the reminder provider this host
       registers") describes the code as it stands —
       `manager.providers.register(REMINDER_PROVIDER, ...)` at line 609.
    3. `streamPrompt` body: incoming inserts the reminder refresh (read
       `roles`/`baselines`, `await deps.delta(sessionId)`, assign
       `role.reminder`) at the START of the turn. HEAD has nothing there because
       that block moved wholesale into `reminderFor` (lines 645-651), registered
       as the reminder provider and resolved by the manager at the top of every
       turn. The two bindings that survive on the HEAD side, `key` and `store`,
       are both still live (`store` at 799/807/817, `key` at 817), so the
       removal leaves no unused local.

- `apps/control-app/src/session-delta.ts` — **AA** (both-added), 1 region,
  rule 2b. The persist condition in `turnDelta`. Incoming:
  `if (next.at !== cursor.at || next.seen.length !== cursor.seen.length ||
  chat === null)`. HEAD hoists `const stored = storedCursor(chat)` and keys the
  write on `stored === null` instead of `chat === null`, with a comment
  recording the bug: the chat ticket is created by the ARCHIVE on the previous
  turn, so `chat === null` stops being true almost immediately, a first turn
  that reports nothing writes no bookmark, and the next turn falls back to
  coverage-from-now — silently skipping everything uploaded in between. HEAD is
  a strict superset (same condition plus the fix), so HEAD kept.

- `apps/control-app/src/ai.ts` — **UU**, 1 region, rule 2c.
  `priming: sessionPriming(knowledge)` (HEAD) over
  `sessionPriming(knowledge, CARETAKER_PURPOSE)` (incoming).
  `CARETAKER_PURPOSE` has no import in HEAD's `ai.ts` — its only occurrence in
  that file was the incoming conflict line — so the incoming side is an
  undefined reference. The purpose now enters the role in `host-core.ts:551`
  (`new lib.Entry({ name: 'caretaker-purpose', text: CARETAKER_PURPOSE })`),
  which is exactly what HEAD's comment at the call site states.

## Incoming changes preserved

Nothing was discarded. Every REQ-160 claim in the commit message is present on
the target side, in a later form:

- **Two-KB priming** — `sessionPriming` still composes both KBs into one
  landscape section, now through the provider pair rather than
  `KnowledgeDocs.open`, and still confines the map axis to
  `[...knowledge.perKb.keys()]`.
- **Co-ranked search** — `CoRankedKnowledge` is intact; only the option name for
  the artifacts it reads changed (`source` → `indexes`).
- **The cursor** — `turnDelta`'s cursor logic is intact and additionally fixed.
- **The delta channel** — the block dropped from `streamPrompt` exists verbatim
  in `reminderFor` (`host-core.ts:645-651`): same `deps.delta(sessionId)` read,
  same `caretakerReminder(slug, undefined | { at, changes }, delta)` calls, same
  `baselines` lookup. `HostDeps.delta` is still declared (line 273). The only
  change is WHERE it runs — a registered reminder provider resolved per turn,
  instead of an assignment at the turn boundary. Keeping the incoming block
  would have produced a second, staler writer of the same reminder.

No BUG-1301 precedence exception was invoked — nothing was dropped because a
HEAD-side refactor had removed its target; in every case the target still exists
and already holds the incoming payload. No test files were touched by this
conflict, so rule 2f was not engaged.

## Staging state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain.
`git diff --cached HEAD` is empty — the staged tree is byte-identical to HEAD,
which also means the commit's non-conflicted hunks (the `R2TranscriptArchive`
deletion, the `workerHost` line, the two retargeted REQ-146 UATs) produced no
net change either: they are already applied on the target side.

Per STEP 4, neither `--continue` nor `--skip` was called. `CHERRY_PICK_HEAD`
(`e9bd703bd909ee89f9992cc645551cbb9dbefde8`) is intact; finalize will detect the
clean staged diff and skip the commit.
