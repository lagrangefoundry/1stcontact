---
uid: report-6eedd8fe
id: REPORT-4887
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:45:28.158291+00:00'
updated_at: '2026-09-23T23:45:28.158291+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Outside the sparse-checkout cone, so the conflict
  existed only in the index with no working-tree markers; resolved via
  `git checkout --ours` + `git add --sparse`.

  The two sides' **bodies are byte-identical**. `diff` of stage 2 vs stage 3
  isolates exactly three differing frontmatter lines, and all three record the
  same single fact — which bundle this ticket belongs to:

  | field | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `updated_at` | `2026-09-09T21:32:50` | `2026-09-02T23:17:43` |
  | `last_field_updated` | `status` | `body` |
  | `fields.bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` |

  Same field changed differently on both sides ⇒ genuine intent conflict, so
  rule 2e's per-fact "later-positioned intent wins" applies. Ours is later on
  both the ledger timestamp (09-09 vs 09-02) and the operation narrative:

  - HEAD side tip is `741376297f` (2026-09-09, `seed_local_overlay`), whose
    `last_field_updated: status` records a re-bundling that happened *after*
    the incoming side's last touch.
  - Incoming side tip is `9eb0360774` (2026-09-02). Its diff shows it never
    touched `bundled_in` at all — it changed `last_field_updated: status → body`
    and appended body text. `bundle-203b1dc2` on that side is carried-forward
    state from an earlier commit, not an assertion made by this commit.

  Corroborated independently of timestamps: `bundle-203b1dc2` was **archived**
  by `64a726eda0` (2026-09-08), while `bundle-87be4669` is the live bundle that
  reached reconciliation terminal state in `b5b8f4c7af` (2026-09-11). Taking
  incoming here would have repointed a live ticket at an archived bundle.

  `updated_at` and `last_field_updated` were taken from ours as well, since they
  are the bookkeeping that travels with the `bundled_in` fact; splitting them
  would leave the frontmatter internally inconsistent.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — **fully preserved, no hunk dropped.**
  `git show 9eb0360774 -- <path>` shows the incoming commit's only content
  change is the appended section *"Note: the account/business split came after
  this ticket"* (19 insertions). That section is present verbatim in the staged
  resolution (grep confirms 1 match), because HEAD had already integrated the
  identical text. The only thing not taken from the incoming side is its
  `bundled_in` value, which that commit did not author and which points at a
  since-archived bundle.

  No code, test, or UAT files were involved in this conflict, so the BUG-1301
  precedence exception was not invoked anywhere.

## Staging state

`git status --porcelain` reports no `UU`/`AA`/`DU`/`UD` lines. The remaining
`??` entries under `.xgd/tickets/cold/` are pre-existing untracked files
unrelated to this cherry-pick and were left alone. `CHERRY_PICK_HEAD` is intact
at `9eb0360774eb1788d9cd803699c170d4a5ba1836`; no `--continue`/`--skip`/
`--quit`/`--abort` was issued.

Because the resolution equals HEAD for the only conflicted file, the staged diff
for this pick may be empty — left for the finalize step to detect and skip, per
instruction.
