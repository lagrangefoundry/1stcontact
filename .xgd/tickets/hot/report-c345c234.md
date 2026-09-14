---
uid: report-c345c234
id: REPORT-4206
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:12:38.983017+00:00'
updated_at: '2026-09-14T03:12:38.983017+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, intent/bookkeeping
  ticket (rule 2e). Sparse-excluded, so the conflict existed only in the index
  with no working-tree markers; both sides inspected via `git show :1:/:2:/:3:`.
  **Resolution: took ours** (`git checkout --ours --ignore-skip-worktree-bits`
  then `git add --sparse`), because ours is a semantic strict superset of theirs.

  - Incoming = `87607d2e xgd(ticket): update request request-8b33a146` — the
    commit that first set the real title and wrote the ticket's initial body
    (`title: Untitled` → the real title; `(new ticket)` → a ~80-line body).
    Still `status: draft`.
  - Ours = `xgd(ticket): seed_local_overlay request request-8b33a146` — the
    fully-evolved overlay: same title, `status: bundled`,
    `last_field_updated: status`, `updated_at: 2026-09-11`, plus
    `fields.commits` (2 working shas), `fields.version: 0.2.37`,
    `fields.bundled_in: bundle-8e1807f6`, and a later, expanded revision of the
    same body.
  - No field or section is changed *differently* on the two sides, so the 2e
    per-fact timeline rule does not engage — this is the documented
    "one side is a strict superset" case. Accepting theirs would have rewound
    REQ-172 to its draft state and dropped the bundling bookkeeping this
    reconcile run depends on.

## Incoming changes preserved

Incoming commit 87607d2e touches one file and makes two kinds of change; both
are present in the resolution.

**Header fields.** `title: 'Library detail: render documents inline, with an
expand-to-modal reader'` is byte-identical in ours (it does not appear in an
ours-vs-theirs diff at all). `updated_at` / `last_field_updated` differ only
because ours carries the later `status` edit, which supersedes the incoming
`title` edit on the same two bookkeeping fields.

**Body.** Every section the incoming commit introduced is present in ours in a
later, revised-and-extended form — nothing was dropped, so no BUG-1301
precedence exception was needed and none is claimed:

| Incoming section | In ours |
|---|---|
| "What the client sees today" | identical |
| "What changes" render table | superset — adds the JSON/XML row |
| Expand button | same text, extended (shell reuse spelled out) |
| "PDFs — yes, and cheaply" | same text, extended (bytes read once) |
| "The row has to say what the bytes are" | same, with the BUG-41 provenance note |
| incoming's inline filename-fallback sentence | promoted in ours to its own section, "Material that predates the field resolves its type from its own name" |
| "Rendered markdown is sanitized" | same, extended (description cell) |
| "Plain text is not rendered as markdown" | same, merged with the HTML-not-run case |
| "Why free-coded" | identical |
| Test plan | superset — same jsdom suite plus the workerd content-type suite |

Ours additionally contains sections with no incoming counterpart (BUG-42 cold-load
repaint, SVG stays a picture, reader destroyed with the detail, missing-bytes
message, markdown seam re-export). These come from the ours side and are kept.

`git diff HEAD --stat` against the staged tree is empty. Per STEP 4 this is the
redundant-commit case (BUG-1109), distinguished from a discard by the check
above: the incoming commit's key change — the title and its body — is present in
HEAD via the overlay, not merely absent. `--skip` was NOT called; finalize will
detect the clean staged diff.

## Post-merge review flag

Auto-enrichment classified this as "intent unknown on one or both sides → flag
for post-merge review." Flagged here for completeness. Low risk: the resolved
file is byte-identical to HEAD, so nothing about REQ-172's state changed in this
cherry-pick. This is the second consecutive `update request-8b33a146` commit in
this bundle (after a705404b3e) to land as redundant against the same overlay.
