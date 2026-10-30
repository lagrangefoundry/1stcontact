---
uid: report-60a23cdc
id: REPORT-5832
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T22:42:22.980224+00:00'
updated_at: '2026-10-02T22:42:22.980224+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — REQ-355 `ee7ebbde84`

**Picked commit:** `ee7ebbde847667518208c239e67c4baabbb50df7` — feat(ai): the builder can search the platform reference [FREE-CODED]
**HEAD at resolution:** `eec1a8c3f8`
**Apply target:** `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
**prior_stage_failure:** empty (first attempt)

## Conflict

One `UU` path, two regions: `tools/generate/src/cli/ai/host.ts`
(base `6f8704686d` / ours `7651f555b6` / theirs `e52b281f15`). The other eight
pick paths applied cleanly.

## Cause

Ours carries a refactor that is not on incoming: `nodeDeps`'s inline
`if (knowledge !== null) { … }` block was extracted into an exported
`knowledgeDeps(knowledge)` (plus `setKnowledgeRoot`, `export nodeDeps`), spread
into the return as `...(knowledge !== null ? await knowledgeDeps(knowledge) : {})`.
Incoming edits the inline block that ours removed: it adds
`let workerKnowledge = null`, assigns
`workerKnowledge = builderKnowledge(bridge, () => knowledge, SYSTEM_KB)` inside
the block, and adds `workerKnowledge` to the returned deps.

The developer's own merge `61633fbd6f` (`Merge branch 'free-REQ-355' into
xgd-working`, second parent == the pick) did not conflict here: its `host.ts`
blob is the pick's blob `e52b281f15`, merge^1 is the base blob `6f8704686d`, and
the apply target still holds `e52b281f15`. So `knowledgeDeps` exists only on this
branch and there is no merge blob to take — the resolution keeps both sides.

## Resolution

Kept HEAD's `knowledgeDeps` shape and carried incoming's change into it:

- import: `builderKnowledge` added beside `registerCorpusProviders` (auto-merged).
- `knowledgeDeps` return type widened to
  `Pick<HostDeps, 'extraSurfaces' | 'priming' | 'workerKnowledge'>`, and it now
  returns `workerKnowledge: builderKnowledge(bridge, () => knowledge, SYSTEM_KB)`
  with incoming's REQ-355 comment verbatim.
- `nodeDeps` return: `workerKnowledge: null` added to the defaults that the
  `knowledgeDeps` spread overwrites — the same no-KB value incoming's `let`
  produced.
- Incoming's re-added inline block and its `extraSurfaces,` return entry were
  dropped: they duplicate what `knowledgeDeps` already builds.

Net change to `host.ts` vs HEAD is +7/-2. Behaviour matches incoming: with a KB
the Node host passes surface, priming and worker knowledge from one bridge; with
none, all three are empty/null.

Not touched: `knowledgeDeps`'s docblock still describes "the surface, and the
priming" as a pair. It now returns three things; worth a wording pass post-merge.

## Checks

- No staged path outside the pick's diff (`comm -23 staged pick` empty); 9 staged
  paths == the pick's 9 paths.
- `git diff --stat ee7ebbde84 61633fbd6f -- <9 pick paths>` is empty: the merge
  rewrote no pick file. Staged-vs-merge differences on `ai.ts`,
  `session-knowledge.ts`, `host-core.ts`, `roles.ts` mirror
  `git diff --stat HEAD 61633fbd6f^1` (5 / 29 / 28 / 34 lines), i.e. pre-existing
  branch drift, left alone.
- `package.json`: applied cleanly, `0.2.419` → `0.2.420`.
- `tsc -p tools/generate/tsconfig.json --noEmit`: 4 errors, none in a pick file —
  `templateUid` not in `OutgoingMessage` (`apps/control-app/src/invites.ts:275`,
  `lead.ts:1136`, `sessions.ts:455`) and `Cannot find module 'miniflare'`
  (`tools/generate/src/fonts/seed.ts:66`). No error in `host.ts`, `host-core.ts`,
  `roles.ts`, `ai.ts` or `session-knowledge.ts`.
- `tests/test_UAT_FC_REQ-355_builder_priming_config.test.ts`: 4/4 pass.
- `tests/test_UAT_FC_REQ-355_builder_reads_the_platform_reference.workers.test.ts`:
  NOT RUN — workers suites cannot bind a port in this role (`listen EPERM`).

## Flag for post-merge review

- `tools/generate/src/cli/ai/host.ts` — hand-integrated (no merge oracle); run the
  REQ-355 workers suite in an interactive role.
- The four pre-existing tsc errors above are on files this pick does not touch.
