---
uid: report-a2fa5cf8
id: REPORT-5527
type: report
title: 'Resync resolve conflicts: ada55fd336 (REQ-174 consultant rename)'
created_by: xgd
created_at: '2026-09-29T09:50:52.888101+00:00'
updated_at: '2026-09-29T09:50:52.888101+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Five **UU** conflicts, all on code files, all governed by rule **2c** (incoming is
authoritative; non-overlapping changes keep BOTH; overlapping changes integrate).

The incoming commit `ada55fd336` — *"refactor(ai): the assistant is a consultant,
not a caretaker [FREE-CODED]"*, 2026-09-02, Martin Westhead — is a **rename plus a
register rewrite**: `CARETAKER_*` → `CONSULTANT_*` across the role's name, grant
key, system preamble, per-turn reminder and knowledge-priming purpose, plus a new
`LEGACY_ROLE_NAMES` read-path alias so archived sessions still reopen.

Main has since landed a **structural refactor of the same region** (REQ-131 /
REQ-158 / REQ-160): the purpose constant moved from `host-core.ts` into `roles.ts`
and is only re-exported; the `Role` moved from the old `{system, source, reminder}`
shape onto `{priming: Entry[], reminders: Entry[]}` with a registered reminder
*provider*; `sessionPriming` lost its purpose parameter; and node's inline priming
assembly became `knowledgeDeps()`.

**The two are orthogonal — a rename and a move — so both were kept.** Every
resolution below is HEAD's structure carrying incoming's names and text. No hunk
was resolved by taking main's version alone.

- `tools/generate/src/cli/ai/host-core.ts` — **UU**, 6 conflict regions, rule 2c.
  - *imports*: HEAD's four `CARETAKER_*` imports renamed to `CONSULTANT_*` **and**
    incoming's `LEGACY_ROLE_NAMES` added. Both sides' import lists merged, not
    chosen between.
  - *purpose doc comment*: HEAD's paragraph ("DECLARED IN `./roles` AND ONLY
    RE-EXPORTED HERE"). Incoming's paragraph differs from its own base by one
    word — `caretaker` → `consultant` — and that word does not occur in HEAD's
    replacement text, so nothing of incoming's is lost. The surviving unconflicted
    line above it already reads "What the **consultant** is here to do", taken
    from incoming by the auto-merge.
  - *purpose declaration*: `export { CONSULTANT_PURPOSE }` — HEAD's re-export
    **form**, incoming's **name**. The declaration itself (and incoming's rewritten
    text) went to `roles.ts`, where HEAD moved it. See that file below.
  - *`Role` construction*: HEAD's `priming`/`reminders` entry shape carrying
    `CONSULTANT_ROLE`, `CONSULTANT_SYSTEM` and `consultant`-prefixed entry names.
    Incoming's `system:` / `source:` / `reminder:` fields are the pre-refactor API
    and were dropped as **form**, not as content: all three of its REQ-174 deltas
    in that block (the name, the system text, the reminder function) are present.
  - *`SessionManager` construction*: incoming's `LEGACY_ROLE_NAMES` aliasing block
    kept **verbatim**, including its comment, spliced into HEAD's
    `const manager = ...` form (HEAD needs the binding to register providers on
    lines below before `return manager`; incoming returned directly). This is the
    load-bearing new behaviour of the commit and it survives intact.
  - *`streamPrompt` reminder mutation*: HEAD (the block is gone). Incoming's delta
    here was `caretakerReminder` → `consultantReminder` on two lines of a mutation
    HEAD deleted when it moved the reminder to a provider; the same rename was
    applied instead at its new home, `reminderFor()` (lines 683/685), which is
    where those two calls now live.
  - Renames also applied to the HEAD-side code the conflict markers did not cover,
    because `roles.ts` no longer exports the old symbols and the file would not
    compile otherwise: `CARETAKER_ROLE`/`CARETAKER_SYSTEM`/`CARETAKER_PURPOSE`/
    `caretakerReminder` at their HEAD-side call sites, the `REMINDER_PROVIDER`
    registry key (`'caretaker.reminder'` → `'consultant.reminder'`, symmetric and
    host-local), the four `Entry` label strings, and two prose comments.

- `tools/generate/src/cli/ai/host.ts` — **UU**, 1 region, rule 2c. Took HEAD: the
  inline `extraSurfaces`/`priming` block incoming edits was replaced by
  `knowledgeDeps()` (line 157), and `knowledgeDeps` no longer passes `rolePurpose`
  at all — `host-core.ts` owns that sequence now. Incoming's only delta in the
  block was `CARETAKER_PURPOSE` → `CONSULTANT_PURPOSE`; the same rename on the
  import at line 49 auto-merged and is present.

- `apps/control-app/src/ai.ts` — **UU**, 2 regions, rule 2c. Took HEAD both times.
  Incoming adds `import { CONSULTANT_PURPOSE }` and passes it as
  `sessionPriming(knowledge, CONSULTANT_PURPOSE)`; HEAD's
  `apps/control-app/src/session-knowledge.ts:388` now declares
  `sessionPriming(knowledge: SessionKnowledge)` — **one parameter**. Incoming's
  second argument has no parameter to bind to; taking it would be a type error.
  The rename it carries is preserved where the constant actually lives.

