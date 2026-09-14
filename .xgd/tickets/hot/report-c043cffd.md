---
uid: report-c043cffd
id: REPORT-4211
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:30:04.261051+00:00'
updated_at: '2026-09-14T03:30:04.261051+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — UU, sparse-excluded (index-only conflict,
  no working-tree markers). Rule 2e (intent/bookkeeping ticket, `request-*`):
  strict-superset case. Resolved to OURS via
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`.

  Three-stage comparison (`git show :1:/:2:/:3:`) showed the ours and theirs bodies
  are byte-identical apart from a trailing newline; the ONLY real divergence is
  frontmatter bookkeeping:
  - theirs: `updated_at: 2026-09-01T21:33:14`, `status: free_coding`,
    `last_field_updated: body`
  - ours:  `updated_at: 2026-09-11T18:53:54`, `status: bundled`,
    `last_field_updated: status`, plus `fields.commits` (two working_sha entries),
    `fields.version: 0.2.37`, `fields.bundled_in: bundle-8e1807f6`

  Ours is the later-positioned intent on every contested field AND a strict
  superset (it carries the incoming body in full plus bundling state theirs never
  had). Taking theirs would have regressed `status: bundled` back to `free_coding`
  and dropped the commits/version/bundled_in fields recorded by this very bundle.

## Incoming changes preserved

The incoming commit 4305ac9 (`xgd(ticket): update request request-8b33a146`,
83 insertions / 30 deletions) is a pure body rewrite plus the two frontmatter
timestamp/status fields. Its body content is already present in HEAD verbatim —
the seeded local overlay (`xgd(ticket): seed_local_overlay request
request-8b33a146`) carried it in ahead of this cherry-pick.

Verified positively, not by assumption:
- `diff ours theirs` shows zero body hunks — every one of the incoming diff's
  prose changes is in the ours side.
- Distinctive incoming-only strings all found in `git show HEAD:<path>`:
  "An SVG stays a picture", `markdownReady`, `bug32-webui-scope-rebrand`,
  `test_UAT_FC_REQ-172_material_content_type` (4/4 match).

No developer content was discarded. No hunk was dropped under the BUG-1301
precedence exception (none applied).

## Note on the staged diff

`git diff --cached HEAD` is empty: this commit's effect already landed through the
seeded overlay, so the resolution is genuinely redundant rather than discarded —
STEP 3's check distinguishes these, and it lands on "redundant" (incoming changes
present in HEAD). Per STEP 4 no `--skip` was issued; CHERRY_PICK_HEAD is intact
(4305ac9) for `cherry_pick_finalize_resolution` to handle.
