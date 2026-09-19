---
uid: report-bba23259
id: REPORT-4424
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:30:37.251822+00:00'
updated_at: '2026-09-19T12:30:37.251822+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — UU (index-only; the path is
  outside the sparse-checkout cone, so there were no working-tree markers).
  Intent/bookkeeping ticket → rule 2e, "one side is a strict superset of the
  other: keep the superset". Resolved with `git checkout --ours` +
  `git add --sparse`.

  Sides:
  - base (stage 1, `df6c01f`): the stub — `title: Untitled`, `status: draft`,
    body `(new ticket)`, with `chat_comment` already set.
  - incoming (stage 3, `8637212`, commit `87607d2` "xgd(ticket): update request
    request-8b33a146", authored 2026-09-01T14:16 -0700): the developer's **first
    draft** of the ticket — sets the title, `last_field_updated: title`,
    `updated_at: 2026-09-01T21:16:28`, still `status: draft`, and writes the
    initial body (What the client sees today / What changes / Technical
    consequences / Why free-coded / Test plan).
  - ours (stage 2, `c66d9bf`, "xgd(ticket): seed_local_overlay request
    request-8b33a146"): the **later revision of that same draft** —
    `updated_at: 2026-09-16T01:48:39`, `completed_at: 2026-09-14`,
    `status: bundled`, plus `fields.commits` (2 working shas), `version: 0.2.37`,
    `bundled_in: bundle-8e1807f6`.

  Per-fact comparison (`git diff 8637212 c66d9bf`):
  - `title` — identical on both sides. Not in conflict.
  - `chat_comment` — identical on both sides (landed by the preceding pick).
  - `updated_at` / `completed_at` / `last_field_updated` / `status` — same facts,
    different values; ours is the later state (2026-09-16 `bundled` vs
    2026-09-01 `draft`). Later position wins → ours.
  - `fields.commits`, `version`, `bundled_in` — present only on ours; incoming
    never touched them. Taking incoming would have dropped the bundle's own
    bookkeeping and reverted the ticket to `draft`.
  - body — ours is incoming's text, revised and extended. Every incoming section
    and paragraph is present; the differences are all additive or a later
    rewording of the same paragraph (see below).

## Incoming changes preserved

Every fact the incoming commit introduces is present in the resolved (ours)
version. Section by section, against `git show 87607d2 -- <file>`:

- `title: 'Library detail: render documents inline, with an expand-to-modal
  reader'` — present verbatim.
- "What the client sees today" — present verbatim.
- "What changes" + the content-type table — present; ours widens one row
  ("any other `text/*` (plain, csv, log)" → "…, plus JSON and XML") and adds a
  paragraph about the capped, scrolling window. Superset.
- "An expand button, top right of the reader" — present; ours rewords the same
  paragraph (adds "existing" modal shell and the "reused rather than rebuilt"
  clause). Same intent, later wording.
- "PDFs — yes, and cheaply" — present, including both stated limits; ours appends
  the "bytes are read once" sentence.
- "The row has to say what the bytes are" — present; ours rewraps it and replaces
  the trailing filename-fallback sentence with a fuller paragraph of its own
  ("Material that predates the field resolves its type from its own name"), so
  the fallback fact survives, expanded.
- "Rendered markdown is sanitized" — present, same `renderSafe` / `webui-chat` /
  DOMPurify reasoning; ours adds the description cell to the list of existing
  users, and adds the "repaints when the engines land" paragraph.
- "Plain text is not rendered as markdown" — present; ours keeps the identical
  reasoning and appends the HTML-is-not-run clause.
- "Why free-coded" — present verbatim.
- "Test plan" — present; ours keeps the same jsdom suite name
  (`tests/test_UAT_FC_REQ-172_library_document_preview.test.ts`) and expands the
  case list, and promotes incoming's "origin coverage extends the REQ-161
  material-surface suite" sentence into a named second suite
  (`tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts`) covering
  the same content-type-on-the-row and filename-fallback cases.

No incoming content was dropped. No hunk was dropped, so the BUG-1301 precedence
exception was not invoked. No code, test, or spec-ticket files were involved.

## Note for the finalize step

The resolution nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty):
HEAD already carries this commit's effect via the later `seed_local_overlay`
revision of the same ticket, so the pick is genuinely redundant rather than
discarded (STEP 3's distinction — the incoming content is *present* in HEAD, in
its later form, not absent). Staged and left for
`cherry_pick_finalize_resolution`; `CHERRY_PICK_HEAD` (`87607d2`) was not touched
and no `--continue`/`--skip`/`--abort` was run.
