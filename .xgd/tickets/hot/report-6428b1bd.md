---
uid: report-6428b1bd
id: REPORT-4886
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:40:10.135164+00:00'
updated_at: '2026-09-23T23:40:10.135164+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

Incoming commit `ada55fd3` — "refactor(ai): the assistant is a consultant, not a
caretaker [FREE-CODED]" (REQ-174). Every path touched below is inside that
commit's own diff; nothing outside it was staged, added or removed.

- `apps/control-app/src/ai.ts` — UU, code (2c + BUG-1301 precedence). Both hunks
  resolved to HEAD. Net effect is a no-op, so the file no longer appears in
  `git status`. Rationale under "Incoming changes preserved".
- `tools/generate/src/cli/ai/host.ts` — UU, code (2c + BUG-1301 precedence).
  Conflict inside `nodeDeps` resolved to HEAD. The incoming `CONSULTANT_PURPOSE`
  import (line 49) auto-merged and is kept.
- `tools/generate/src/cli/ai/host-core.ts` — UU, code (2c, composed). Six
  conflicts:
  - imports: composed — HEAD's `CONSULTANT_PURPOSE` (re-export source) plus
    incoming's `CONSULTANT_ROLE` / `CONSULTANT_SYSTEM` / `consultantReminder` /
    `LEGACY_ROLE_NAMES`.
  - purpose doc comment + declaration: HEAD's structure kept (declared in
    `./roles`, only re-exported here); renamed to `export { CONSULTANT_PURPOSE }`.
  - `new lib.Role({...})`: HEAD's entry-list API kept (`priming:` / `reminders:`
    with `REMINDER_PROVIDER`), incoming's rename applied to every name and
    constant in it.
  - `new lib.SessionManager(...)`: composed — incoming's `LEGACY_ROLE_NAMES`
    alias map (`named`) is preserved in full, assigned into HEAD's
    `const manager = ...` form because the code below it registers providers on
    `manager` and returns it.
  - `streamPrompt` reminder refresh: resolved to HEAD (BUG-1301 precedence).
  - Incidental renames required by the above and by the new UAT's repo scan:
    `REMINDER_PROVIDER` string, two `caretakerReminder` call sites in
    `reminderFor`, two prose comments.
- `tools/generate/src/cli/ai/roles.ts` — no conflict (auto-merged), edited to
  complete the compose: HEAD had moved the purpose constant into this file, so
  `CARETAKER_PURPOSE` was renamed to `CONSULTANT_PURPOSE` and given incoming's
  new text verbatim ("You advise a client who is not technical…"). Without this
  the rename is half-applied and `test_UAT_FC_REQ-174_..._the_grant_and_the_
  corpus_purpose_are_the_consultants` cannot pass.
- `tests/reconciliation-assistant-conversation-knowledge.test.ts` — UU, test
  (2f + BUG-1301 precedence). The conflict is a local `PURPOSE` constant HEAD had
  already deleted in favour of importing the real constant; incoming only
  reworded its doc comment. Resolved to HEAD, and the file's `CARETAKER_PURPOSE`
  import and four usages renamed to `CONSULTANT_PURPOSE`. No test function was
  added, removed or renamed.
- `tests/reconciliation-page-composition-surface.test.ts` — UU, test (2f,
  composed). HEAD's newer `it(...)` name
  (`test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy`,
  which matches the body's "BOTH halves … the declared meaning of the code"
  assertion) kept, with incoming's `await consultant()` helper rename. No test
  function deleted.
- `tests/reconciliation-assistant-conversation.test.ts` — no conflict
  (auto-merged), one edit: the synthetic transcript header in
  `test_UAT_AC1405_...` hard-coded `role: 'caretaker'`, which the rename
  supersedes and which the new UAT's stale-word scan forbids outside `roles.ts`.
  Changed to `'consultant'`; the test's subject (cross-host transcript replay) is
  unaffected.
- Auto-merged, unchanged by me, staged as they came: `package.json`,
  `tools/generate/src/cli/ai/instances.json` (grant key now `consultant`),
  `toolbox.ts`, `toolbox-core.ts`,
  `tests/reconciliation-assistant-control-surface.test.ts`,
  `tests/reconciliation-beyond-l1-authoring.test.ts`,
  `tests/test_UAT_FC_REQ-{122,126,129,130,157}_*.test.ts`, and the new
  `tests/test_UAT_FC_REQ-174_consultant_role.test.ts`.

