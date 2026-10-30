---
uid: report-ea4eae0f
id: REPORT-4561
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:00:09.871324+00:00'
updated_at: '2026-09-20T23:00:09.871324+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping
  ticket (§2e). Resolved per-fact in favour of OURS. Path is
  outside the resync branch's sparse-checkout cone (DOC-986
  §2/§4.1 — 11% of tracked files present), so the conflict lived
  in the index only with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`.

  Incoming is `b0af50e157` (2026-08-24T21:06:24), the immediate
  follow-up to `fe97d3bc34` in the same rename operation. Its
  entire payload is two frontmatter lines (2 insertions, 2
  deletions, no body change):

  | fact | base (`615faf7f10`) | incoming (`d4983a51e8`) | ours/HEAD (`29cfe4b6b9`) | taken |
  |---|---|---|---|---|
  | `title` | `…503s…` | `…dies…` | `…dies…` | not in conflict — identical |
  | `updated_at` | 21:06:15 | 21:06:24 | 2026-08-31T19:19:36 | OURS (later by 7 days) |

  Everything else on the incoming side is inherited base content
  that OURS supersedes with later-positioned intent:
  `status: draft` → `free_and_reconciled`; `last_field_updated:
  title` → `status`; the transient `fields.title` audit residue,
  absent from OURS; and the `## Not started — diagnosis only`
  body → the confirmed-root-cause and fix writeup.

  Ledger context (`xgd ticket history bug-6612c4b7`): the
  HEAD-side lineage opens at `501a0595d1` (`seed_local_overlay`,
  2026-08-26) — two days *after* this incoming commit — and the
  seed already carries the renamed title and the full writeup. It
  then advances through `28b2974007`, `a9021e4749`, `5a37f67dcd`
  (`bundled` → `free_and_reconciled`), `da99b79858`, `53a6dbb565`.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **preserved; no hunk
  dropped under BUG-1301 precedence.** The commit's sole
  substantive intent is the top-level `title:` rename, and the
  staged blob carries it verbatim:
  `control-app: Edit mode dies with Cloudflare 1102 — the preview
  render cache never hits in the Worker`.
  Its only other fact is an `updated_at` bump superseded by a
  later HEAD value. This commit touches no code, no test, and no
  UAT function, so nothing developer-authored was discarded.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached
HEAD` empty, `git status --porcelain` empty) — the incoming
rename had already landed on the main-rooted branch before this
resync began, so replaying it is a genuine no-op. Per the
instructions I did not call `--skip`; finalize's clean-staged-diff
detection should elect to skip the commit.

Per the conflict-intent enrichment this file remains flagged for
post-merge review: intent was unknown on one or both sides, so
resolution fell back to the timestamp/ledger-position rule.
