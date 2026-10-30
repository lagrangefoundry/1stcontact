---
uid: report-bf2004f4
id: REPORT-5359
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:57:28.595582+00:00'
updated_at: '2026-09-28T19:57:28.595582+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — REQ-159 ("The project knowledge
  base: tenant-scoped corpus, incremental index, and the map's two
  triggers"), class **UU**, intent/bookkeeping ticket → **STEP 2e**.
  Two conflict hunks, both inside the frontmatter (the status block, and the
  tail of `fields:`); the body and the rest of `fields:` auto-merged.
  Resolved per-fact to the later-positioned intent, which on every
  conflicting fact is **ours**. Staged blob `97468957db` (= stage 2).

  `CHERRY_PICK_HEAD` = `ad68bd8ac7`, `xgd(ticket): update request
  request-119dd4af`, authored Mon Aug 31 15:17:07 2026 -0700 (22:17:07 UTC),
  touching this one path (7 insertions, 2 deletions). The HEAD-side commit
  last touching this path is `c14f78d6d2`, `xgd(ticket): seed_local_overlay
  request request-119dd4af`, 2026-09-09 14:35:22 -0700 — nine days later.

  The incoming commit's whole content change is: a lifecycle advance
  `free_coding` → `free_coded` plus its `updated_at` stamp, and the addition
  of `fields.commits` and `fields.version`.

  | fact | ours | incoming | verdict |
  |---|---|---|---|
  | `status` | `bundled` | `free_coded` | **ours** — incoming is an earlier stage of the same lifecycle |
  | `updated_at` | `2026-09-09T21:32:49.729942+00:00` | `2026-08-31T22:17:07.072374+00:00` | **ours** — later by ~9 days |
  | `last_field_updated` | `status` | `status` | same value both sides; not contested |
  | `completed_at` | `null` | `null` | same value both sides; not contested |
  | `fields.bundled_in` | `bundle-87be4669` | *absent* | **ours** — incoming-wins would drop the bundle linkage |

  Ours is verified downstream, not merely later-stamped: `xgd ticket get
  bundle-87be4669` returns **BUNDLE-26**, status `free_and_reconciled`,
  titled "REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more" — so our
  `bundled` / `bundled_in` names a real bundle that has since completed its
  reconcile. Taking the incoming side wholesale would have regressed `status`
  off `bundled`, rewound `updated_at` by nine days, and orphaned the ticket
  from BUNDLE-26.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's "incoming changes
appear in the resolved version" check has no code-file subjects. The single
conflicted path is a bookkeeping ticket resolved under STEP 2e, whose rule is
per-fact later-intent — not incoming-wins — so the incoming side's *lifecycle*
values are correctly absent from the result.

The incoming commit's two **non-lifecycle** additions are both present in the
resolved file, and were never contested — git merged them cleanly outside the
conflict regions because ours already carries the identical values:

- `fields.commits[0].working_sha: 115f0d39ec5f8787751f144cda8b5d3c6279fbf9`
  (with `reconcile_sha: null`, `main_sha: null`) — present, identical;
- `fields.version: 0.2.23` — present, identical.

No BUG-1301 PRECEDENCE exception was invoked; no hunk was dropped on
already-integrated grounds; no test function was deleted.

## Verification

- Frontmatter re-parsed with `yaml.safe_load` after the edit: `status:
  bundled`, `updated_at: 2026-09-09T21:32:49.729942+00:00`, and `fields`
  carrying `commits`, `version: 0.2.23`, `bundled_in: bundle-87be4669`.
- `grep -c '^<<<<<<<'` → 0; no conflict markers remain.
- Resolved working file diffs byte-identical against stage 2.
- `git status --porcelain` — empty; no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` — empty; no unmerged stages.
- `git ls-files -s <path>` — `100644 97468957db… 0`, staged at stage 0.
- `git diff --cached HEAD --name-only` — empty, so **this pick is now empty**;
  per STEP 4 no `--skip` was issued — finalize will detect the clean staged
  diff and skip the commit.
- `git rev-parse --verify CHERRY_PICK_HEAD` — still `ad68bd8ac7`.

Staging required `git add --sparse`: `.xgd/tickets` is outside this worktree's
sparse-checkout cone (DOC-986 §2/§4.1), so a plain `git add` refuses the path.
Each git write was issued as the sole content of its own call (BUG-1294).

## Sequencer

Deliberately **not** advanced: no `--continue`, no `--skip`, no `--quit`, no
`--abort`, and no other command that resets or forgets the in-progress
cherry-pick.