No conflict markers remain anywhere under `apps/`, `tools/` or `tests/`; the only
occurrences of the old word left in the repo's own source are the three in
`roles.ts` (`LEGACY_ROLE_NAMES` and the two lines of prose explaining it), which
is exactly the one file the new UAT's scan allows.

## Incoming changes preserved

Confirmed present in the resolved tree:

- `roles.ts`: `CONSULTANT_SYSTEM` (the rewritten advisory preamble),
  `consultantReminder`, `CONSULTANT_ROLE = 'consultant'`, `LEGACY_ROLE_NAMES`,
  and `CONSULTANT_PURPOSE` with incoming's exact new text.
- `host-core.ts`: the rename throughout, and — the substantive new behaviour of
  this commit — the `LEGACY_ROLE_NAMES` alias map registering the one role object
  under every name it has ever been written as, so a session archived under
  `caretaker` still resolves. `createSession` and `aiStatus` both report
  `CONSULTANT_ROLE` alone.
- `instances.json`: the grant key moved to `consultant`.
- `tests/`: every `caretaker()` → `consultant()` helper rename, every
  `roles`-status assertion now expecting `consultant`, and the whole new
  `test_UAT_FC_REQ-174_consultant_role.test.ts` suite.

### Hunks dropped under the BUG-1301 precedence exception

Three of the incoming commit's hunks had their entire target removed by
refactors already integrated into HEAD. They are dropped, not discarded on my
authority:

1. `apps/control-app/src/ai.ts` — `import { CARETAKER_PURPOSE }` and
   `sessionPriming(knowledge, CARETAKER_PURPOSE)`. HEAD's commit
   _"feat(ai): the fidelity surface — the assistant can look, compare and judge"_
   line of work moved ownership of the purpose's POSITION out of the Worker and
   into `host-core.ts`'s entry list: `sessionPriming` in
   `apps/control-app/src/session-knowledge.ts:388` now takes one parameter, and
   the code comment left in place states the reason. Renaming an argument that no
   longer exists is not possible; the rename it carried is applied at the single
   surviving declaration site (`roles.ts`) instead, which is where HEAD put it.
2. `tools/generate/src/cli/ai/host.ts` — the inline knowledge-surface + priming
   block inside `nodeDeps`. HEAD extracted it to the exported `knowledgeDeps()`
   helper (documented at `host.ts:144-156` as "ONE FUNCTION BECAUSE THEY ARE ONE
   DECISION", explicitly so a test can observe the wiring), and in doing so
   stopped passing `rolePurpose` at all — the sequence is declared in
   `host-core.ts`. `nodeDeps` composes it via
   `...(knowledge !== null ? await knowledgeDeps(knowledge) : {})`.
3. `tools/generate/src/cli/ai/host-core.ts` — the `source:` / `reminder:` Role
   fields and the `role.reminder = consultantReminder(...)` mutation in
   `streamPrompt`. HEAD replaced both with REQ-131's provider model: the role is
   built from a frozen `priming` entry list plus a `reminders` provider entry,
   and the per-turn text is resolved by `reminderFor` through
   `REMINDER_PROVIDER`. The comment at `host-core.ts:330-338` records that
   upstream FROZE `Role` deliberately and that "rewriting a field on the role
   object worked only for as long as the manager happened to re-read it" — i.e.
   the incoming form is the API HEAD had to move off, not a change being thrown
   away. The rename the hunks carried is applied to HEAD's equivalents
   (`consultantReminder` in `reminderFor`, `CONSULTANT_SYSTEM`/`CONSULTANT_ROLE`
   in the entry list).

### Known residue outside this commit's diff

`tests/reconciliation-assistant-arrival-notice-budget.test.ts:18` and
`tests/reconciliation-assistant-conversation-continuity.workers.test.ts:338`
still mention the old word in prose comments. Both files are HEAD-only and are
NOT part of `ada55fd3`'s diff, so they were deliberately left untouched and
unstaged per this step's scope rule. They will make
`test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name` report two
offenders until a later step in this resync (or a follow-up) sweeps them; that is
a cross-commit consequence, not an unresolved conflict.
