---
uid: report-f460aee7
id: REPORT-4885
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:32:17.431206+00:00'
updated_at: '2026-09-23T23:32:17.431206+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

All five conflicts were **UU on code files (2c)** between the same two intents:
HEAD carries a later structural refactor of the AI host (REQ-131's provider-based
reminder, REQ-158's hoist of the role purpose into `roles.ts`, `knowledgeDeps`
extraction in `host.ts`, `sessionPriming(knowledge)` losing its purpose argument);
the incoming commit `ada55fd336` is the caretaker→consultant rename plus REQ-174's
legacy-alias read path. The two are **disjoint in substance**, so every hunk was
composed rather than won: HEAD's structure kept, incoming's renames and new
behaviour applied onto it.

- `tools/generate/src/cli/ai/host-core.ts` — UU, 6 hunks, 2c.
  - import list: composed — `CONSULTANT_PURPOSE`, `CONSULTANT_ROLE`,
    `CONSULTANT_SYSTEM`, `consultantReminder`, `LEGACY_ROLE_NAMES` from `./roles`.
  - purpose docblock + export: HEAD's "declared in `./roles`, only re-exported
    here" rationale kept (it describes the current structure); symbol renamed →
    `export { CONSULTANT_PURPOSE }`.
  - `lib.Role({...})`: HEAD's `priming:`/`reminders:` shape kept (incoming's
    `system:`/`source:`/`reminder:` shape predates REQ-131); incoming's renames
    applied — `CONSULTANT_ROLE`, `CONSULTANT_SYSTEM`, entries `consultant` /
    `consultant-reminder`.
  - `SessionManager`: **incoming's REQ-174 `named` alias map adopted whole**
    (`{[CONSULTANT_ROLE]: role}` plus every `LEGACY_ROLE_NAMES` key onto the same
    object), rebound to HEAD's `const manager = …` so the provider registrations
    that follow still run.
  - `streamPrompt` reminder block: HEAD's empty side — see the precedence note.
- `tools/generate/src/cli/ai/host.ts` — UU, 1 hunk, 2c. HEAD's empty side; see
  the precedence note.
- `apps/control-app/src/ai.ts` — UU, 2 hunks, 2c. HEAD's side for both; see the
  precedence note. Resolution is byte-identical to HEAD, so the file carries no
  staged diff.
- `tests/reconciliation-assistant-conversation-knowledge.test.ts` — UU, 1 hunk,
  2c/2f. HEAD deleted the local `PURPOSE` literal when it hoisted the real
  constant into `roles.ts` and imported it; incoming only reworded that literal's
  doc comment. HEAD's deletion kept, and the import + its four assertions renamed
  to `CONSULTANT_PURPOSE`. **No test function was removed.**
- `tests/reconciliation-page-composition-surface.test.ts` — UU, 1 hunk, 2f.
  Non-overlapping edits to one `it(...)` line, so both kept: HEAD's renamed case
  `test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy`
  **and** incoming's `await consultant()` helper. **No test function was removed.**

### Supporting files (not conflicted, edited to keep the resolution compiling)

The rename crosses files that merged cleanly only because one side had never seen
them. Left alone, the tree would not build and the commit's own new UAT would fail:

