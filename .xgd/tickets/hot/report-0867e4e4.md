---
uid: report-0867e4e4
id: REPORT-5360
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:59:38.654779+00:00'
updated_at: '2026-09-28T19:59:38.654779+00:00'
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
  One conflict hunk, in the frontmatter status block; the `fields:` block and
  the whole body auto-merged. Resolved per-fact to the later-positioned
  intent, which on every conflicting fact is **ours**. Staged blob
  `97468957db` (= stage 2).

  `CHERRY_PICK_HEAD` = `3013025820`, `xgd(ticket): update request
  request-119dd4af`, authored Mon Aug 31 15:17:10 2026 -0700 (22:17:10 UTC),
  touching this one path (2 insertions, 2 deletions).

  The incoming commit's entire content change is a **bookkeeping stamp for a
  `story_points` touch**: `updated_at` 22:17:07 → 22:17:10 and
  `last_field_updated` `status` → `story_points`. The `story_points` value
  itself is **unchanged** — `13` on base, ours and incoming alike — so the
  commit carries no field content, only the marker recording that the field
  was written.

  | fact | ours | incoming | verdict |
  |---|---|---|---|
  | `status` | `bundled` | `free_coded` | **ours** — incoming is an earlier stage of the same lifecycle |
  | `updated_at` | `2026-09-09T21:32:49.729942+00:00` | `2026-08-31T22:17:10.902125+00:00` | **ours** — later by ~9 days |
  | `last_field_updated` | `status` | `story_points` | **ours** — this marker names the field touched by the *most recent* write; ours holds that write (the `status` → `bundled` transition of 09-09), so `story_points` would contradict our own `updated_at` and `status` |
  | `completed_at` | `null` | `null` | same value both sides; not contested |

  Ours is verified downstream, not merely later-stamped: `xgd ticket get
  bundle-87be4669` returns **BUNDLE-26**, status `free_and_reconciled`,
  titled "REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more" — our
  `bundled` / `fields.bundled_in` names a real bundle that has since
  completed its reconcile. Taking the incoming side wholesale would have
  regressed `status` off `bundled`, rewound `updated_at` by nine days, and
  orphaned the ticket from BUNDLE-26.

  This is the second consecutive pick against this path in the resync queue
  (the prior one was `ad68bd8ac7`, the `free_coding` → `free_coded` advance).
  Both are pre-bundle bookkeeping stamps from the same 2026-08-31 session and
  both resolve ours-wins for the same reason.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's "incoming changes
appear in the resolved version" check has no code-file subjects. The single
conflicted path is a bookkeeping ticket resolved under STEP 2e, whose rule is
per-fact later-intent — not incoming-wins — so the incoming side's stamp
values are correctly absent from the result.

Nothing substantive was dropped: the incoming commit's only *content*-bearing
field, `fields.story_points: 13`, is present and identical in the resolved
file. It was never contested — git merged the `fields:` block cleanly,
because base, ours and incoming all carry the same value.

No BUG-1301 PRECEDENCE exception was invoked; no hunk was dropped on
already-integrated grounds; no test function was deleted.

## Verification

- Frontmatter re-parsed with `yaml.safe_load` after the edit: `status:
  bundled`, `updated_at: 2026-09-09T21:32:49.729942+00:00`,
  `last_field_updated: status`, `completed_at: None`; `fields` carries
  `story_points: 13`, `commits[0].working_sha 115f0d39ec…`,
  `version: 0.2.23`, `bundled_in: bundle-87be4669`.
- `grep -n '<<<<<<<\|=======\|>>>>>>>'` — no match; no conflict markers remain.
- Resolved working file diffs byte-identical against stage 2.
- `git status --porcelain` — empty; no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` — empty; no unmerged stages.
- `git ls-files -s <path>` — `100644 97468957db… 0`, staged at stage 0.
- `git diff --cached HEAD --name-only` — empty, so **this pick is now empty**;
  per STEP 4 no `--skip` was issued — finalize will detect the clean staged
  diff and skip the commit.
- `git rev-parse --verify CHERRY_PICK_HEAD` — still `3013025820`.

Staging required `git add --sparse`: `.xgd/tickets` is outside this worktree's
sparse-checkout cone (DOC-986 §2/§4.1), so a plain `git add` refuses the path.
Each git write was issued as the sole content of its own call (BUG-1294).

## Sequencer

Deliberately **not** advanced: no `--continue`, no `--skip`, no `--quit`, no
`--abort`, and no other command that resets or forgets the in-progress
cherry-pick.