- `tests/reconciliation-page-composition-surface.test.ts` — **UU**, 1 region,
  rule 2c (UAT-adjacent; 2f consulted, no test function deleted). Integrated both:
  HEAD's widened test name
  (`..._carries_the_code_the_field_and_a_recovery_strategy`) with incoming's
  renamed helper (`await consultant()`). The other 11 `caretaker()` → `consultant()`
  call sites in this file auto-merged.

- `tests/reconciliation-assistant-conversation-knowledge.test.ts` — **UU**,
  1 region, rule 2c. Took HEAD: HEAD deleted the local `PURPOSE` string literal and
  replaced it with a real import of the constant from `roles.ts` (line 41), which
  is strictly stronger — it asserts against the value the host actually primes with
  rather than a hand-copied sentence. Incoming's delta on that const was its doc
  comment's `caretaker` → `consultant`; the const is gone, the rename is carried by
  the import, which was renamed to `CONSULTANT_PURPOSE` along with its four uses.
  **No test function was removed on either side** — the four assertions at
  lines 460-465 are untouched apart from the identifier.

- `tools/generate/src/cli/ai/roles.ts` — **not marked UU**; edited as part of this
  same resolution and re-staged. Git auto-merged it into an **inconsistent** state:
  incoming's renames landed (`CONSULTANT_SYSTEM`, `consultantReminder`,
  `CONSULTANT_ROLE`, `LEGACY_ROLE_NAMES`) *beside* HEAD's newly-moved
  `CARETAKER_PURPOSE`, because HEAD added that declaration at a line incoming never
  touched. The two edits are textually disjoint, so git saw no conflict — but the
  **logical** conflict is the same one the five UU files carry, and leaving it
  would have silently discarded incoming's rewritten purpose text, which is
  developer-authored content this commit exists to land. Renamed to
  `CONSULTANT_PURPOSE` and given incoming's text verbatim.

## Incoming changes preserved

Every hunk of `ada55fd336` is accounted for. Confirmed against
`git show ada55fd336` and by grepping the resolved tree.

| incoming delta | where it is now |
|---|---|
| `CARETAKER_SYSTEM` → `CONSULTANT_SYSTEM` + rewritten preamble | `roles.ts:48`, used at `host-core.ts:577` |
| `caretakerReminder` → `consultantReminder` + rewritten lines | `roles.ts:136`, called at `host-core.ts:683,685` |
| `CARETAKER_ROLE` → `CONSULTANT_ROLE` (`'consultant'`) | `roles.ts:192`, used at `host-core.ts:576,624,723,892` |
| `LEGACY_ROLE_NAMES = ['caretaker']` | `roles.ts:213`, consumed at `host-core.ts:625` |
| purpose rename **and** new advisory text | `roles.ts:184`, re-exported `host-core.ts:306` |
| `instances.json` key `caretaker` → `consultant` | auto-merged, staged |
| `L1_INSTANCES.consultant` grant references | `toolbox-core.ts` auto-merged, staged |
| new UAT suite `test_UAT_FC_REQ-174_consultant_role.test.ts` (296 lines) | staged as `A`, unmodified |
| rename across 8 other test files | auto-merged, staged |

The incoming commit's own UAT suite is the specification this resolution was
checked against, and it is the reason the rename was carried into HEAD-side code
rather than stopped at the conflict markers:

- `host-core.ts` must export `CONSULTANT_PURPOSE` (line 7 of the suite) — it does,
  as a re-export.
- `CONSULTANT_PURPOSE` must not match `/caretaker|look after/i` and must match
  `/advise/i` (line 196-197) — satisfied only by moving incoming's **text**, not
  just its name, into `roles.ts`.
- `L1_INSTANCES` keys must equal `[CONSULTANT_ROLE]` (line 191) — satisfied by the
  auto-merged `instances.json`.
- A session archived under `"role": "caretaker"` must reopen (line 204-253) —
  satisfied by the `LEGACY_ROLE_NAMES` block kept verbatim in `host-core.ts`.
- No source file outside `roles.ts` may contain the word `caretaker` (line 259-295)
  — satisfied for all five conflicted files; four unrelated files still carry it,
  flagged below.

**No hunk was dropped under the BUG-1301 precedence exception.** Three incoming
hunks had their *form* superseded by HEAD's refactor (`ai.ts`'s second
`sessionPriming` argument, `host.ts`'s inline priming block, `host-core.ts`'s
`streamPrompt` reminder mutation), but in each case the hunk's *content* — the
rename — was relocated to where HEAD moved the code, not discarded. Nothing was
resolved by taking main's version alone, and no test function present on either
side was deleted.

## Verification

- `git ls-files -u` — empty. No unmerged stages.
- `git grep --cached -e '^<<<<<<< ' -e '^>>>>>>> '` — no matches anywhere in the
  index.
