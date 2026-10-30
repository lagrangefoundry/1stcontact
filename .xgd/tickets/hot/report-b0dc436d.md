---
uid: report-b0dc436d
id: REPORT-5800
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T13:32:33.156176+00:00'
updated_at: '2026-10-02T13:32:33.156176+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — pick `a7d3748444` (REQ-307 durable junction)

- Branch: `resync-377b581e`, HEAD `9e01c6b497` (unmoved), `CHERRY_PICK_HEAD` `a7d374844450b7713957d5d08c8e74fffe2b25c4`
- Pick: `feat(junction): keep a turn's records in a Durable Object [FREE-CODED]` (author 2026-09-23 11:14:17 -0700, 14 files)
- Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- Retry count 1, `prior_stage_failure` empty.
- Session prompt arrived empty; arguments recovered from `session-r36f21cf3.jsonl` (seq 42367).

## Outcome

All three conflicted paths resolved and staged. 11 other pick files applied cleanly and
are untouched. Staged path set == the pick's own diff (14 paths, nothing outside it).
No conflict markers remain. Cherry-pick left in progress for finalize.

| Path | Class | Resolution |
|---|---|---|
| `package.json` | 2g scalar | INCOMING (`0.2.340`) |
| `apps/control-app/wrangler.toml` | 2c, 1 region | keep BOTH |
| `tests/reconciliation-builder-workspace-origin.test.ts` | 2c/2f, 1 region | ours in the region; incoming's other hunk landed |

## Per file

### package.json — incoming
Base `.334` / ours `.339` / theirs `.340`; both `base→side` diffs are the single
`version` line. Incoming is the higher counter value (ours + 1), so `--theirs`.
The developer's own merge (`a3ba0da8d4`, "Merge branch 'free-REQ-307' into
xgd-working") conflicted on this same line and nothing else.

### apps/control-app/wrangler.toml — keep both
One region, at EOF: both sides append a block after `[env.production.ai]`.
Ours appends `[env.production.images]` (REQ-222); theirs appends
`[[env.production.durable_objects.bindings]]` + `[[env.production.migrations]]`
(REQ-307). Non-overlapping appends, so both kept, ours first. Incoming's top-level
`[[durable_objects.bindings]]` / `[[migrations]]` block and its comment auto-merged.

Evidence: `git diff <ours blob> -- wrangler.toml` is exactly incoming's 53 added lines
(the top-level block and the production block) and no removals — every incoming line
is present, no HEAD line was dropped.

### tests/reconciliation-builder-workspace-origin.test.ts — ours in the region
Incoming's change to this file is two one-line edits: both `unstable_dev(...)` calls
switch entry from `src/index.ts` to `src/worker.ts` (plus a comment), because wrangler
resolves the DO `class_name` against the entry module.

- The second call (`origin failure reporting`, AC-965) exists on HEAD and auto-merged:
  it now mounts `worker.ts` with incoming's comment.
- The first call (`control-app front` `beforeAll`) does not exist on HEAD. HEAD's
  describe drives the Worker's `fetch` in-process (`controlWorker` + `workerEnv()`),
  a shape introduced by main-only commit `7a17bd8cd9` ("Workflow fix_uat_validation
  completed", 09-10) and never present on xgd-working, including at the apply target.
  Git offered incoming's whole `beforeAll` body as the conflict. Taking it would
  reference `worker`, `builder`, `applyLocalD1Schema` and `seedIdentity`, none of which
  is declared or imported in HEAD's file — it would not compile, and nothing in the
  describe would use the mounted worker.

So the region keeps HEAD's (empty) side: incoming's edit there has no call to apply
to. No test function was added, removed or renamed. Net change to the file vs HEAD is
exactly incoming's AC-965 hunk (+2/−1).

This is not a "main only" resolution of the file — incoming's change lands everywhere
its target exists — but the underlying harness divergence is flagged below.

## Verification

- `vitest run tests/test_UAT_FC_REQ-307_wrangler_binding.test.ts` — 4/4 pass.
- `tsc -p apps/control-app/tsconfig.json --noEmit` and `tsc -p tools/generate/tsconfig.json --noEmit`
  — only the 3 `templateUid` / `OutgoingMessage` errors already on the branch
  (`invites.ts`, `lead.ts`, `sessions.ts`); nothing in any pick file.
- NOT run: `reconciliation-builder-workspace-origin.test.ts`, `req115-builder-shell.test.ts`
  and `test_UAT_FC_REQ-307_durable_junction.workers.test.ts`. They need `unstable_dev` /
  workerd, which cannot bind a port in this role's sandbox (`listen EPERM`).

## Flags for post-merge review

1. **`wrangler.toml` is not strictly valid TOML on this branch — pre-existing, not
   introduced here.** HEAD already declares `[images]` twice (lines 383 and 433) and
   `[env.production.images]` twice (508 and 516); Python's `tomllib` rejects both HEAD's
   blob and the resolved file with "Cannot declare ('images',) twice". xgd-working
   de-duplicated these in merge commit `12fabc0ed0` ("REQ-222: merge xgd-working; the
   ladder rides REQ-219's one renderer"), which resync does not pick. The resolved file
   keeps HEAD's form outside the pick's scope; the duplicate needs removing for wrangler
   to load this config, which matters more now that two suites mount it via `worker.ts`.
2. **Test-harness divergence in `reconciliation-builder-workspace-origin.test.ts`.**
   HEAD's `control-app front` leg is main's in-process harness; xgd-working's is
   `unstable_dev`. HEAD imports the handler from `src/index`, so that leg does not
   exercise the `worker.ts` entry REQ-307 wants the suites to mount.
3. HEAD's `wrangler.toml` also differs from xgd-working outside this pick (empty
   top-level `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` and their comment blocks) — untouched.
4. Next incoming commit on this path: `c8f7b28f8a` "chore(junction): bump version for
   the durable-junction change" — expect a `package.json` version-line conflict only.