- `tools/generate/src/cli/ai/roles.ts` — the definition site HEAD hoisted the
  purpose into, which incoming could not rename because it never saw the hoist.
  `CARETAKER_PURPOSE` → `CONSULTANT_PURPOSE`, **carrying incoming's rewritten
  text verbatim** ("You advise a client…form a view, act on it, and explain it
  plainly"). Without this, `host-core.ts` imports a symbol that does not exist.
- `apps/control-app/src/system-knowledge.ts`,
  `tests/reconciliation-assistant-conversation.test.ts` (`role: 'consultant'`),
  `tests/reconciliation-assistant-conversation-continuity.workers.test.ts`,
  `tests/reconciliation-assistant-arrival-notice-budget.test.ts`, and the
  `REMINDER_PROVIDER` key / two comments in `host-core.ts` — stale occurrences of
  the old word in HEAD-side text the incoming commit never saw. Incoming's own
  `test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name` walks the repo
  and asserts the word survives in `roles.ts` alone, so these are the rename's
  declared scope, not editorial drift.

## Incoming changes preserved

Verified against `git show ada55fd3364b15ea3a102ec38f40a405aa619cdf -- <file>`:

- **The rename reaches everything the commit named.** `CONSULTANT_ROLE`,
  `CONSULTANT_SYSTEM`, `consultantReminder`, `CONSULTANT_PURPOSE` and the
  `consultant` grant key are live in `host-core.ts`, `roles.ts`,
  `instances.json`; a repo-wide case-insensitive sweep for the old word returns
  `roles.ts` only — exactly what the commit's own scan requires.
- **REQ-174's legacy alias is present in full**, comment and all: the `named` map
  registers every `LEGACY_ROLE_NAMES` entry onto the same role object, so an
  archived session still resolves, while `createSession` and `aiStatus` still
  name `CONSULTANT_ROLE` alone.
- **The rewritten purpose text is the one in the tree** — it no longer says "look
  after" and does say "advise", which is what
  `test_UAT_FC_REQ-174_the_grant_and_the_corpus_purpose_are_the_consultants`
  asserts.
- **Executed, not just read.** `tests/reconciliation-assistant-conversation-knowledge.test.ts`
  passes 4/4 — it asserts the priming document contains `CONSULTANT_PURPOSE` and
  that it sits between the corpus map and the search section, which exercises the
  renamed entry list in `host-core.ts` end to end.
  `tests/reconciliation-assistant-arrival-notice-budget.test.ts` passes 2/2.
  `tests/reconciliation-page-composition-surface.test.ts` passes 10/10 of the
  cases that ran, including the AC1090 hunk resolved above; its final `describe`
  fails in `beforeAll` on `startBuilder` timing out, which is this sandbox
  refusing to bind a socket and is unrelated to the resolution.

### Hunks dropped under the BUG-1301 precedence exception

Three incoming hunks had their entire target removed by refactors already
integrated into HEAD. In each case the incoming hunk's *only* content was the
caretaker→consultant rename, and **that rename is preserved at the code's new
location** — nothing of the developer's change is lost.

- `tools/generate/src/cli/ai/host-core.ts`, `streamPrompt`'s per-turn reminder
  block. Removed by HEAD's REQ-131 refactor, which turned the reminder from a
  per-turn mutation of `role.reminder` into a registered provider. HEAD states it
  in the surviving comment at the conflict site — *"the comparison itself is NOT
  here: it lives in {@link reminderFor}"* — and `reminderFor` holds the whole
  relocated block (delta, baseline, counter). Incoming's
  `caretakerReminder` → `consultantReminder` was applied there instead.
  Legitimate: a documented, ticketed restructure with the logic demonstrably
  intact at its new home, not a deletion of convenience.
- `tools/generate/src/cli/ai/host.ts`, the inline knowledge block in `nodeDeps`.
  Extracted by HEAD into the exported `knowledgeDeps(knowledge)` helper, whose
  own docblock gives the reason (*"ONE FUNCTION BECAUSE THEY ARE ONE
  DECISION… lets a test observe the wiring the host actually uses"*). The same
  refactor moved KM's priming to a pair of named providers, so `rolePurpose` is
  no longer passed here at all — the purpose is sequenced in `host-core.ts`'s
  entry list, where incoming's `CONSULTANT_PURPOSE` now sits.
- `apps/control-app/src/ai.ts`, `sessionPriming(knowledge, CARETAKER_PURPOSE)`.
  The same relocation on the Worker side: `sessionPriming` in
  `session-knowledge.ts` now takes one argument, and HEAD's comment at the
  conflict site says so — *"The role's purpose is no longer passed in:
  `host-core.ts` owns where it sits between the map and the manual."* Keeping
  incoming's call would be a two-argument call to a one-argument function.

No UAT function present on either side of any conflict was deleted, and no
incoming code change was discarded.