- `git status --porcelain` — 18 staged entries, no conflict class (`UU`/`AA`/`DU`/
  `UD`/`AU`/`UA`) on any line. `apps/control-app/src/ai.ts` correctly drops off the
  list: both its hunks resolved to HEAD, so the staged blob equals HEAD's.
- Symbol sweep: `grep -rn 'CARETAKER\|caretakerReminder'` over `apps/`, `tools/`,
  `tests/`, `packages/` (excluding `generated/`) returns **zero** identifier
  references. The only surviving `CARETAKER` token is the word inside `roles.ts`'s
  own prose and the `LEGACY_ROLE_NAMES` string, which is the one deliberate
  survivor.
- Wiring re-read end to end: `CONSULTANT_PURPOSE` is declared once
  (`roles.ts:184`), re-exported once (`host-core.ts:306`), imported by the new UAT
  suite from `host-core` and by the knowledge suite from `roles` — both resolve.
- `CHERRY_PICK_HEAD` still live at `ada55fd3364b15ea3a102ec38f40a405aa619cdf`. No
  `--continue` / `--skip` / `--quit` / `--abort`, no `git commit`, no `reset`, no
  `checkout <branch>`. The only index writes were six `git add` calls, each issued
  as the sole content of its own Bash call.
- This pick is **not** a no-op: `git diff --cached --stat HEAD` reports 18 files,
  518 insertions, 158 deletions. `resync_cherry_pick_finalize_resolution` should
  commit rather than skip.
- Not verified: no typecheck or test run. There is no `typecheck` script in
  `package.json` and resync does not run the suite (`MUST NOT run test_fix`). The
  compile-level claims above rest on the symbol sweep and on reading every call
  site, not on `tsc`.

## Post-merge review flag

**Four files still carry the word `caretaker`, and the incoming suite's final case
will fail on them.** None is part of this conflict — all four are main-side content
written after `ada55fd336`, so the developer's commit could not have renamed them,
and authoring the fix here would be outside a resolution's remit:

- `apps/control-app/src/system-knowledge.ts:192` — prose comment.
- `tests/reconciliation-assistant-conversation-continuity.workers.test.ts:338` —
  prose comment.
- `tests/reconciliation-assistant-arrival-notice-budget.test.ts:18` — prose comment
  naming `caretakerReminder`, a function that no longer exists under that name.
- `tests/reconciliation-assistant-conversation.test.ts:648` — `role: 'caretaker'`
  in a hand-written transcript fixture for AC1405. This one still *works* (that is
  exactly what `LEGACY_ROLE_NAMES` is for) but it trips the same scan.

`test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name` will report all four
as offenders. Three are one-word comment edits; the fourth wants a decision about
whether AC1405's fixture should assert the legacy path deliberately (in which case
the scan needs an allowance) or move to the new name. A four-line change, but it is
authoring, and it belongs to whoever reviews this bundle.

Second, smaller: `tools/generate/src/cli/ai/host.ts:49` imports
`CONSULTANT_PURPOSE` and no longer uses it — `knowledgeDeps()` stopped passing
`rolePurpose` when main moved the sequencing into `host-core.ts`. The dead import
is **pre-existing on HEAD** (it imported `CARETAKER_PURPOSE` and did not use it
either); this resolution renamed it rather than removing it, so the state is
unchanged, not worsened. Worth deleting in a cleanup pass.

Third, for the record: the surviving doc comment at `host-core.ts:293-305` is a
blend — its first line came from incoming through the auto-merge, its body from
HEAD through this resolution. It reads coherently, but the tail sentence ("workerd
reads it from `./roles` in `apps/control-app/src/ai.ts`") is stale on HEAD's own
terms: since `sessionPriming` lost its purpose parameter, `ai.ts` reads it from
nowhere. Pre-existing staleness in main's comment, not introduced here.

## Note on the invocation

The rendered prompt body arrived **empty** — only the
`## Session Role: STAGE_RESOLVER` preamble, with no mission text and no
`{resync_worktree_path}`, `{anchor_uid}`, `{apply_target}`, `{conflict_enrichment}`
or `{prior_stage_failure}` substitutions. Consistent with the four prior
occurrences recorded in `.xgd/tmp/resolve-377b581e-f929d426eb-addendum.md`; this
makes at least five in a row, so it is systematic rather than incidental and is
worth fixing at the prompt-rendering layer.

Policy was recovered by reading
`xgd_source/prompts/validation/resync_stage_resolution.yaml` and
`xgd_source/cli/workflows/definitions/resync_stage_resolution.yaml` directly. The
anchor was identified as `report-377b581e` (REPORT-5124, `report_kind:
resync_run`). `apply_target` could not be recovered — it is not recorded on the
anchor — so this report is titled by the conflicting commit instead; the workflow's
`done` exit condition keys on `subject_uid` and `result`, not on the title.
`conflict_enrichment` was unavailable, so the judgements above rest entirely on
repository evidence: the three-way index stages, `git diff <base> <side>` for each
file, and the incoming commit's own UAT suite.
