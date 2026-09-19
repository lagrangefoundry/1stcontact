---
uid: report-8a7ffe85
id: REPORT-4440
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:12:48.323880+00:00'
updated_at: '2026-09-19T13:12:48.323880+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **UU**, index-only (path is outside
  the sparse-checkout cone, so no working-tree markers existed). Intent/
  bookkeeping ticket → **rule 2e**, "one side is a strict superset" branch.
  Resolved `git checkout --ours` + `git add --sparse`.

  Ours: `xgd(ticket): seed_local_overlay request request-51514090`
  Theirs (incoming `d3c5e85`): `xgd(ticket): update request request-51514090`

  A direct ours-vs-theirs diff shows ours is a strict superset of theirs on
  every fact:
  - Body: the incoming commit's only substantive change — the new
    `## One honest caveat about "the last native dependency"` section — is
    already present in ours **byte-for-byte** (ours differs only by lacking a
    trailing newline).
  - Frontmatter: ours additionally carries `status: bundled` (theirs `draft`),
    `completed_at: 2026-09-14T10:29:03`, `last_field_updated: status`, a
    three-entry `fields.commits` list, `fields.version: 0.2.39`, and
    `fields.bundled_in: bundle-8e1807f6`. Theirs has none of these.
  - `updated_at`: ours `2026-09-16T01:48:38` vs theirs `2026-09-01T22:05:43` —
    ours is later, so the timeline rule points the same way as the superset
    rule.

  Taking incoming here would have regressed the ticket `bundled` → `draft` and
  dropped `commits`/`version`/`bundled_in` while gaining nothing, since the
  body text it contributes is already in HEAD. No fact from either side was
  lost.

## Incoming changes preserved

Confirmed. The incoming commit `d3c5e85` touched exactly one file and made two
changes: an `updated_at` bump and the appended "One honest caveat" body
section. The body section is present verbatim in the resolved file (HEAD's
`seed_local_overlay` commit had already carried it forward); the `updated_at`
value is superseded by ours, which is 15 days later.

No hunk was dropped under the BUG-1301 precedence exception — it does not
apply here.

## Note on the net-zero staged diff

The resolution nets to no diff vs HEAD, because HEAD already contained the
incoming commit's effect. Per STEP 4 this is the *redundant*, not the
*discarded*, case, and STEP 3's check distinguishes them: the incoming
commit's key change is demonstrably present in HEAD (quoted above), not
merely absent. `--skip` was not called; CHERRY_PICK_HEAD
(`d3c5e85be971ade247792a50bbdb08070e778e24`) is left intact for
`cherry_pick_finalize_resolution`.
