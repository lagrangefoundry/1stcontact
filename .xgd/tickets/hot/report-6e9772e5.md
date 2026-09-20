---
uid: report-6e9772e5
id: REPORT-4567
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:10:20.499977+00:00'
updated_at: '2026-09-20T23:10:20.499977+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Outcome

`0fe586d1f67c` (*chore(control-app): retain invocation logs [FREE-CODED]*, BUG-37)
**skipped** — recorded via `xgd cherry-pick-skip report-7b4182de`, not bare
`git cherry-pick --skip`, so the resync gate stops counting it as pending.

The commit is a **no-op against HEAD**: every line it adds is already present,
and the only fact it would have changed is a version number HEAD has long since
overtaken. There was no content to carry across, so there was nothing to merge.

## Conflicts presented

| path | index state | resolution |
|---|---|---|
| `apps/control-app/wrangler.toml` | UU | OURS (HEAD) — incoming adds nothing HEAD lacks |
| `package.json` | UU | OURS (HEAD) — `0.2.40` supersedes incoming `0.2.12` |

## Why the commit is empty against HEAD

**`apps/control-app/wrangler.toml` — both blocks already landed.** HEAD carries
`[observability]` (L35–37) and `[env.production.observability]` (L217–219), each
with `enabled = true` and `head_sampling_rate = 1`, under the same explanatory
comments the commit writes. The incoming hunks are byte-identical additions to
text that is already there.

The conflict is therefore **context drift, not a content disagreement**. HEAD
gained a later comment paragraph — `# THE DEPLOYED GATE'S CONFIGURATION…`,
heading `[env.production.vars]` — between the two hunks. The incoming diff's
trailing context expects `# No ACCESS_DEV_OPEN here…` to follow the production
observability table directly; it no longer does, so the three-way merge could not
anchor the hunk and surfaced it. The marked region contains **only that comment
on the HEAD side and nothing on the incoming side** — git was asking whether to
delete a comment the commit predates, not which configuration to keep.

Confirmed mechanically: with both files resolved to OURS, `git diff HEAD` and
`git diff --cached HEAD` are both empty. Resolving this cherry-pick to HEAD *is*
HEAD.

**`tests/test_UAT_FC_BUG-37_observability.test.ts` — identical, never conflicted.**
`git diff HEAD 0fe586d1f6` over that path is empty; the file already exists in
HEAD in exactly the incoming form.

**`package.json` — the one real difference, and it resolves on the version axis.**
Incoming bumps `0.2.11 → 0.2.12`. HEAD is at `0.2.40`, twenty-eight releases past
it. Version is a single-value field whose later write wins, so OURS is taken —
the same call made for `fields.version` in REPORT-4566 on this run. The commit
touches nothing else in this file.

## Verification that skipping loses nothing

The commit's own acceptance test was run against HEAD after resolution:

```
npx vitest run tests/test_UAT_FC_BUG-37_observability.test.ts
Test Files  1 passed (1)
     Tests  4 passed (4)
```

All four UATs pass — `observability_is_declared_at_both_levels`,
`every_invocation_is_sampled`, `the_production_route_survives_the_new_table`,
and `observability_declares_no_binding`. The third is the load-bearing one: it
*parses* the TOML rather than text-matching it, and asserts `routes` is still a
bare key of `[env.production]` — precisely the silent breakage the commit message
records as having been made and caught during the original change. It passes, so
the production route survived the table HEAD already contains.

BUG-37's intent — per-invocation logs retained, unsampled, at both declaration
levels, with the production route intact — is satisfied on HEAD without this
commit. Skipping forfeits no behaviour and no coverage.

(Test output also carried `EPERM` noise from wrangler attempting to write
`~/Library/Preferences/.wrangler/logs/…`, blocked by the sandbox. It is emitted
by the config parser's import, is unrelated to every assertion above, and did not
affect the result.)
