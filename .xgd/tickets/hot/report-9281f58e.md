---
uid: report-9281f58e
id: REPORT-5568
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T16:02:18.625055+00:00'
updated_at: '2026-09-29T16:02:18.625055+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Conflict commit: `53ede264` — *fix(ai): migrate priming to the framework's DOC-22
configuration [FREE-CODED]* (authored 2026-09-07 14:34). First attempt at this
SHA (`cherry_pick_no_progress_state.json` count=1); `prior_stage_failure` empty.

## The shape of this conflict

Every HEAD-side alternative in these 11 files is one of two things, and the
distinction drove every decision:

1. **Main's automated follow-up to the SAME framework upgrade.** `git log -S`
   places the competing HEAD content in `b12758a877` (*Workflow fix_uat_coverage
   completed: done*, 2026-09-10) and `12c967de95` (*Workflow fix_uat_validation
   completed: done*, 2026-09-10) — both authored AFTER the developer wrote this
   commit, by the automated loop. Per the resync doctrine those do not displace
   free-coded intent, so INCOMING wins.
2. **Earlier free-coded work already cherry-picked onto this branch** (BUG-55
   `indexes` keying, the caretaker→consultant rename, the three-texts work, all
   authored 2026-09-02..09-05). Those merged cleanly outside the markers and are
   preserved intact.

Corroboration that incoming is the newer intent: HEAD's `ai.ts` still built the
describer role with `system:` + a duck-typed `source:` — the pre-DOC-22 shape
this commit exists to remove — while HEAD's `session-knowledge.ts` had a
half-migrated provider-pair. The staged, non-conflicting new UAT
(`tests/test_UAT_FC_BUG-63_priming_configuration.test.ts`, +353) hands
`priming: kmPrimingEntries(...)` straight into `HostDeps`, which only fits
incoming's seam — so incoming's shape was the only coherent target.

## Files resolved

- **apps/control-app/src/ai.ts** — UU, code. Incoming's
  `sessionPriming(lib, knowledge, CONSULTANT_PURPOSE)`; restored the
  `CONSULTANT_PURPOSE` import HEAD had dropped when it stopped passing the
  purpose. HEAD's REQ-157 `extraSurfaces` comment kept.
- **apps/control-app/src/session-knowledge.ts** — UU, code. Incoming's
  `sessionPriming(lib, knowledge, rolePurpose)` over `kmPrimingEntries`; deduped
  the import (HEAD already imported both providers in sorted position). HEAD's
  provider-pair docblock above the function — non-conflicted but describing the
  discarded design — replaced with incoming's text for coherence. HEAD's BUG-55
  `indexes`/`chunkIndexes` keying kept untouched.
- **apps/control-app/src/system-knowledge.ts** — UU, code. Same pattern:
  incoming's `knowledgePriming(lib, runtime, rolePurpose)`, import deduped,
  stale HEAD prose ("THE ORDER IS NO LONGER DECIDED HERE") replaced with
  incoming's. HEAD's BUG-55 comments kept.
- **tools/generate/src/cli/ai/host.ts** — UU, code. BOTH SIDES KEPT: main's
  `knowledgeDeps()` extraction is retained as the seam, and incoming's
  `kmPrimingEntries(lib, bridge, () => knowledge, CONSULTANT_PURPOSE)` replaces
  the provider-pair inside it. One line of glue (`const lib = await ai()`, the
  file's own memoised loader) supplies the argument incoming's call needs
  without changing `knowledgeDeps`'s signature or its test-visible shape.
- **tools/generate/src/cli/ai/host-core.ts** — UU, code, 7 hunks, all INCOMING:
  the `priming?: ((box, providers) => Promise<Entry[]>)` seam type, the
  `reminders` map + `reminderFor` (replacing main's `REMINDER_PROVIDER`
  closure), the `PrimingProviders` registry built in `build()`, the four-entry
  role (`consultant-system`, `km-landscape`, `purpose`, `km-mechanism`),
  `providers` passed in `SessionManager`'s options, the push to host state in
  `streamPrompt`, and `reminders.clear()`. HEAD's separate
  `CONSULTANT_PURPOSE`-moves-to-`./roles` re-export merged cleanly and is kept.
- **tests/support/scripted-model-client.ts** — UU, test support. BOTH HELPERS
  KEPT, because both have live consumers: incoming's `SystemBlock` type and
  `systemText()` (used by the staged REQ-122/158/160/174 suites and the new
  BUG-63 UAT) alongside main's `modelSaw()` (used by the two workers suites that
  never conflicted). Incoming's richer `system` type and docblock taken.
- **tests/reconciliation-assistant-conversation-knowledge.test.ts** — UU, test,
  5 hunks, all INCOMING: the `Bridge` interface gains the three provider fields;
  per-corpus provenance (`runtimeKbs()`); the five-operation `ReadKnowledge`
  census; and the AC1319 priming case assembled through `kmPrimingEntries` +
  `lib.assemble`, with incoming's explanation of why the `# What exists` /
  `# How to search` headings are no longer asserted. `PURPOSE` (a local const
  main deleted) reads as the imported `CONSULTANT_PURPOSE`, which is the same
  value in this tree after the consultant rename. Main's now-unreferenced
  helpers `readGroupTools()` and the local `systemOf()`, and the imports that
  served only the replaced case (`knowledgeDeps`, `nodeDeps`, the `host-core`
  aliases, `ModelRequest`), were removed with the hunks they existed for.
