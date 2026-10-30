---
uid: report-30be3c30
id: REPORT-5551
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T13:29:26.008344+00:00'
updated_at: '2026-09-29T13:29:26.008344+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, §2g config file. One conflicted
  region, the top-level `[vars]` block. The two sides are NOT competing:
  - Incoming (`164e51cba7`) adds exactly one line there,
    `MAIL_FROM = "no-reply@1stcontact.io"`. Its diff shows
    `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` as unchanged CONTEXT lines — it did
    not touch them; it inherited the merge base's real values.
  - HEAD emptied those two, deliberately, in a commit already cherry-picked
    onto this resync branch. The emptying is documented in the file's own
    (unconflicted, HEAD-side) comment at lines 109–116 and pinned by
    `test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev`:
    it asserts `values.get(key) === ''` for both keys in the top-level block,
    and asserts exactly ONE `ACCESS_AUD = "<64 hex>"` line in the whole file.
  Resolved by keeping BOTH: HEAD's empty `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD`
  plus incoming's `MAIL_FROM`. The `[env.production.vars]` half of incoming's
  change (its own `MAIL_FROM` line plus comment) and the 26-line MAIL_FROM
  rationale comment above `[vars]` auto-merged and were left as git produced
  them. Taking incoming's values for the two ACCESS scalars would have been a
  revert of a later free-coded decision and would fail the REQ-145 UAT twice
  over.

- `package.json` — UU, §2g config scalar, `version` only. Kept HEAD's
  `0.2.89` over incoming's `0.2.87`. **Deviation from 2g's "incoming wins"**
  — see below. The resolved file is byte-identical to HEAD, so `package.json`
  no longer appears in `git status --porcelain`; that is expected, not a
  missed stage.

Auto-merged, no conflict, staged as cherry-pick left them: `MAIL.md`,
`src/mail.ts`, `src/people.ts`, `src/router.ts`,
`bin/deploy.d/secrets/20-resend-api-key`, `bin/deploy.d/secrets/README.md`,
`tests/support/secret-hook.ts`, `tests/test_UAT_FC_REQ-149_deploy_secret_hook.test.ts`,
`tests/test_UAT_FC_REQ-196_mail.workers.test.ts`,
`tests/test_UAT_FC_REQ-196_mail_configuration.test.ts`.

## Incoming changes preserved

| incoming change | present in resolved tree |
| --- | --- |
| `MAIL_FROM = "no-reply@1stcontact.io"` in top-level `[vars]` | yes — line 178 |
| `MAIL_FROM = "no-reply@1stcontact.io"` in `[env.production.vars]` | yes — line 308 |
| MAIL_FROM rationale comment block above `[vars]` | yes — lines 147–171 |
| `RESEND_API_KEY` named in neither environment | yes — no assignment in the file |
| the other ten files of `164e51cba7` | yes — applied without conflict |

`tests/test_UAT_FC_REQ-196_mail_configuration.test.ts` (incoming's own UAT)
requires `MAIL_FROM` declared on both sides with exactly that address, and
requires `RESEND_API_KEY` to be unassigned in `wrangler.toml`. The resolution
satisfies all three, and satisfies REQ-145's empty-top-level-ACCESS pin at the
same time — the two requirements are disjoint, which is why keeping both sides
is available here at all.

No test function was deleted or modified. No UAT was touched by this
resolution.

### Dropped hunk — `package.json` version scalar

`164e51cba7`'s `package.json` diff is a single incidental bump
`0.2.86 → 0.2.87`, not REQ-196 content. Its target was already superseded by
`4904947c85 chore(version): 0.2.89 for REQ-192 [FREE-CODED]`, a free-coded
commit this same resync queue cherry-picked onto the branch ahead of it.
Taking incoming would walk the published version number BACKWARDS by two
patches. This is the same ground recorded for every preceding version conflict
in this resync run (`resolve-377b581e-61a0becc61`, `-242a8bf969`,
`-b38dbdabf1`), applied consistently. No developer code rides on the hunk: the
version line is the whole of the file's incoming diff.

The enrichment's per-file rule ("intent unknown on one or both sides — take the
more recent commit by timestamp and flag for post-merge review") would, read
literally, have selected incoming for both files: `164e51cba7` is 11:57:29 and
the HEAD-side commits are 11:55:41 and 11:57:09. It was not followed, for
either file, because on inspection neither is a genuine intent collision — the
wrangler.toml hunk is two disjoint edits that textually abut, and
`package.json` is a monotone counter. Both files are flagged for post-merge
review as the enrichment requests.

## Verification limits

The tree was not built or tested. Resync is a caretaker process and must not
run test_fix; the workers-pool suites are also unrunnable in this session role.
Verification here is by reading: the incoming diff against the resolved file,
and the two UATs whose assertions bear on the conflicted hunk.

## Staging state

`git status --porcelain` shows no UU/AA/DU/UD lines. `CHERRY_PICK_HEAD`
(`164e51cba73f93580ddad61fe30a7332d891092f`) is intact; no `--continue`,
`--skip`, `--quit`, `--abort` or `reset` was issued.
