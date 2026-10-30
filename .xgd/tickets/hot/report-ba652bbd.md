---
uid: report-ba652bbd
id: REPORT-5792
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T12:29:35.937181+00:00'
updated_at: '2026-10-02T12:29:35.937181+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync stage resolution: 7889c0753e (REQ-305 streamed ladder)

Picked commit: `7889c0753e1233017a90f053fc1b1e334f40b1c0`
"feat(publish): stream ladder renditions, and refuse on bytes [FREE-CODED]" (author 2026-09-22 16:44:19 -0700, 11 files).
HEAD `5da018b44a`, apply target `ec118d67626fd31cfce67ca88dc9908ecdde70ed`, retry count 1, `prior_stage_failure` empty.
The session prompt arrived empty; arguments were recovered from `session-r36f21cf3.jsonl` seq 38488.

Six of the eleven files applied cleanly. Five conflicted, one region each. All five are resolved and staged; no unmerged entries remain. HEAD is unmoved and `CHERRY_PICK_HEAD` is intact. No cherry-pick command was run.

## Resolutions

| Path | Class | Outcome |
|---|---|---|
| `tools/generate/src/store/d1r2-store.ts` | 2c step 1 | keep both |
| `tools/generate/src/store/fs-store.ts` | 2c step 1 | keep both |
| `tools/generate/src/store/memory-store.ts` | 2c step 1 | keep both |
| `tools/generate/src/store/site-store.ts` | 2c step 1 | keep both |
| `package.json` | 2g | incoming (`0.2.331`) |

### The four store files

Each conflict is the same `import type { ... } from './revision-model'` list. Ours (the digest fix, "derive the change count without reading asset bytes") added `AssetStamp` and `SiteOutline`; incoming added `RenditionSink`. The edits are independent additions to adjacent lines, so the resolution is the union, kept in the list's alphabetical order:

    AssetStamp, RenditionSink, RevisionContent, RevisionEntry, SiteOutline, StoredSnapshot

(`site-store.ts` never imported `AssetStamp`, so its union omits it.)

Every imported name is exported by the merged `revision-model.ts` and used in the importing file: `RenditionSink` by incoming's `beginRevision`, `AssetStamp`/`SiteOutline` by ours' `draftOutline`/`revisionOutline`.

Diff of each resolution against incoming's `:3:` blob:

- `fs-store.ts`, `memory-store.ts`, `site-store.ts`: additions only (+65, +38, +39), zero removed lines. Every incoming line is present.
- `d1r2-store.ts`: +107 / -4. The four removed lines are the old body of `listKeys`, which ours had already rewritten as a wrapper over its new `listObjects`. Incoming did not change that function, and all five `listKeys` callers still resolve.

### package.json

Only the `version` line differs: base `.326`, ours `.330` (auto-bump for REQ-303), incoming `.331`. Incoming is higher and the bump is part of this pick, so incoming wins. The result is byte-identical to incoming's blob.

The enrichment's rule ("intent unknown, take the more recent commit by timestamp, flag for post-merge review") was not used on any path. Nothing needs post-merge review on these five files: the store conflicts are a pure union and the version conflict is a one-line counter.

## Verification

- `vitest run tests/test_UAT_FC_REQ-305_streamed_ladder.test.ts tests/test_UAT_FC_REQ-222_width_ladder.test.ts`: 2 files, 78 tests, all passed.
- `tsc -p tools/generate/tsconfig.json --noEmit`: no errors in any file this pick touches. Three errors remain, all TS2353 "`templateUid` does not exist in type `OutgoingMessage`" in `apps/control-app/src/invites.ts`, `lead.ts` and `sessions.ts`. Those files and `apps/control-app/src/messages.ts` (which declares the type) are identical to HEAD and outside this pick, so the errors were on the branch before it. Not fixed here; flagged for whoever owns that gap.
- No test was deleted or weakened; the REQ-222 test changes are incoming's own and auto-merged.
- Workers suites were not run (port binding is blocked in this role).