- **tests/test_UAT_FC_REQ-123_session_knowledge.test.ts** — UU, UAT, 3 hunks,
  all INCOMING: the `kmPrimingEntries` import, the five-operation census, and
  the priming case assembled through `assemble`. In its final ordering
  assertion the mechanism is anchored on `KnowledgeSearch` (which both sides
  assert is in the mechanism) rather than incoming's `'The site you look after'`
  literal, because the surrounding manual text is HEAD's here; the claim
  asserted — map, then purpose, then mechanism — is incoming's unchanged.
- **tests/reconciliation-assistant-conversation.test.ts** — UU, test, 2 hunks.
- **tests/reconciliation-draft-change-journal.test.ts** — UU, test, 4 hunks.
- **tests/test_UAT_FC_REQ-131_change_journal.test.ts** — UU, UAT, 3 hunks.
  These three are the BUG-1301 precedence case; see below.

No test function present on either side of any conflict was deleted.

## Incoming changes preserved

Confirmed against `git show 53ede2641f -- <file>` for each code file:

- `ai.ts`, `session-knowledge.ts`, `system-knowledge.ts` — the resolved files
  are identical to incoming's apart from the cleanly-merged earlier free-coded
  work (BUG-55 index keying and its comments) and one retained REQ-157 comment.
  Every incoming hunk is present.
- `host.ts` — incoming's `kmPrimingEntries` call and its BUG-63 comment are
  present, relocated into the `knowledgeDeps` seam main extracted; the
  `import { kmPrimingEntries } from './roles'` incoming added merged cleanly.
- `host-core.ts` — all seven incoming hunks present verbatim.
- `scripted-model-client.ts` — both incoming additions present.
- The three knowledge/priming test files carry incoming's assembly-through-
  `kmPrimingEntries` cases and its widened `ReadKnowledge` pins.

**Hunks dropped under the BUG-1301 precedence exception** — three files
(`reconciliation-assistant-conversation.test.ts`,
`reconciliation-draft-change-journal.test.ts`,
`test_UAT_FC_REQ-131_change_journal.test.ts`) stage with no net change from
HEAD, so this is stated explicitly rather than left to be noticed:

- Incoming's change to them is exactly one kind of edit: replace raw
  `client.seen[i].system` reads with a helper read, because the system prompt
  now reaches the wire as either a string or cache-split blocks.
- HEAD had already removed every one of those raw reads, in
  `12c967de95`/`b12758a877`, replacing them with `modelSaw()` — the same fix
  through a helper that reads `system` AND the message tail, because upstream
  subsequently moved the per-turn reminder onto the turn's tail (library
  REQ-144). The hunks' entire target no longer exists.
- `modelSaw()` is a strict superset of `systemText()`, so incoming's property —
  "no assertion indexes into `request.system` by hand" — holds, and every
  affected assertion is at least as strong: the positive ones match against
  more text, the negative ones (`not.toMatch(/list_changes with since/)`)
  exclude across more text. Restoring `systemText()` at these sites would be a
  narrowing that risks reading the wrong placement.

## Flagged for post-merge review

The enrichment classified all 11 files "intent unknown on one or both sides —
take the more recent commit by timestamp and flag for post-merge review".
Timestamps agreed with the hard rule in every case (incoming 09-07 is newer than
every free-coded HEAD toucher: 09-02..09-05). Two things a reviewer should look
at with a running suite, which this session cannot start:

1. **The `# What exists` / `# How to search` heading assertions are gone** from
   AC1319 on incoming's authority that DOC-22 never renders an entry's `name`.
   Main's automated case asserted those headings against a possibly-newer
   framework pin. If they do still appear, nothing fails — the removed
   assertions were positive ones.
2. **The `ReadKnowledge` pin is a census again** (five named operations) rather
   than main's derive-from-`DECLARATION` form, in both
   `reconciliation-assistant-conversation-knowledge` and `REQ-123`. That is the
   developer's deliberate choice — "this pin is why it was noticed" — and it
   will fail loudly, by design, on the next upstream widening.

## Verification performed

- `grep '^[<=>]\{7\}'` across all `*.ts`: no markers remain.
- `tsc -p apps/control-app/tsconfig.json --noEmit`: 2 errors, both pre-existing
  `templateUid` / `OutgoingMessage` mismatches in `invites.ts` / `sessions.ts`,
  neither in a resolved file.
- `tsc -p tools/generate/tsconfig.json --noEmit`: 10 errors, all pre-existing,
  all in `identity.ts` / `invites.ts` / `names.ts` / `people.ts` / `router.ts` /
  `sessions.ts`; none in a resolved file.
- Parse check over all six edited test files: no `TS1xxx` syntax errors. (Note
  `tests/` is in no tsconfig's `include`, so it is transpiled and not
  type-checked — incoming's own `Toolbox.manual: () => string` versus its
  `box.manual({ level: 'summary' })` call is an inconsistency this commit
  brought with it and was left exactly as the developer wrote it.)
- The suites themselves were not run: `.workers.test.ts` cases cannot start
  workerd in this role, and running the tree is not this step's job.

`git status --porcelain` shows no `UU`/`AA`/`DU`/`UD` entries. The cherry-pick
sequencer is untouched — no `--continue`, `--skip`, `--quit`, `--abort`, reset
or checkout was issued.
